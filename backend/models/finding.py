"""
Finding Model
Vulnerability and issue tracking
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum
import uuid


class Severity(str, Enum):
    """CVSS-aligned severity"""
    CRITICAL = "critical"   # 9.0-10.0
    HIGH = "high"           # 7.0-8.9
    MEDIUM = "medium"       # 4.0-6.9
    LOW = "low"             # 0.1-3.9
    INFO = "info"           # Informational


class FindingStatus(str, Enum):
    """Finding lifecycle"""
    DRAFT = "draft"           # Being written
    CONFIRMED = "confirmed"   # Verified vulnerability
    FALSE_POSITIVE = "false_positive"
    REMEDIATED = "remediated" # Client fixed
    ACCEPTED = "accepted"     # Risk accepted


class FindingCategory(str, Enum):
    """OWASP-aligned categories"""
    BROKEN_ACCESS_CONTROL = "A01_Broken_Access_Control"
    CRYPTO_FAILURES = "A02_Cryptographic_Failures"
    INJECTION = "A03_Injection"
    INSECURE_DESIGN = "A04_Insecure_Design"
    SECURITY_MISCONFIG = "A05_Security_Misconfiguration"
    VULNERABLE_COMPONENTS = "A06_Vulnerable_Components"
    AUTH_FAILURES = "A07_Auth_Failures"
    DATA_INTEGRITY = "A08_Data_Integrity_Failures"
    LOGGING_FAILURES = "A09_Logging_Failures"
    SSRF = "A10_SSRF"
    OTHER = "Other"


class FindingCreate(BaseModel):
    """Create new finding"""
    assessment_id: str = Field(..., description="Parent assessment")
    target_id: Optional[str] = Field(None, description="Related target")

    title: str = Field(..., description="Finding title")
    description: str = Field(..., description="Detailed description")

    severity: Severity = Field(..., description="CVSS-aligned severity")
    category: FindingCategory = Field(FindingCategory.OTHER)

    # Technical details
    affected_component: Optional[str] = Field(None, description="What's vulnerable")
    attack_vector: Optional[str] = Field(None, description="How to exploit")
    proof_of_concept: Optional[str] = Field(None, description="PoC code/steps")

    # Impact
    business_impact: Optional[str] = Field(None, description="Business impact")

    # Remediation
    recommendation: Optional[str] = Field(None, description="How to fix")
    references: Optional[List[str]] = Field(default_factory=list, description="CVE, CWE refs")

    # CVSS
    cvss_score: Optional[float] = Field(None, ge=0, le=10)
    cvss_vector: Optional[str] = None


class Finding(BaseModel):
    """Full finding model"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    assessment_id: str
    target_id: Optional[str] = None

    title: str
    description: str

    severity: Severity
    category: FindingCategory = FindingCategory.OTHER
    status: FindingStatus = FindingStatus.DRAFT

    # Technical
    affected_component: Optional[str] = None
    attack_vector: Optional[str] = None
    proof_of_concept: Optional[str] = None

    # Impact
    business_impact: Optional[str] = None

    # Fix
    recommendation: Optional[str] = None
    references: List[str] = Field(default_factory=list)

    # CVSS
    cvss_score: Optional[float] = None
    cvss_vector: Optional[str] = None

    # Evidence links
    evidence_ids: List[str] = Field(default_factory=list)

    # Metadata
    created_by: str = ""
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class FindingUpdate(BaseModel):
    """Update finding"""
    title: Optional[str] = None
    description: Optional[str] = None
    severity: Optional[Severity] = None
    category: Optional[FindingCategory] = None
    status: Optional[FindingStatus] = None
    affected_component: Optional[str] = None
    attack_vector: Optional[str] = None
    proof_of_concept: Optional[str] = None
    business_impact: Optional[str] = None
    recommendation: Optional[str] = None
    references: Optional[List[str]] = None
    cvss_score: Optional[float] = None
    cvss_vector: Optional[str] = None
