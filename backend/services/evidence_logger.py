"""
EVIDENCE LOGGER SERVICE
Captures all testing activity for audit trails and reports

Every request/response during an assessment is logged for:
1. Professional report generation
2. Audit compliance
3. Legal protection (proof of authorized activity)
"""
from typing import Optional, Dict, Any, List
from datetime import datetime
import hashlib
import json
import logging
from pathlib import Path
import uuid

from models.evidence import Evidence, EvidenceCreate, EvidenceType

logger = logging.getLogger(__name__)


class EvidenceLogger:
    """
    EVIDENCE LOGGER

    Captures and stores all testing evidence for:
    - Report generation
    - Audit trails
    - Legal documentation

    All evidence is hashed for integrity verification.
    """

    def __init__(self, assessment_id: str, user_id: str = ""):
        self.assessment_id = assessment_id
        self.user_id = user_id
        self._evidence_store: List[Evidence] = []

    def log_http_request(
        self,
        method: str,
        url: str,
        headers: Optional[Dict[str, str]] = None,
        body: Optional[str] = None,
        target_id: Optional[str] = None,
        finding_id: Optional[str] = None,
        source_ip: Optional[str] = None
    ) -> Evidence:
        """Log outgoing HTTP request"""

        content = self._format_http_request(method, url, headers, body)
        content_hash = self._compute_hash(content)

        evidence = Evidence(
            id=str(uuid.uuid4()),
            assessment_id=self.assessment_id,
            target_id=target_id,
            finding_id=finding_id,
            evidence_type=EvidenceType.HTTP_REQUEST,
            title=f"{method} {url}",
            description=f"HTTP request to {url}",
            content=content,
            content_hash=content_hash,
            http_method=method,
            http_url=url,
            http_headers=headers,
            http_body=body,
            source_ip=source_ip,
            timestamp=datetime.utcnow(),
            created_by=self.user_id,
            created_at=datetime.utcnow()
        )

        self._evidence_store.append(evidence)
        logger.info(f"Logged HTTP request: {method} {url}")

        return evidence

    def log_http_response(
        self,
        url: str,
        status_code: int,
        headers: Optional[Dict[str, str]] = None,
        body: Optional[str] = None,
        response_time_ms: Optional[int] = None,
        request_evidence_id: Optional[str] = None,
        target_id: Optional[str] = None,
        finding_id: Optional[str] = None
    ) -> Evidence:
        """Log HTTP response"""

        content = self._format_http_response(status_code, headers, body)
        content_hash = self._compute_hash(content)

        evidence = Evidence(
            id=str(uuid.uuid4()),
            assessment_id=self.assessment_id,
            target_id=target_id,
            finding_id=finding_id,
            evidence_type=EvidenceType.HTTP_RESPONSE,
            title=f"Response {status_code} from {url}",
            description=f"HTTP response from {url}",
            content=content,
            content_hash=content_hash,
            http_url=url,
            http_headers=headers,
            http_body=body,
            http_status_code=status_code,
            response_time_ms=response_time_ms,
            timestamp=datetime.utcnow(),
            created_by=self.user_id,
            created_at=datetime.utcnow()
        )

        self._evidence_store.append(evidence)
        logger.info(f"Logged HTTP response: {status_code} from {url}")

        return evidence

    def log_screenshot(
        self,
        title: str,
        screenshot_url: str,
        description: Optional[str] = None,
        target_id: Optional[str] = None,
        finding_id: Optional[str] = None
    ) -> Evidence:
        """Log screenshot evidence"""

        evidence = Evidence(
            id=str(uuid.uuid4()),
            assessment_id=self.assessment_id,
            target_id=target_id,
            finding_id=finding_id,
            evidence_type=EvidenceType.SCREENSHOT,
            title=title,
            description=description,
            content_url=screenshot_url,
            timestamp=datetime.utcnow(),
            created_by=self.user_id,
            created_at=datetime.utcnow()
        )

        self._evidence_store.append(evidence)
        logger.info(f"Logged screenshot: {title}")

        return evidence

    def log_command_output(
        self,
        command: str,
        output: str,
        title: Optional[str] = None,
        target_id: Optional[str] = None,
        finding_id: Optional[str] = None
    ) -> Evidence:
        """Log command execution output"""

        content = f"Command: {command}\n\nOutput:\n{output}"
        content_hash = self._compute_hash(content)

        evidence = Evidence(
            id=str(uuid.uuid4()),
            assessment_id=self.assessment_id,
            target_id=target_id,
            finding_id=finding_id,
            evidence_type=EvidenceType.COMMAND_OUTPUT,
            title=title or f"Command: {command[:50]}...",
            description=f"Output from command execution",
            content=content,
            content_hash=content_hash,
            timestamp=datetime.utcnow(),
            created_by=self.user_id,
            created_at=datetime.utcnow()
        )

        self._evidence_store.append(evidence)
        logger.info(f"Logged command output: {command[:50]}")

        return evidence

    def log_generic(
        self,
        title: str,
        content: str,
        evidence_type: EvidenceType = EvidenceType.OTHER,
        description: Optional[str] = None,
        target_id: Optional[str] = None,
        finding_id: Optional[str] = None
    ) -> Evidence:
        """Log generic evidence"""

        content_hash = self._compute_hash(content)

        evidence = Evidence(
            id=str(uuid.uuid4()),
            assessment_id=self.assessment_id,
            target_id=target_id,
            finding_id=finding_id,
            evidence_type=evidence_type,
            title=title,
            description=description,
            content=content,
            content_hash=content_hash,
            timestamp=datetime.utcnow(),
            created_by=self.user_id,
            created_at=datetime.utcnow()
        )

        self._evidence_store.append(evidence)
        logger.info(f"Logged evidence: {title}")

        return evidence

    def get_all_evidence(self) -> List[Evidence]:
        """Get all logged evidence"""
        return self._evidence_store.copy()

    def get_evidence_for_finding(self, finding_id: str) -> List[Evidence]:
        """Get evidence linked to a finding"""
        return [e for e in self._evidence_store if e.finding_id == finding_id]

    def get_evidence_for_target(self, target_id: str) -> List[Evidence]:
        """Get evidence linked to a target"""
        return [e for e in self._evidence_store if e.target_id == target_id]

    def export_evidence(self, format: str = "json") -> str:
        """Export all evidence to specified format"""
        if format == "json":
            return json.dumps(
                [e.model_dump() for e in self._evidence_store],
                indent=2,
                default=str
            )
        raise ValueError(f"Unsupported format: {format}")

    def _format_http_request(
        self,
        method: str,
        url: str,
        headers: Optional[Dict[str, str]],
        body: Optional[str]
    ) -> str:
        """Format HTTP request for logging"""
        lines = [f"{method} {url} HTTP/1.1"]
        if headers:
            for k, v in headers.items():
                lines.append(f"{k}: {v}")
        lines.append("")
        if body:
            lines.append(body)
        return "\n".join(lines)

    def _format_http_response(
        self,
        status_code: int,
        headers: Optional[Dict[str, str]],
        body: Optional[str]
    ) -> str:
        """Format HTTP response for logging"""
        lines = [f"HTTP/1.1 {status_code}"]
        if headers:
            for k, v in headers.items():
                lines.append(f"{k}: {v}")
        lines.append("")
        if body:
            lines.append(body[:10000])  # Limit body size
        return "\n".join(lines)

    def _compute_hash(self, content: str) -> str:
        """Compute SHA256 hash for integrity"""
        return hashlib.sha256(content.encode()).hexdigest()


# Evidence logger instances per assessment
_active_loggers: Dict[str, EvidenceLogger] = {}


def get_evidence_logger(assessment_id: str, user_id: str = "") -> EvidenceLogger:
    """Get or create evidence logger for assessment"""
    if assessment_id not in _active_loggers:
        _active_loggers[assessment_id] = EvidenceLogger(assessment_id, user_id)
    return _active_loggers[assessment_id]


def clear_evidence_logger(assessment_id: str) -> None:
    """Clear logger when assessment completes"""
    if assessment_id in _active_loggers:
        del _active_loggers[assessment_id]
