"""
ASSESSMENTS API
Pentest engagement management with Firebase Cloud Sync
"""
import asyncio
from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from datetime import datetime
from loguru import logger

from models.assessment import (
    Assessment,
    AssessmentCreate,
    AssessmentUpdate,
    AssessmentStatus
)
from core.auth import get_current_user
from services.data_store import get_data_store
from services.scope_validator import get_scope_validator, clear_scope_validator
from services.firebase_service import get_firebase_service

router = APIRouter(prefix="/assessments", tags=["Assessments"])


def _sync_to_cloud(assessment: Assessment):
    """Background sync to Firebase (fire and forget)"""
    firebase = get_firebase_service()
    if firebase.is_available:
        asyncio.create_task(firebase.sync_assessment(assessment.model_dump()))
        logger.debug(f"Cloud sync initiated for assessment {assessment.id}")


@router.post("/", response_model=Assessment)
async def create_assessment(
    data: AssessmentCreate,
    user: dict = Depends(get_current_user)
) -> Assessment:
    """
    Create new security assessment

    Requires:
    - Client name
    - Assessment name
    - ROE/SOW documentation (recommended)
    """
    store = get_data_store()

    assessment = Assessment(
        name=data.name,
        client_name=data.client_name,
        description=data.description,
        roe_document_url=data.roe_document_url,
        sow_document_url=data.sow_document_url,
        authorization_letter_url=data.authorization_letter_url,
        start_date=data.start_date,
        end_date=data.end_date,
        client_poc_name=data.client_poc_name,
        client_poc_email=data.client_poc_email,
        emergency_contact=data.emergency_contact,
        methodology=data.methodology,
        created_by=user.get("user_id", ""),
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )

    saved = store.save_assessment(assessment)
    _sync_to_cloud(saved)  # Cloud sync
    return saved


@router.get("/", response_model=List[Assessment])
async def list_assessments(
    status: Optional[AssessmentStatus] = None,
    user: dict = Depends(get_current_user)
) -> List[Assessment]:
    """List all assessments for current user"""
    store = get_data_store()
    assessments = store.get_assessments(user_id=user.get("user_id"))

    if status:
        assessments = [a for a in assessments if a.status == status]

    return assessments


@router.get("/{assessment_id}", response_model=Assessment)
async def get_assessment(
    assessment_id: str,
    user: dict = Depends(get_current_user)
) -> Assessment:
    """Get assessment by ID"""
    store = get_data_store()
    assessment = store.get_assessment(assessment_id)

    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")

    return assessment


@router.patch("/{assessment_id}", response_model=Assessment)
async def update_assessment(
    assessment_id: str,
    data: AssessmentUpdate,
    user: dict = Depends(get_current_user)
) -> Assessment:
    """Update assessment details"""
    store = get_data_store()
    assessment = store.get_assessment(assessment_id)

    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")

    # Update fields
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(assessment, field, value)

    assessment.updated_at = datetime.utcnow()

    saved = store.save_assessment(assessment)
    _sync_to_cloud(saved)  # Cloud sync
    return saved


@router.post("/{assessment_id}/activate", response_model=Assessment)
async def activate_assessment(
    assessment_id: str,
    user: dict = Depends(get_current_user)
) -> Assessment:
    """
    Activate assessment for testing

    IMPORTANT: Only activate after verifying:
    - ROE is signed
    - SOW is signed
    - Scope is defined
    - Testing window is valid
    """
    store = get_data_store()
    assessment = store.get_assessment(assessment_id)

    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")

    # Verify we have targets in scope
    targets = store.get_targets_for_assessment(assessment_id)
    if not targets:
        raise HTTPException(
            status_code=400,
            detail="Cannot activate: No targets defined in scope"
        )

    # Load scope validator
    validator = get_scope_validator(assessment_id)
    validator.load_scope(targets)

    assessment.status = AssessmentStatus.ACTIVE
    assessment.updated_at = datetime.utcnow()

    saved = store.save_assessment(assessment)
    _sync_to_cloud(saved)  # Cloud sync
    return saved


@router.post("/{assessment_id}/pause", response_model=Assessment)
async def pause_assessment(
    assessment_id: str,
    user: dict = Depends(get_current_user)
) -> Assessment:
    """Pause active assessment"""
    store = get_data_store()
    assessment = store.get_assessment(assessment_id)

    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")

    assessment.status = AssessmentStatus.PAUSED
    assessment.updated_at = datetime.utcnow()

    saved = store.save_assessment(assessment)
    _sync_to_cloud(saved)  # Cloud sync
    return saved


@router.post("/{assessment_id}/complete", response_model=Assessment)
async def complete_assessment(
    assessment_id: str,
    user: dict = Depends(get_current_user)
) -> Assessment:
    """Mark assessment as completed"""
    store = get_data_store()
    assessment = store.get_assessment(assessment_id)

    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")

    # Clear scope validator
    clear_scope_validator(assessment_id)

    assessment.status = AssessmentStatus.COMPLETED
    assessment.updated_at = datetime.utcnow()

    saved = store.save_assessment(assessment)
    _sync_to_cloud(saved)  # Cloud sync
    return saved


@router.delete("/{assessment_id}")
async def delete_assessment(
    assessment_id: str,
    user: dict = Depends(get_current_user)
) -> dict:
    """Delete assessment and all related data"""
    store = get_data_store()

    if not store.get_assessment(assessment_id):
        raise HTTPException(status_code=404, detail="Assessment not found")

    # Clear scope validator
    clear_scope_validator(assessment_id)

    store.delete_assessment(assessment_id)

    return {"deleted": True, "assessment_id": assessment_id}


@router.get("/{assessment_id}/stats")
async def get_assessment_stats(
    assessment_id: str,
    user: dict = Depends(get_current_user)
) -> dict:
    """Get assessment statistics"""
    store = get_data_store()
    assessment = store.get_assessment(assessment_id)

    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")

    targets = store.get_targets_for_assessment(assessment_id)
    findings = store.get_findings_for_assessment(assessment_id)
    evidence = store.get_evidence_for_assessment(assessment_id)

    # Count findings by severity
    severity_counts = {}
    for finding in findings:
        sev = finding.severity.value
        severity_counts[sev] = severity_counts.get(sev, 0) + 1

    return {
        "assessment_id": assessment_id,
        "status": assessment.status.value,
        "targets": len(targets),
        "findings": len(findings),
        "evidence": len(evidence),
        "severity_breakdown": severity_counts
    }
