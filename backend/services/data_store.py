"""
In-Memory Data Store
For development - replace with Firestore in production
"""
from typing import Dict, List, Optional
from models.assessment import Assessment
from models.target import Target
from models.finding import Finding
from models.evidence import Evidence


class DataStore:
    """
    Simple in-memory data store
    Replace with Firebase Firestore for production
    """

    def __init__(self):
        self._assessments: Dict[str, Assessment] = {}
        self._targets: Dict[str, Target] = {}
        self._findings: Dict[str, Finding] = {}
        self._evidence: Dict[str, Evidence] = {}

    # Assessments
    def save_assessment(self, assessment: Assessment) -> Assessment:
        self._assessments[assessment.id] = assessment
        return assessment

    def get_assessment(self, assessment_id: str) -> Optional[Assessment]:
        return self._assessments.get(assessment_id)

    def get_assessments(self, user_id: Optional[str] = None) -> List[Assessment]:
        assessments = list(self._assessments.values())
        if user_id:
            assessments = [a for a in assessments if a.created_by == user_id]
        return sorted(assessments, key=lambda a: a.created_at, reverse=True)

    def delete_assessment(self, assessment_id: str) -> bool:
        if assessment_id in self._assessments:
            del self._assessments[assessment_id]
            # Cascade delete targets, findings, evidence
            self._targets = {k: v for k, v in self._targets.items()
                           if v.assessment_id != assessment_id}
            self._findings = {k: v for k, v in self._findings.items()
                            if v.assessment_id != assessment_id}
            self._evidence = {k: v for k, v in self._evidence.items()
                            if v.assessment_id != assessment_id}
            return True
        return False

    # Targets
    def save_target(self, target: Target) -> Target:
        self._targets[target.id] = target
        return target

    def get_target(self, target_id: str) -> Optional[Target]:
        return self._targets.get(target_id)

    def get_targets_for_assessment(self, assessment_id: str) -> List[Target]:
        return [t for t in self._targets.values() if t.assessment_id == assessment_id]

    def delete_target(self, target_id: str) -> bool:
        if target_id in self._targets:
            del self._targets[target_id]
            return True
        return False

    # Findings
    def save_finding(self, finding: Finding) -> Finding:
        self._findings[finding.id] = finding
        return finding

    def get_finding(self, finding_id: str) -> Optional[Finding]:
        return self._findings.get(finding_id)

    def get_findings_for_assessment(self, assessment_id: str) -> List[Finding]:
        return [f for f in self._findings.values() if f.assessment_id == assessment_id]

    def delete_finding(self, finding_id: str) -> bool:
        if finding_id in self._findings:
            del self._findings[finding_id]
            return True
        return False

    # Evidence
    def save_evidence(self, evidence: Evidence) -> Evidence:
        self._evidence[evidence.id] = evidence
        return evidence

    def get_evidence(self, evidence_id: str) -> Optional[Evidence]:
        return self._evidence.get(evidence_id)

    def get_evidence_for_assessment(self, assessment_id: str) -> List[Evidence]:
        return [e for e in self._evidence.values() if e.assessment_id == assessment_id]

    def get_evidence_for_finding(self, finding_id: str) -> List[Evidence]:
        return [e for e in self._evidence.values() if e.finding_id == finding_id]

    def delete_evidence(self, evidence_id: str) -> bool:
        if evidence_id in self._evidence:
            del self._evidence[evidence_id]
            return True
        return False


# Global data store instance
_store: Optional[DataStore] = None


def get_data_store() -> DataStore:
    """Get or create data store instance"""
    global _store
    if _store is None:
        _store = DataStore()
    return _store
