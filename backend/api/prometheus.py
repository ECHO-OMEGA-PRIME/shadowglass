"""
PROMETHEUS PRIME API
OSINT and reconnaissance endpoints via Prometheus Prime
"""
from fastapi import APIRouter, HTTPException, Depends
from typing import Optional, List
from pydantic import BaseModel

from core.auth import get_current_user
from services.data_store import get_data_store
from services.scope_validator import get_scope_validator, OutOfScopeError
from services.evidence_logger import get_evidence_logger
from services.prometheus_integration import get_prometheus_client
from models.evidence import EvidenceType

router = APIRouter(prefix="/prometheus", tags=["Prometheus OSINT"])


class OsintRequest(BaseModel):
    """Generic OSINT request"""
    assessment_id: str
    target: str  # email, phone, username, domain, etc.


class ScanRequest(BaseModel):
    """Scan request with scope validation"""
    assessment_id: str
    target: str
    ports: Optional[str] = "21,22,23,25,80,443,3306,3389,8080"


# ==========================================================================
# Health & Status
# ==========================================================================

@router.get("/health")
async def prometheus_health(
    user: dict = Depends(get_current_user)
) -> dict:
    """Check Prometheus Prime availability"""
    client = get_prometheus_client()
    return await client.health_check()


@router.get("/capabilities")
async def get_capabilities(
    user: dict = Depends(get_current_user)
) -> dict:
    """List available Prometheus Prime capabilities"""
    return {
        "osint": {
            "email": ["holehe", "hunter"],
            "phone": ["phoneinfoga"],
            "username": ["sherlock", "maigret"]
        },
        "recon": {
            "domain": ["subdomains", "dns", "whois"],
            "web": ["tech_detection", "headers", "ssl"]
        },
        "scanning": {
            "network": ["port_scan", "service_detection"],
            "vulnerability": ["nuclei"]
        },
        "prometheus_url": "http://192.168.1.202:8370",
        "docs_url": "http://192.168.1.202:8370/docs"
    }


# ==========================================================================
# OSINT - Email
# ==========================================================================

@router.post("/osint/email/holehe")
async def holehe_email_check(
    request: OsintRequest,
    user: dict = Depends(get_current_user)
) -> dict:
    """
    Check email registration across 100+ services using Holehe

    Returns which services the email is registered on.
    This helps identify:
    - User's online presence
    - Potential password reuse vectors
    - Social engineering targets
    """
    client = get_prometheus_client()
    result = await client.verify_email_holehe(request.target)

    # Log as evidence
    if request.assessment_id:
        evidence_logger = get_evidence_logger(request.assessment_id, user.get("user_id", ""))
        evidence_logger.log_generic(
            title=f"Holehe Email Check: {request.target}",
            content=str(result),
            evidence_type=EvidenceType.COMMAND_OUTPUT,
            description="Email verification using Holehe"
        )

    return result


@router.post("/osint/email/hunter")
async def hunter_email_verify(
    request: OsintRequest,
    user: dict = Depends(get_current_user)
) -> dict:
    """Verify email deliverability using Hunter.io"""
    client = get_prometheus_client()
    result = await client.verify_email_hunter(request.target)

    if request.assessment_id:
        evidence_logger = get_evidence_logger(request.assessment_id, user.get("user_id", ""))
        evidence_logger.log_generic(
            title=f"Hunter Email Verify: {request.target}",
            content=str(result),
            evidence_type=EvidenceType.COMMAND_OUTPUT,
            description="Email verification using Hunter.io"
        )

    return result


# ==========================================================================
# OSINT - Phone
# ==========================================================================

@router.post("/osint/phone")
async def phone_info(
    request: OsintRequest,
    user: dict = Depends(get_current_user)
) -> dict:
    """
    Verify phone number using PhoneInfoga

    Returns carrier info, location, and service registrations.
    """
    client = get_prometheus_client()
    result = await client.verify_phone(request.target)

    if request.assessment_id:
        evidence_logger = get_evidence_logger(request.assessment_id, user.get("user_id", ""))
        evidence_logger.log_generic(
            title=f"PhoneInfoga: {request.target}",
            content=str(result),
            evidence_type=EvidenceType.COMMAND_OUTPUT,
            description="Phone number verification"
        )

    return result


# ==========================================================================
# OSINT - Username
# ==========================================================================

@router.post("/osint/username/sherlock")
async def sherlock_username(
    request: OsintRequest,
    user: dict = Depends(get_current_user)
) -> dict:
    """
    Search username across 300+ sites using Sherlock

    Identifies accounts associated with a username.
    """
    client = get_prometheus_client()
    result = await client.search_username_sherlock(request.target)

    if request.assessment_id:
        evidence_logger = get_evidence_logger(request.assessment_id, user.get("user_id", ""))
        evidence_logger.log_generic(
            title=f"Sherlock Username: {request.target}",
            content=str(result),
            evidence_type=EvidenceType.COMMAND_OUTPUT,
            description="Username enumeration using Sherlock"
        )

    return result


@router.post("/osint/username/maigret")
async def maigret_username(
    request: OsintRequest,
    user: dict = Depends(get_current_user)
) -> dict:
    """
    Search username using Maigret (more comprehensive than Sherlock)
    """
    client = get_prometheus_client()
    result = await client.search_username_maigret(request.target)

    if request.assessment_id:
        evidence_logger = get_evidence_logger(request.assessment_id, user.get("user_id", ""))
        evidence_logger.log_generic(
            title=f"Maigret Username: {request.target}",
            content=str(result),
            evidence_type=EvidenceType.COMMAND_OUTPUT,
            description="Username enumeration using Maigret"
        )

    return result


# ==========================================================================
# Domain Reconnaissance (REQUIRES SCOPE VALIDATION)
# ==========================================================================

@router.post("/recon/subdomains")
async def enumerate_subdomains(
    request: OsintRequest,
    user: dict = Depends(get_current_user)
) -> dict:
    """
    Enumerate subdomains for a domain

    SCOPE VALIDATION REQUIRED - Domain must be in assessment scope
    """
    store = get_data_store()

    # Validate scope
    if request.assessment_id:
        targets = store.get_targets_for_assessment(request.assessment_id)
        validator = get_scope_validator(request.assessment_id)
        validator.load_scope(targets)

        try:
            validator.validate_or_raise(request.target)
        except OutOfScopeError as e:
            raise HTTPException(
                status_code=403,
                detail=f"OUT OF SCOPE: {request.target} is not authorized for testing"
            )

    client = get_prometheus_client()
    result = await client.subdomain_enum(request.target)

    if request.assessment_id:
        evidence_logger = get_evidence_logger(request.assessment_id, user.get("user_id", ""))
        evidence_logger.log_generic(
            title=f"Subdomain Enumeration: {request.target}",
            content=str(result),
            evidence_type=EvidenceType.COMMAND_OUTPUT,
            description="Subdomain discovery"
        )

    return result


@router.post("/recon/dns")
async def dns_lookup(
    request: OsintRequest,
    record_type: str = "A",
    user: dict = Depends(get_current_user)
) -> dict:
    """DNS record lookup"""
    client = get_prometheus_client()
    return await client.dns_lookup(request.target, record_type)


@router.post("/recon/whois")
async def whois_lookup(
    request: OsintRequest,
    user: dict = Depends(get_current_user)
) -> dict:
    """WHOIS lookup for domain"""
    client = get_prometheus_client()
    return await client.whois_lookup(request.target)


# ==========================================================================
# Web Application Testing (REQUIRES SCOPE VALIDATION)
# ==========================================================================

@router.post("/web/tech")
async def detect_technologies(
    request: OsintRequest,
    user: dict = Depends(get_current_user)
) -> dict:
    """
    Detect technologies used by a web application

    SCOPE VALIDATION REQUIRED
    """
    store = get_data_store()

    # Validate scope
    if request.assessment_id:
        targets = store.get_targets_for_assessment(request.assessment_id)
        validator = get_scope_validator(request.assessment_id)
        validator.load_scope(targets)

        try:
            validator.validate_or_raise(request.target)
        except OutOfScopeError as e:
            raise HTTPException(
                status_code=403,
                detail=f"OUT OF SCOPE: {request.target} is not authorized for testing"
            )

    client = get_prometheus_client()
    result = await client.tech_detection(request.target)

    if request.assessment_id:
        evidence_logger = get_evidence_logger(request.assessment_id, user.get("user_id", ""))
        evidence_logger.log_generic(
            title=f"Tech Detection: {request.target}",
            content=str(result),
            evidence_type=EvidenceType.COMMAND_OUTPUT,
            description="Web technology detection"
        )

    return result


@router.post("/web/headers")
async def analyze_headers(
    request: OsintRequest,
    user: dict = Depends(get_current_user)
) -> dict:
    """Analyze HTTP security headers"""
    store = get_data_store()

    # Validate scope
    if request.assessment_id:
        targets = store.get_targets_for_assessment(request.assessment_id)
        validator = get_scope_validator(request.assessment_id)
        validator.load_scope(targets)

        try:
            validator.validate_or_raise(request.target)
        except OutOfScopeError as e:
            raise HTTPException(
                status_code=403,
                detail=f"OUT OF SCOPE: {request.target} is not authorized for testing"
            )

    client = get_prometheus_client()
    result = await client.header_analysis(request.target)

    if request.assessment_id:
        evidence_logger = get_evidence_logger(request.assessment_id, user.get("user_id", ""))
        evidence_logger.log_generic(
            title=f"Header Analysis: {request.target}",
            content=str(result),
            evidence_type=EvidenceType.COMMAND_OUTPUT,
            description="HTTP security header analysis"
        )

    return result


@router.post("/web/ssl")
async def analyze_ssl(
    request: OsintRequest,
    user: dict = Depends(get_current_user)
) -> dict:
    """Analyze SSL/TLS configuration"""
    client = get_prometheus_client()
    return await client.ssl_analysis(request.target)


# ==========================================================================
# Network Scanning (REQUIRES SCOPE VALIDATION)
# ==========================================================================

@router.post("/scan/ports")
async def port_scan(
    request: ScanRequest,
    user: dict = Depends(get_current_user)
) -> dict:
    """
    Port scan target

    CRITICAL: Only scans in-scope targets!
    Scope validation is MANDATORY.
    """
    store = get_data_store()

    # Validate scope - MANDATORY for scanning
    if not request.assessment_id:
        raise HTTPException(
            status_code=400,
            detail="assessment_id required for scanning operations"
        )

    targets = store.get_targets_for_assessment(request.assessment_id)
    validator = get_scope_validator(request.assessment_id)
    validator.load_scope(targets)

    try:
        validator.validate_or_raise(request.target)
    except OutOfScopeError as e:
        raise HTTPException(
            status_code=403,
            detail=f"OUT OF SCOPE: {request.target} is not authorized for scanning"
        )

    client = get_prometheus_client()
    result = await client.port_scan(request.target, request.ports or "")

    # Log evidence
    evidence_logger = get_evidence_logger(request.assessment_id, user.get("user_id", ""))
    evidence_logger.log_generic(
        title=f"Port Scan: {request.target}",
        content=str(result),
        evidence_type=EvidenceType.COMMAND_OUTPUT,
        description=f"Port scan on ports: {request.ports}"
    )

    return result


# ==========================================================================
# Vulnerability Scanning (REQUIRES SCOPE VALIDATION)
# ==========================================================================

@router.post("/scan/nuclei")
async def nuclei_vulnerability_scan(
    request: OsintRequest,
    templates: Optional[List[str]] = None,
    user: dict = Depends(get_current_user)
) -> dict:
    """
    Run Nuclei vulnerability scanner

    CRITICAL: Only scans in-scope targets!
    Scope validation is MANDATORY.
    """
    store = get_data_store()

    # Validate scope - MANDATORY for vulnerability scanning
    if not request.assessment_id:
        raise HTTPException(
            status_code=400,
            detail="assessment_id required for vulnerability scanning"
        )

    targets = store.get_targets_for_assessment(request.assessment_id)
    validator = get_scope_validator(request.assessment_id)
    validator.load_scope(targets)

    try:
        validator.validate_or_raise(request.target)
    except OutOfScopeError as e:
        raise HTTPException(
            status_code=403,
            detail=f"OUT OF SCOPE: {request.target} is not authorized for scanning"
        )

    client = get_prometheus_client()
    result = await client.nuclei_scan(request.target, templates)

    # Log evidence
    evidence_logger = get_evidence_logger(request.assessment_id, user.get("user_id", ""))
    evidence_logger.log_generic(
        title=f"Nuclei Scan: {request.target}",
        content=str(result),
        evidence_type=EvidenceType.COMMAND_OUTPUT,
        description=f"Nuclei vulnerability scan with templates: {templates or 'default'}"
    )

    return result
