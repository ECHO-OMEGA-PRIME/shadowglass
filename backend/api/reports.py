"""
REPORTS API
Professional pentest report generation
"""
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import PlainTextResponse
from typing import Optional
from datetime import datetime

from core.auth import get_current_user
from services.data_store import get_data_store
from services.report_generator import ReportGenerator, ReportFormat

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get("/{assessment_id}/generate")
async def generate_report(
    assessment_id: str,
    format: ReportFormat = ReportFormat.MARKDOWN,
    user: dict = Depends(get_current_user)
) -> dict:
    """
    Generate professional pentest report

    Formats:
    - json: Machine-readable full report
    - markdown: Human-readable full report
    - executive: Executive summary
    - technical: Full technical report with evidence
    """
    store = get_data_store()

    # Get assessment
    assessment = store.get_assessment(assessment_id)
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")

    # Get related data
    targets = store.get_targets_for_assessment(assessment_id)
    findings = store.get_findings_for_assessment(assessment_id)
    evidence = store.get_evidence_for_assessment(assessment_id)

    # Generate report
    generator = ReportGenerator(
        assessment=assessment,
        targets=targets,
        findings=findings,
        evidence=evidence
    )

    report_content = generator.generate(format=format)

    return {
        "assessment_id": assessment_id,
        "assessment_name": assessment.name,
        "client": assessment.client_name,
        "format": format.value,
        "generated_at": datetime.utcnow().isoformat(),
        "content": report_content
    }


@router.get("/{assessment_id}/download")
async def download_report(
    assessment_id: str,
    format: ReportFormat = ReportFormat.MARKDOWN,
    user: dict = Depends(get_current_user)
):
    """Download report as file"""
    store = get_data_store()

    # Get assessment
    assessment = store.get_assessment(assessment_id)
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")

    # Get related data
    targets = store.get_targets_for_assessment(assessment_id)
    findings = store.get_findings_for_assessment(assessment_id)
    evidence = store.get_evidence_for_assessment(assessment_id)

    # Generate report
    generator = ReportGenerator(
        assessment=assessment,
        targets=targets,
        findings=findings,
        evidence=evidence
    )

    report_content = generator.generate(format=format)

    # Determine content type and extension
    if format == ReportFormat.JSON:
        content_type = "application/json"
        extension = "json"
    else:
        content_type = "text/markdown"
        extension = "md"

    filename = f"{assessment.name.replace(' ', '_')}_{format.value}_{datetime.utcnow().strftime('%Y%m%d')}.{extension}"

    return PlainTextResponse(
        content=report_content,
        media_type=content_type,
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        }
    )


@router.get("/{assessment_id}/executive-summary")
async def get_executive_summary(
    assessment_id: str,
    user: dict = Depends(get_current_user)
) -> dict:
    """
    Get executive summary

    High-level overview for management.
    """
    store = get_data_store()

    # Get assessment
    assessment = store.get_assessment(assessment_id)
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")

    # Get related data
    targets = store.get_targets_for_assessment(assessment_id)
    findings = store.get_findings_for_assessment(assessment_id)
    evidence = store.get_evidence_for_assessment(assessment_id)

    # Generate executive summary
    generator = ReportGenerator(
        assessment=assessment,
        targets=targets,
        findings=findings,
        evidence=evidence
    )

    summary = generator.generate(format=ReportFormat.EXECUTIVE)

    return {
        "assessment_id": assessment_id,
        "type": "executive_summary",
        "content": summary
    }


@router.get("/{assessment_id}/findings-table")
async def get_findings_table(
    assessment_id: str,
    user: dict = Depends(get_current_user)
) -> dict:
    """
    Get findings as structured table

    Useful for importing into other tools.
    """
    store = get_data_store()

    findings = store.get_findings_for_assessment(assessment_id)

    table = []
    for i, finding in enumerate(findings, 1):
        table.append({
            "id": i,
            "title": finding.title,
            "severity": finding.severity.value,
            "category": finding.category.value,
            "status": finding.status.value,
            "cvss": finding.cvss_score,
            "affected": finding.affected_component,
            "recommendation": finding.recommendation
        })

    return {
        "assessment_id": assessment_id,
        "findings_count": len(table),
        "findings": table
    }


@router.get("/{assessment_id}/compliance-checklist")
async def get_compliance_checklist(
    assessment_id: str,
    framework: str = "OWASP",
    user: dict = Depends(get_current_user)
) -> dict:
    """
    Get compliance checklist based on findings

    Maps findings to compliance frameworks.
    """
    store = get_data_store()

    findings = store.get_findings_for_assessment(assessment_id)

    # OWASP Top 10 mapping
    owasp_items = {
        "A01_Broken_Access_Control": {"name": "Broken Access Control", "findings": []},
        "A02_Cryptographic_Failures": {"name": "Cryptographic Failures", "findings": []},
        "A03_Injection": {"name": "Injection", "findings": []},
        "A04_Insecure_Design": {"name": "Insecure Design", "findings": []},
        "A05_Security_Misconfiguration": {"name": "Security Misconfiguration", "findings": []},
        "A06_Vulnerable_Components": {"name": "Vulnerable & Outdated Components", "findings": []},
        "A07_Auth_Failures": {"name": "Identification & Authentication Failures", "findings": []},
        "A08_Data_Integrity_Failures": {"name": "Software & Data Integrity Failures", "findings": []},
        "A09_Logging_Failures": {"name": "Security Logging & Monitoring Failures", "findings": []},
        "A10_SSRF": {"name": "Server-Side Request Forgery", "findings": []},
        "Other": {"name": "Other", "findings": []}
    }

    # Map findings to categories
    for finding in findings:
        cat = finding.category.value
        if cat in owasp_items:
            owasp_items[cat]["findings"].append({
                "title": finding.title,
                "severity": finding.severity.value
            })

    # Calculate status
    checklist = []
    for key, item in owasp_items.items():
        if key == "Other":
            continue
        status = "PASS" if len(item["findings"]) == 0 else "FAIL"
        checklist.append({
            "category": key,
            "name": item["name"],
            "status": status,
            "findings_count": len(item["findings"]),
            "findings": item["findings"]
        })

    return {
        "assessment_id": assessment_id,
        "framework": framework,
        "checklist": checklist,
        "pass_count": len([c for c in checklist if c["status"] == "PASS"]),
        "fail_count": len([c for c in checklist if c["status"] == "FAIL"])
    }
