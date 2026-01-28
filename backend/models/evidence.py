"""
Evidence Model
Request/response capture and audit trails
"""
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime
from enum import Enum
import uuid


class EvidenceType(str, Enum):
    """Evidence classification"""
    HTTP_REQUEST = "http_request"
    HTTP_RESPONSE = "http_response"
    SCREENSHOT = "screenshot"
    LOG_ENTRY = "log"
    COMMAND_OUTPUT = "command"
    NETWORK_CAPTURE = "pcap"
    CODE_SNIPPET = "code"
    CONFIGURATION = "config"
    OTHER = "other"


class EvidenceCreate(BaseModel):
    """Create evidence record"""
    assessment_id: str = Field(..., description="Parent assessment")
    finding_id: Optional[str] = Field(None, description="Related finding")
    target_id: Optional[str] = Field(None, description="Related target")

    evidence_type: EvidenceType = Field(..., description="Type of evidence")
    title: str = Field(..., description="Evidence title")
    description: Optional[str] = None

    # Content
    content: Optional[str] = Field(None, description="Text content")
    content_url: Optional[str] = Field(None, description="Link to file/screenshot")

    # HTTP specific
    http_method: Optional[str] = None
    http_url: Optional[str] = None
    http_headers: Optional[Dict[str, str]] = None
    http_body: Optional[str] = None
    http_status_code: Optional[int] = None

    # Metadata
    source_ip: Optional[str] = Field(None, description="Request source IP")
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class Evidence(BaseModel):
    """Full evidence model"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    assessment_id: str
    finding_id: Optional[str] = None
    target_id: Optional[str] = None

    evidence_type: EvidenceType
    title: str
    description: Optional[str] = None

    # Content
    content: Optional[str] = None
    content_url: Optional[str] = None
    content_hash: Optional[str] = None  # SHA256 for integrity

    # HTTP specific
    http_method: Optional[str] = None
    http_url: Optional[str] = None
    http_headers: Optional[Dict[str, str]] = None
    http_body: Optional[str] = None
    http_status_code: Optional[int] = None
    response_time_ms: Optional[int] = None

    # Metadata
    source_ip: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)

    # Audit
    created_by: str = ""
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class EvidenceFilter(BaseModel):
    """Filter evidence records"""
    assessment_id: Optional[str] = None
    finding_id: Optional[str] = None
    target_id: Optional[str] = None
    evidence_type: Optional[EvidenceType] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
