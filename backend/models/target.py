"""
Target Model
Scope management - ONLY authorized targets
"""
from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from datetime import datetime
from enum import Enum
import uuid
import re
import ipaddress


class TargetScope(str, Enum):
    """Target scope status"""
    IN_SCOPE = "in_scope"       # Authorized for testing
    OUT_OF_SCOPE = "out_scope"  # Explicitly excluded
    PENDING = "pending"         # Awaiting confirmation


class TargetType(str, Enum):
    """Target classification"""
    DOMAIN = "domain"
    SUBDOMAIN = "subdomain"
    IP_ADDRESS = "ip"
    IP_RANGE = "ip_range"
    URL = "url"
    API_ENDPOINT = "api"


class TargetCreate(BaseModel):
    """Add target to scope"""
    assessment_id: str = Field(..., description="Parent assessment")
    value: str = Field(..., description="Domain, IP, URL, etc.")
    target_type: TargetType = Field(..., description="Type of target")
    scope: TargetScope = Field(TargetScope.IN_SCOPE, description="Scope status")

    description: Optional[str] = Field(None, description="Target description")
    notes: Optional[str] = Field(None, description="Testing notes")

    # Authorization
    authorized_by: Optional[str] = Field(None, description="Who authorized this target")
    authorization_date: Optional[datetime] = None

    @field_validator('value')
    @classmethod
    def validate_target_value(cls, v):
        """Basic validation of target value"""
        if not v or len(v.strip()) < 1:
            raise ValueError("Target value cannot be empty")
        return v.strip().lower()


class Target(BaseModel):
    """Full target model"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    assessment_id: str

    value: str
    target_type: TargetType
    scope: TargetScope = TargetScope.IN_SCOPE

    description: Optional[str] = None
    notes: Optional[str] = None

    # Authorization tracking
    authorized_by: Optional[str] = None
    authorization_date: Optional[datetime] = None

    # Testing status
    tested: bool = False
    last_tested: Optional[datetime] = None
    finding_count: int = 0

    # Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class TargetUpdate(BaseModel):
    """Update target"""
    scope: Optional[TargetScope] = None
    description: Optional[str] = None
    notes: Optional[str] = None
    authorized_by: Optional[str] = None
    tested: Optional[bool] = None


class ScopeValidationResult(BaseModel):
    """Result of scope validation check"""
    is_in_scope: bool
    target_value: str
    matched_target: Optional[str] = None
    match_type: Optional[str] = None  # exact, wildcard, range
    assessment_id: Optional[str] = None
    reason: str = ""
