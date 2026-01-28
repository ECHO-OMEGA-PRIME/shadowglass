"""
FINDINGS API
Vulnerability and issue tracking with Firebase Cloud Sync
"""
import asyncio
from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from datetime import datetime
from loguru import logger

from models.finding import (
    Finding,
    FindingCreate,
    FindingUpdate,
    FindingStatus,
    FindingCategory,
    Severity
)
from core.auth import get_current_user
from services.data_store import get_data_store
from services.firebase_service import get_firebase_service

router = APIRouter(prefix="/findings", tags=["Findings"])


def _sync_to_cloud(finding: Finding):
    """Background sync to Firebase (fire and forget)"""
    firebase = get_firebase_service()
    if firebase.is_available:
        asyncio.create_task(firebase.sync_finding(finding.model_dump()))
        logger.debug(f"Cloud sync initiated for finding {finding.id}")


@router.post("/", response_model=Finding)
async def create_finding(
    data: FindingCreate,
    user: dict = Depends(get_current_user)
) -> Finding:
    """
    Create new security finding

    Document vulnerabilities discovered during assessment.
    """
    store = get_data_store()

    # Verify assessment exists
    assessment = store.get_assessment(data.assessment_id)
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")

    finding = Finding(
        assessment_id=data.assessment_id,
        target_id=data.target_id,
        title=data.title,
        description=data.description,
        severity=data.severity,
        category=data.category,
        affected_component=data.affected_component,
        attack_vector=data.attack_vector,
        proof_of_concept=data.proof_of_concept,
        business_impact=data.business_impact,
        recommendation=data.recommendation,
        references=data.references or [],
        cvss_score=data.cvss_score,
        cvss_vector=data.cvss_vector,
        created_by=user.get("user_id", ""),
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )

    saved = store.save_finding(finding)
    _sync_to_cloud(saved)  # Cloud sync
    return saved


@router.get("/assessment/{assessment_id}", response_model=List[Finding])
async def list_findings(
    assessment_id: str,
    severity: Optional[Severity] = None,
    category: Optional[FindingCategory] = None,
    status: Optional[FindingStatus] = None,
    user: dict = Depends(get_current_user)
) -> List[Finding]:
    """List all findings for an assessment"""
    store = get_data_store()
    findings = store.get_findings_for_assessment(assessment_id)

    if severity:
        findings = [f for f in findings if f.severity == severity]
    if category:
        findings = [f for f in findings if f.category == category]
    if status:
        findings = [f for f in findings if f.status == status]

    # Sort by severity (critical first)
    severity_order = {
        Severity.CRITICAL: 0,
        Severity.HIGH: 1,
        Severity.MEDIUM: 2,
        Severity.LOW: 3,
        Severity.INFO: 4
    }
    findings.sort(key=lambda f: severity_order.get(f.severity, 5))

    return findings


@router.get("/{finding_id}", response_model=Finding)
async def get_finding(
    finding_id: str,
    user: dict = Depends(get_current_user)
) -> Finding:
    """Get finding by ID"""
    store = get_data_store()
    finding = store.get_finding(finding_id)

    if not finding:
        raise HTTPException(status_code=404, detail="Finding not found")

    return finding


@router.patch("/{finding_id}", response_model=Finding)
async def update_finding(
    finding_id: str,
    data: FindingUpdate,
    user: dict = Depends(get_current_user)
) -> Finding:
    """Update finding details"""
    store = get_data_store()
    finding = store.get_finding(finding_id)

    if not finding:
        raise HTTPException(status_code=404, detail="Finding not found")

    # Update fields
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(finding, field, value)

    finding.updated_at = datetime.utcnow()

    saved = store.save_finding(finding)
    _sync_to_cloud(saved)  # Cloud sync
    return saved


@router.post("/{finding_id}/confirm", response_model=Finding)
async def confirm_finding(
    finding_id: str,
    user: dict = Depends(get_current_user)
) -> Finding:
    """Mark finding as confirmed vulnerability"""
    store = get_data_store()
    finding = store.get_finding(finding_id)

    if not finding:
        raise HTTPException(status_code=404, detail="Finding not found")

    finding.status = FindingStatus.CONFIRMED
    finding.updated_at = datetime.utcnow()

    saved = store.save_finding(finding)
    _sync_to_cloud(saved)  # Cloud sync
    return saved


@router.post("/{finding_id}/false-positive", response_model=Finding)
async def mark_false_positive(
    finding_id: str,
    user: dict = Depends(get_current_user)
) -> Finding:
    """Mark finding as false positive"""
    store = get_data_store()
    finding = store.get_finding(finding_id)

    if not finding:
        raise HTTPException(status_code=404, detail="Finding not found")

    finding.status = FindingStatus.FALSE_POSITIVE
    finding.updated_at = datetime.utcnow()

    saved = store.save_finding(finding)
    _sync_to_cloud(saved)  # Cloud sync
    return saved


@router.delete("/{finding_id}")
async def delete_finding(
    finding_id: str,
    user: dict = Depends(get_current_user)
) -> dict:
    """Delete finding"""
    store = get_data_store()

    if not store.get_finding(finding_id):
        raise HTTPException(status_code=404, detail="Finding not found")

    store.delete_finding(finding_id)

    return {"deleted": True, "finding_id": finding_id}


@router.post("/{finding_id}/link-evidence")
async def link_evidence_to_finding(
    finding_id: str,
    evidence_id: str,
    user: dict = Depends(get_current_user)
) -> Finding:
    """Link evidence to a finding"""
    store = get_data_store()

    finding = store.get_finding(finding_id)
    if not finding:
        raise HTTPException(status_code=404, detail="Finding not found")

    evidence = store.get_evidence(evidence_id)
    if not evidence:
        raise HTTPException(status_code=404, detail="Evidence not found")

    if evidence_id not in finding.evidence_ids:
        finding.evidence_ids.append(evidence_id)
        finding.updated_at = datetime.utcnow()
        saved = store.save_finding(finding)
        _sync_to_cloud(saved)  # Cloud sync

    # Also update evidence
    evidence.finding_id = finding_id
    store.save_evidence(evidence)

    return finding


@router.get("/assessment/{assessment_id}/summary")
async def get_findings_summary(
    assessment_id: str,
    user: dict = Depends(get_current_user)
) -> dict:
    """Get findings summary for assessment"""
    store = get_data_store()
    findings = store.get_findings_for_assessment(assessment_id)

    summary = {
        "total": len(findings),
        "by_severity": {
            "critical": len([f for f in findings if f.severity == Severity.CRITICAL]),
            "high": len([f for f in findings if f.severity == Severity.HIGH]),
            "medium": len([f for f in findings if f.severity == Severity.MEDIUM]),
            "low": len([f for f in findings if f.severity == Severity.LOW]),
            "info": len([f for f in findings if f.severity == Severity.INFO]),
        },
        "by_status": {
            "draft": len([f for f in findings if f.status == FindingStatus.DRAFT]),
            "confirmed": len([f for f in findings if f.status == FindingStatus.CONFIRMED]),
            "false_positive": len([f for f in findings if f.status == FindingStatus.FALSE_POSITIVE]),
            "remediated": len([f for f in findings if f.status == FindingStatus.REMEDIATED]),
        },
        "by_category": {}
    }

    # Count by category
    for finding in findings:
        cat = finding.category.value
        summary["by_category"][cat] = summary["by_category"].get(cat, 0) + 1

    return summary
