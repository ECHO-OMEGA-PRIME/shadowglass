"""
EVIDENCE API
Request/response capture and audit trails
"""
from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from datetime import datetime

from models.evidence import Evidence, EvidenceCreate, EvidenceType, EvidenceFilter
from core.auth import get_current_user
from services.data_store import get_data_store
from services.evidence_logger import get_evidence_logger

router = APIRouter(prefix="/evidence", tags=["Evidence"])


@router.post("/", response_model=Evidence)
async def create_evidence(
    data: EvidenceCreate,
    user: dict = Depends(get_current_user)
) -> Evidence:
    """
    Record evidence for assessment

    Evidence is captured for:
    - Professional reports
    - Audit trails
    - Legal documentation
    """
    store = get_data_store()

    # Verify assessment exists
    assessment = store.get_assessment(data.assessment_id)
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")

    # Use evidence logger
    logger = get_evidence_logger(data.assessment_id, user.get("user_id", ""))

    if data.evidence_type == EvidenceType.HTTP_REQUEST:
        evidence = logger.log_http_request(
            method=data.http_method or "GET",
            url=data.http_url or "",
            headers=data.http_headers,
            body=data.http_body,
            target_id=data.target_id,
            finding_id=data.finding_id,
            source_ip=data.source_ip
        )
    elif data.evidence_type == EvidenceType.HTTP_RESPONSE:
        evidence = logger.log_http_response(
            url=data.http_url or "",
            status_code=data.http_status_code or 0,
            headers=data.http_headers,
            body=data.http_body,
            target_id=data.target_id,
            finding_id=data.finding_id
        )
    elif data.evidence_type == EvidenceType.SCREENSHOT:
        evidence = logger.log_screenshot(
            title=data.title,
            screenshot_url=data.content_url or "",
            description=data.description,
            target_id=data.target_id,
            finding_id=data.finding_id
        )
    else:
        evidence = logger.log_generic(
            title=data.title,
            content=data.content or "",
            evidence_type=data.evidence_type,
            description=data.description,
            target_id=data.target_id,
            finding_id=data.finding_id
        )

    # Also save to data store
    store.save_evidence(evidence)

    return evidence


@router.get("/assessment/{assessment_id}", response_model=List[Evidence])
async def list_evidence(
    assessment_id: str,
    evidence_type: Optional[EvidenceType] = None,
    finding_id: Optional[str] = None,
    target_id: Optional[str] = None,
    user: dict = Depends(get_current_user)
) -> List[Evidence]:
    """List all evidence for an assessment"""
    store = get_data_store()
    evidence_list = store.get_evidence_for_assessment(assessment_id)

    if evidence_type:
        evidence_list = [e for e in evidence_list if e.evidence_type == evidence_type]
    if finding_id:
        evidence_list = [e for e in evidence_list if e.finding_id == finding_id]
    if target_id:
        evidence_list = [e for e in evidence_list if e.target_id == target_id]

    # Sort by timestamp
    evidence_list.sort(key=lambda e: e.timestamp, reverse=True)

    return evidence_list


@router.get("/{evidence_id}", response_model=Evidence)
async def get_evidence(
    evidence_id: str,
    user: dict = Depends(get_current_user)
) -> Evidence:
    """Get evidence by ID"""
    store = get_data_store()
    evidence = store.get_evidence(evidence_id)

    if not evidence:
        raise HTTPException(status_code=404, detail="Evidence not found")

    return evidence


@router.delete("/{evidence_id}")
async def delete_evidence(
    evidence_id: str,
    user: dict = Depends(get_current_user)
) -> dict:
    """Delete evidence record"""
    store = get_data_store()

    if not store.get_evidence(evidence_id):
        raise HTTPException(status_code=404, detail="Evidence not found")

    store.delete_evidence(evidence_id)

    return {"deleted": True, "evidence_id": evidence_id}


@router.get("/finding/{finding_id}", response_model=List[Evidence])
async def get_evidence_for_finding(
    finding_id: str,
    user: dict = Depends(get_current_user)
) -> List[Evidence]:
    """Get all evidence linked to a finding"""
    store = get_data_store()
    return store.get_evidence_for_finding(finding_id)


@router.post("/log-request")
async def log_http_request(
    assessment_id: str,
    method: str,
    url: str,
    headers: Optional[dict] = None,
    body: Optional[str] = None,
    target_id: Optional[str] = None,
    user: dict = Depends(get_current_user)
) -> Evidence:
    """
    Quick endpoint to log HTTP request

    Use this to capture all outgoing requests during testing.
    """
    store = get_data_store()

    # Verify assessment exists
    assessment = store.get_assessment(assessment_id)
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")

    logger = get_evidence_logger(assessment_id, user.get("user_id", ""))

    evidence = logger.log_http_request(
        method=method,
        url=url,
        headers=headers,
        body=body,
        target_id=target_id
    )

    store.save_evidence(evidence)

    return evidence


@router.post("/log-response")
async def log_http_response(
    assessment_id: str,
    url: str,
    status_code: int,
    headers: Optional[dict] = None,
    body: Optional[str] = None,
    response_time_ms: Optional[int] = None,
    target_id: Optional[str] = None,
    user: dict = Depends(get_current_user)
) -> Evidence:
    """
    Quick endpoint to log HTTP response

    Use this to capture all responses during testing.
    """
    store = get_data_store()

    # Verify assessment exists
    assessment = store.get_assessment(assessment_id)
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")

    logger = get_evidence_logger(assessment_id, user.get("user_id", ""))

    evidence = logger.log_http_response(
        url=url,
        status_code=status_code,
        headers=headers,
        body=body,
        response_time_ms=response_time_ms,
        target_id=target_id
    )

    store.save_evidence(evidence)

    return evidence


@router.get("/assessment/{assessment_id}/export")
async def export_evidence(
    assessment_id: str,
    format: str = "json",
    user: dict = Depends(get_current_user)
) -> dict:
    """Export all evidence for assessment"""
    logger = get_evidence_logger(assessment_id)

    if format == "json":
        return {
            "assessment_id": assessment_id,
            "exported_at": datetime.utcnow().isoformat(),
            "format": format,
            "data": logger.export_evidence(format="json")
        }

    raise HTTPException(status_code=400, detail=f"Unsupported format: {format}")
