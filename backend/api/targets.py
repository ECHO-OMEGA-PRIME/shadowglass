"""
TARGETS API
Scope management - AUTHORIZED TARGETS ONLY
"""
from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from datetime import datetime

from models.target import (
    Target,
    TargetCreate,
    TargetUpdate,
    TargetScope,
    TargetType,
    ScopeValidationResult
)
from core.auth import get_current_user
from services.data_store import get_data_store
from services.scope_validator import get_scope_validator

router = APIRouter(prefix="/targets", tags=["Targets"])


@router.post("/", response_model=Target)
async def add_target(
    data: TargetCreate,
    user: dict = Depends(get_current_user)
) -> Target:
    """
    Add target to assessment scope

    All targets must be authorized before testing.
    """
    store = get_data_store()

    # Verify assessment exists
    assessment = store.get_assessment(data.assessment_id)
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")

    target = Target(
        assessment_id=data.assessment_id,
        value=data.value,
        target_type=data.target_type,
        scope=data.scope,
        description=data.description,
        notes=data.notes,
        authorized_by=data.authorized_by or user.get("user_id", ""),
        authorization_date=data.authorization_date or datetime.utcnow(),
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )

    # Update scope validator if assessment is active
    saved_target = store.save_target(target)

    # Reload scope validator
    targets = store.get_targets_for_assessment(data.assessment_id)
    validator = get_scope_validator(data.assessment_id)
    validator.load_scope(targets)

    return saved_target


@router.get("/assessment/{assessment_id}", response_model=List[Target])
async def list_targets(
    assessment_id: str,
    scope: Optional[TargetScope] = None,
    user: dict = Depends(get_current_user)
) -> List[Target]:
    """List all targets for an assessment"""
    store = get_data_store()
    targets = store.get_targets_for_assessment(assessment_id)

    if scope:
        targets = [t for t in targets if t.scope == scope]

    return targets


@router.get("/{target_id}", response_model=Target)
async def get_target(
    target_id: str,
    user: dict = Depends(get_current_user)
) -> Target:
    """Get target by ID"""
    store = get_data_store()
    target = store.get_target(target_id)

    if not target:
        raise HTTPException(status_code=404, detail="Target not found")

    return target


@router.patch("/{target_id}", response_model=Target)
async def update_target(
    target_id: str,
    data: TargetUpdate,
    user: dict = Depends(get_current_user)
) -> Target:
    """Update target details"""
    store = get_data_store()
    target = store.get_target(target_id)

    if not target:
        raise HTTPException(status_code=404, detail="Target not found")

    # Update fields
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(target, field, value)

    target.updated_at = datetime.utcnow()

    saved_target = store.save_target(target)

    # Reload scope validator
    targets = store.get_targets_for_assessment(target.assessment_id)
    validator = get_scope_validator(target.assessment_id)
    validator.load_scope(targets)

    return saved_target


@router.delete("/{target_id}")
async def delete_target(
    target_id: str,
    user: dict = Depends(get_current_user)
) -> dict:
    """Remove target from scope"""
    store = get_data_store()
    target = store.get_target(target_id)

    if not target:
        raise HTTPException(status_code=404, detail="Target not found")

    assessment_id = target.assessment_id
    store.delete_target(target_id)

    # Reload scope validator
    targets = store.get_targets_for_assessment(assessment_id)
    validator = get_scope_validator(assessment_id)
    validator.load_scope(targets)

    return {"deleted": True, "target_id": target_id}


@router.post("/validate", response_model=ScopeValidationResult)
async def validate_scope(
    assessment_id: str,
    target_value: str,
    user: dict = Depends(get_current_user)
) -> ScopeValidationResult:
    """
    Check if a target is within authorized scope

    IMPORTANT: Call this before ANY testing action
    """
    store = get_data_store()

    # Verify assessment exists
    assessment = store.get_assessment(assessment_id)
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")

    # Get scope validator
    validator = get_scope_validator(assessment_id)

    # If not loaded, load targets
    if not validator.in_scope_targets:
        targets = store.get_targets_for_assessment(assessment_id)
        validator.load_scope(targets)

    return validator.is_in_scope(target_value)


@router.get("/assessment/{assessment_id}/scope-summary")
async def get_scope_summary(
    assessment_id: str,
    user: dict = Depends(get_current_user)
) -> dict:
    """Get summary of assessment scope"""
    store = get_data_store()

    # Verify assessment exists
    assessment = store.get_assessment(assessment_id)
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")

    # Get scope validator
    validator = get_scope_validator(assessment_id)

    # If not loaded, load targets
    if not validator.in_scope_targets:
        targets = store.get_targets_for_assessment(assessment_id)
        validator.load_scope(targets)

    return validator.get_scope_summary()


@router.post("/bulk-add")
async def bulk_add_targets(
    assessment_id: str,
    targets: List[TargetCreate],
    user: dict = Depends(get_current_user)
) -> List[Target]:
    """Add multiple targets at once"""
    store = get_data_store()

    # Verify assessment exists
    assessment = store.get_assessment(assessment_id)
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")

    created_targets = []
    for target_data in targets:
        target = Target(
            assessment_id=assessment_id,
            value=target_data.value,
            target_type=target_data.target_type,
            scope=target_data.scope,
            description=target_data.description,
            notes=target_data.notes,
            authorized_by=target_data.authorized_by or user.get("user_id", ""),
            authorization_date=datetime.utcnow(),
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        created_targets.append(store.save_target(target))

    # Reload scope validator
    all_targets = store.get_targets_for_assessment(assessment_id)
    validator = get_scope_validator(assessment_id)
    validator.load_scope(all_targets)

    return created_targets
