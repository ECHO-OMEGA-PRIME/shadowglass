"""
Assessment Model
Pentest engagement management
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum
import uuid


class AssessmentStatus(str, Enum):
    """Assessment lifecycle status"""
    DRAFT = "draft"           # ROE being defined
    ACTIVE = "active"         # Testing in progress
    PAUSED = "paused"         # Temporarily stopped
    COMPLETED = "completed"   # Testing finished
    ARCHIVED = "archived"     # Historical record


class AssessmentCreate(BaseModel):
    """Create new assessment"""
    name: str = Field(..., description="Assessment project name")
    client_name: str = Field(..., description="Client organization")
    description: Optional[str] = Field(None, description="Assessment scope description")

    # Rules of Engagement
    roe_document_url: Optional[str] = Field(None, description="Link to signed ROE")
    sow_document_url: Optional[str] = Field(None, description="Link to signed SOW")
    authorization_letter_url: Optional[str] = Field(None, description="Get out of jail letter")

    # Testing window
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None

    # Contacts
    client_poc_name: Optional[str] = Field(None, description="Client point of contact")
    client_poc_email: Optional[str] = None
    emergency_contact: Optional[str] = Field(None, description="Emergency stop contact")

    # Methodology
    methodology: str = Field("PTES", description="Testing methodology (PTES, OWASP, NIST)")


class Assessment(BaseModel):
    """Full assessment model"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))

    # Core info
    name: str
    client_name: str
    description: Optional[str] = None
    status: AssessmentStatus = AssessmentStatus.DRAFT

    # Authorization documents
    roe_document_url: Optional[str] = None
    sow_document_url: Optional[str] = None
    authorization_letter_url: Optional[str] = None
    authorization_verified: bool = False

    # Testing window
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None

    # Contacts
    client_poc_name: Optional[str] = None
    client_poc_email: Optional[str] = None
    emergency_contact: Optional[str] = None

    # Methodology
    methodology: str = "PTES"

    # Tracking
    created_by: str = ""
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Stats (computed)
    target_count: int = 0
    finding_count: int = 0
    evidence_count: int = 0

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class AssessmentUpdate(BaseModel):
    """Update assessment"""
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[AssessmentStatus] = None
    roe_document_url: Optional[str] = None
    sow_document_url: Optional[str] = None
    authorization_letter_url: Optional[str] = None
    authorization_verified: Optional[bool] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    client_poc_name: Optional[str] = None
    client_poc_email: Optional[str] = None
    emergency_contact: Optional[str] = None
