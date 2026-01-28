"""
REPORT GENERATOR SERVICE
Creates professional pentest reports from assessment data

Output formats:
- JSON (machine-readable)
- Markdown (human-readable)
- Executive Summary
- Technical Detail Report
"""
from typing import Optional, List, Dict, Any
from datetime import datetime
import json
from enum import Enum

from models.assessment import Assessment
from models.target import Target
from models.finding import Finding, Severity
from models.evidence import Evidence

import logging

logger = logging.getLogger(__name__)


class ReportFormat(str, Enum):
    """Report output formats"""
    JSON = "json"
    MARKDOWN = "markdown"
    EXECUTIVE = "executive"
    TECHNICAL = "technical"


class ReportGenerator:
    """
    REPORT GENERATOR

    Creates professional penetration testing reports following
    industry standards (PTES, OWASP).

    Report sections:
    1. Executive Summary
    2. Scope and Methodology
    3. Findings Summary
    4. Detailed Findings
    5. Evidence
    6. Recommendations
    7. Appendices
    """

    def __init__(
        self,
        assessment: Assessment,
        targets: List[Target],
        findings: List[Finding],
        evidence: List[Evidence]
    ):
        self.assessment = assessment
        self.targets = targets
        self.findings = findings
        self.evidence = evidence

        # Sort findings by severity
        severity_order = {
            Severity.CRITICAL: 0,
            Severity.HIGH: 1,
            Severity.MEDIUM: 2,
            Severity.LOW: 3,
            Severity.INFO: 4
        }
        self.findings = sorted(
            findings,
            key=lambda f: severity_order.get(f.severity, 5)
        )

    def generate(self, format: ReportFormat = ReportFormat.MARKDOWN) -> str:
        """Generate report in specified format"""
        if format == ReportFormat.JSON:
            return self._generate_json()
        elif format == ReportFormat.MARKDOWN:
            return self._generate_markdown()
        elif format == ReportFormat.EXECUTIVE:
            return self._generate_executive_summary()
        elif format == ReportFormat.TECHNICAL:
            return self._generate_technical_report()
        raise ValueError(f"Unsupported format: {format}")

    def _generate_json(self) -> str:
        """Generate JSON report"""
        report = {
            "report_metadata": {
                "generated_at": datetime.utcnow().isoformat(),
                "report_type": "penetration_test",
                "framework": self.assessment.methodology
            },
            "assessment": self.assessment.model_dump(),
            "scope": {
                "targets": [t.model_dump() for t in self.targets],
                "target_count": len(self.targets)
            },
            "findings": {
                "items": [f.model_dump() for f in self.findings],
                "summary": self._get_findings_summary()
            },
            "evidence": {
                "items": [e.model_dump() for e in self.evidence],
                "count": len(self.evidence)
            }
        }
        return json.dumps(report, indent=2, default=str)

    def _generate_markdown(self) -> str:
        """Generate Markdown report"""
        lines = []

        # Header
        lines.append(f"# Security Assessment Report")
        lines.append(f"## {self.assessment.name}")
        lines.append("")
        lines.append(f"**Client:** {self.assessment.client_name}")
        lines.append(f"**Date:** {datetime.utcnow().strftime('%Y-%m-%d')}")
        lines.append(f"**Methodology:** {self.assessment.methodology}")
        lines.append("")
        lines.append("---")
        lines.append("")

        # Executive Summary
        lines.append("## Executive Summary")
        lines.append("")
        summary = self._get_findings_summary()
        lines.append(f"This assessment identified **{summary['total']} findings** across the in-scope targets:")
        lines.append("")
        lines.append(f"| Severity | Count |")
        lines.append(f"|----------|-------|")
        lines.append(f"| Critical | {summary['critical']} |")
        lines.append(f"| High | {summary['high']} |")
        lines.append(f"| Medium | {summary['medium']} |")
        lines.append(f"| Low | {summary['low']} |")
        lines.append(f"| Info | {summary['info']} |")
        lines.append("")

        # Risk Rating
        risk_rating = self._calculate_risk_rating(summary)
        lines.append(f"**Overall Risk Rating:** {risk_rating}")
        lines.append("")
        lines.append("---")
        lines.append("")

        # Scope
        lines.append("## Scope")
        lines.append("")
        lines.append("### In-Scope Targets")
        lines.append("")
        for target in self.targets:
            lines.append(f"- `{target.value}` ({target.target_type.value})")
        lines.append("")
        lines.append("---")
        lines.append("")

        # Findings
        lines.append("## Findings")
        lines.append("")

        for i, finding in enumerate(self.findings, 1):
            lines.append(f"### {i}. {finding.title}")
            lines.append("")
            lines.append(f"**Severity:** {finding.severity.value.upper()}")
            if finding.cvss_score:
                lines.append(f"**CVSS Score:** {finding.cvss_score}")
            lines.append(f"**Category:** {finding.category.value}")
            lines.append("")
            lines.append("**Description:**")
            lines.append(finding.description)
            lines.append("")

            if finding.affected_component:
                lines.append(f"**Affected Component:** {finding.affected_component}")
                lines.append("")

            if finding.proof_of_concept:
                lines.append("**Proof of Concept:**")
                lines.append("```")
                lines.append(finding.proof_of_concept)
                lines.append("```")
                lines.append("")

            if finding.business_impact:
                lines.append("**Business Impact:**")
                lines.append(finding.business_impact)
                lines.append("")

            if finding.recommendation:
                lines.append("**Recommendation:**")
                lines.append(finding.recommendation)
                lines.append("")

            if finding.references:
                lines.append("**References:**")
                for ref in finding.references:
                    lines.append(f"- {ref}")
                lines.append("")

            lines.append("---")
            lines.append("")

        # Footer
        lines.append("## Report Information")
        lines.append("")
        lines.append(f"- **Generated:** {datetime.utcnow().isoformat()}")
        lines.append(f"- **Assessment ID:** {self.assessment.id}")
        lines.append(f"- **Evidence Items:** {len(self.evidence)}")
        lines.append("")

        return "\n".join(lines)

    def _generate_executive_summary(self) -> str:
        """Generate executive-level summary"""
        summary = self._get_findings_summary()
        risk_rating = self._calculate_risk_rating(summary)

        lines = []
        lines.append(f"# Executive Summary: {self.assessment.name}")
        lines.append("")
        lines.append(f"**Client:** {self.assessment.client_name}")
        lines.append(f"**Assessment Period:** {self.assessment.start_date} - {self.assessment.end_date}")
        lines.append("")
        lines.append("## Key Findings")
        lines.append("")
        lines.append(f"The security assessment of {self.assessment.client_name}'s systems identified "
                    f"**{summary['total']} security issues**, with **{summary['critical']} critical** "
                    f"and **{summary['high']} high** severity findings requiring immediate attention.")
        lines.append("")
        lines.append(f"**Overall Risk Rating: {risk_rating}**")
        lines.append("")

        # Top critical/high findings
        critical_high = [f for f in self.findings
                        if f.severity in [Severity.CRITICAL, Severity.HIGH]]

        if critical_high:
            lines.append("## Priority Items")
            lines.append("")
            for finding in critical_high[:5]:  # Top 5
                lines.append(f"- **{finding.title}** ({finding.severity.value.upper()})")
            lines.append("")

        lines.append("## Recommendations")
        lines.append("")
        lines.append("1. Address all Critical and High severity findings immediately")
        lines.append("2. Implement recommended remediations in priority order")
        lines.append("3. Schedule retest after remediation")
        lines.append("")

        return "\n".join(lines)

    def _generate_technical_report(self) -> str:
        """Generate detailed technical report"""
        # Full markdown report with all evidence
        base_report = self._generate_markdown()

        # Add evidence appendix
        lines = [base_report]
        lines.append("")
        lines.append("## Appendix: Evidence")
        lines.append("")

        for i, evidence in enumerate(self.evidence, 1):
            lines.append(f"### Evidence {i}: {evidence.title}")
            lines.append("")
            lines.append(f"**Type:** {evidence.evidence_type.value}")
            lines.append(f"**Timestamp:** {evidence.timestamp}")
            lines.append(f"**Hash:** `{evidence.content_hash}`")
            lines.append("")
            if evidence.content:
                lines.append("```")
                lines.append(evidence.content[:2000])  # Limit size
                if len(evidence.content) > 2000:
                    lines.append("... (truncated)")
                lines.append("```")
            lines.append("")

        return "\n".join(lines)

    def _get_findings_summary(self) -> Dict[str, int]:
        """Get summary count by severity"""
        summary = {
            "critical": 0,
            "high": 0,
            "medium": 0,
            "low": 0,
            "info": 0,
            "total": len(self.findings)
        }

        for finding in self.findings:
            if finding.severity == Severity.CRITICAL:
                summary["critical"] += 1
            elif finding.severity == Severity.HIGH:
                summary["high"] += 1
            elif finding.severity == Severity.MEDIUM:
                summary["medium"] += 1
            elif finding.severity == Severity.LOW:
                summary["low"] += 1
            else:
                summary["info"] += 1

        return summary

    def _calculate_risk_rating(self, summary: Dict[str, int]) -> str:
        """Calculate overall risk rating"""
        if summary["critical"] > 0:
            return "CRITICAL"
        elif summary["high"] > 2:
            return "HIGH"
        elif summary["high"] > 0 or summary["medium"] > 3:
            return "MEDIUM"
        elif summary["medium"] > 0 or summary["low"] > 5:
            return "LOW"
        return "MINIMAL"
