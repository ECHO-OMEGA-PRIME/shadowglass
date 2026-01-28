"""
SCOPE VALIDATOR SERVICE
CRITICAL: Ensures ALL testing stays within authorized scope

This is the core security control that prevents unauthorized testing.
Every request MUST pass through scope validation before execution.
"""
from typing import Optional, List, Dict, Set
from datetime import datetime
import re
import ipaddress
from urllib.parse import urlparse
import logging

from models.target import Target, TargetScope, TargetType, ScopeValidationResult

logger = logging.getLogger(__name__)


class OutOfScopeError(Exception):
    """Raised when a target is not in authorized scope"""
    def __init__(self, target: str, reason: str = ""):
        self.target = target
        self.reason = reason
        super().__init__(f"OUT OF SCOPE: {target} - {reason}")


class ScopeValidator:
    """
    SCOPE VALIDATOR

    Enforces that all testing activities stay within the authorized scope
    defined in the assessment. This is a MANDATORY security control.

    Features:
    - Domain/subdomain matching (including wildcards)
    - IP address and CIDR range matching
    - URL path matching
    - Explicit out-of-scope blocking
    - Audit logging of all validation attempts
    """

    def __init__(self, assessment_id: str = None):
        self.assessment_id = assessment_id
        self.in_scope_targets: List[Target] = []
        self.out_of_scope_targets: List[Target] = []
        self._domain_patterns: Set[str] = set()
        self._ip_networks: List[ipaddress.IPv4Network] = []
        self._url_patterns: List[re.Pattern] = []
        self._out_of_scope_patterns: Set[str] = set()

    def load_scope(self, targets: List[Target]) -> None:
        """Load targets from assessment scope"""
        self.in_scope_targets = [t for t in targets if t.scope == TargetScope.IN_SCOPE]
        self.out_of_scope_targets = [t for t in targets if t.scope == TargetScope.OUT_OF_SCOPE]

        # Build matching patterns
        self._build_patterns()

        logger.info(f"Scope loaded: {len(self.in_scope_targets)} in-scope, "
                   f"{len(self.out_of_scope_targets)} out-of-scope targets")

    def _build_patterns(self) -> None:
        """Build optimized matching patterns"""
        self._domain_patterns.clear()
        self._ip_networks.clear()
        self._url_patterns.clear()
        self._out_of_scope_patterns.clear()

        for target in self.in_scope_targets:
            if target.target_type in [TargetType.DOMAIN, TargetType.SUBDOMAIN]:
                self._domain_patterns.add(target.value.lower())
            elif target.target_type == TargetType.IP_ADDRESS:
                try:
                    self._ip_networks.append(ipaddress.ip_network(target.value, strict=False))
                except ValueError:
                    logger.warning(f"Invalid IP address: {target.value}")
            elif target.target_type == TargetType.IP_RANGE:
                try:
                    self._ip_networks.append(ipaddress.ip_network(target.value, strict=False))
                except ValueError:
                    logger.warning(f"Invalid IP range: {target.value}")
            elif target.target_type == TargetType.URL:
                pattern = self._url_to_pattern(target.value)
                self._url_patterns.append(pattern)

        # Build out-of-scope patterns
        for target in self.out_of_scope_targets:
            self._out_of_scope_patterns.add(target.value.lower())

    def _url_to_pattern(self, url: str) -> re.Pattern:
        """Convert URL to regex pattern"""
        escaped = re.escape(url)
        # Allow wildcards
        escaped = escaped.replace(r'\*', '.*')
        return re.compile(f"^{escaped}", re.IGNORECASE)

    def is_in_scope(self, target: str) -> ScopeValidationResult:
        """
        Check if target is within authorized scope

        Args:
            target: Domain, IP, URL, or hostname to check

        Returns:
            ScopeValidationResult with details
        """
        target_lower = target.lower().strip()

        # First check explicit out-of-scope
        for oos in self._out_of_scope_patterns:
            if self._matches_pattern(target_lower, oos):
                logger.warning(f"BLOCKED - Out of scope: {target}")
                return ScopeValidationResult(
                    is_in_scope=False,
                    target_value=target,
                    matched_target=oos,
                    match_type="explicit_exclusion",
                    reason="Target explicitly marked out of scope"
                )

        # Check domain patterns
        for domain in self._domain_patterns:
            if self._matches_domain(target_lower, domain):
                logger.info(f"ALLOWED - Domain match: {target} -> {domain}")
                return ScopeValidationResult(
                    is_in_scope=True,
                    target_value=target,
                    matched_target=domain,
                    match_type="domain",
                    assessment_id=self.assessment_id,
                    reason="Domain in scope"
                )

        # Check IP ranges
        try:
            ip = ipaddress.ip_address(self._extract_ip(target_lower))
            for network in self._ip_networks:
                if ip in network:
                    logger.info(f"ALLOWED - IP match: {target} -> {network}")
                    return ScopeValidationResult(
                        is_in_scope=True,
                        target_value=target,
                        matched_target=str(network),
                        match_type="ip_range",
                        assessment_id=self.assessment_id,
                        reason="IP address in scope"
                    )
        except ValueError:
            pass  # Not an IP address

        # Check URL patterns
        for pattern in self._url_patterns:
            if pattern.match(target_lower):
                logger.info(f"ALLOWED - URL match: {target}")
                return ScopeValidationResult(
                    is_in_scope=True,
                    target_value=target,
                    matched_target=pattern.pattern,
                    match_type="url",
                    assessment_id=self.assessment_id,
                    reason="URL in scope"
                )

        # No match found - NOT IN SCOPE
        logger.warning(f"BLOCKED - No scope match: {target}")
        return ScopeValidationResult(
            is_in_scope=False,
            target_value=target,
            reason="Target not found in authorized scope"
        )

    def validate_or_raise(self, target: str) -> ScopeValidationResult:
        """
        Validate target and raise exception if out of scope

        Use this before ANY testing action to enforce scope.
        """
        result = self.is_in_scope(target)
        if not result.is_in_scope:
            raise OutOfScopeError(target, result.reason)
        return result

    def _matches_domain(self, target: str, pattern: str) -> bool:
        """Check if target matches domain pattern"""
        # Extract hostname from URL if needed
        hostname = self._extract_hostname(target)

        # Exact match
        if hostname == pattern:
            return True

        # Wildcard subdomain match (*.example.com)
        if pattern.startswith("*."):
            base_domain = pattern[2:]
            if hostname == base_domain or hostname.endswith(f".{base_domain}"):
                return True

        # Subdomain match (target is subdomain of pattern)
        if hostname.endswith(f".{pattern}"):
            return True

        return False

    def _matches_pattern(self, target: str, pattern: str) -> bool:
        """Check if target matches a pattern (with wildcards)"""
        hostname = self._extract_hostname(target)

        if '*' in pattern:
            regex = pattern.replace('.', r'\.').replace('*', '.*')
            return bool(re.match(f"^{regex}$", hostname))

        return hostname == pattern or hostname.endswith(f".{pattern}")

    def _extract_hostname(self, target: str) -> str:
        """Extract hostname from URL or return as-is"""
        if '://' in target:
            parsed = urlparse(target)
            return parsed.hostname or target
        return target.split('/')[0].split(':')[0]

    def _extract_ip(self, target: str) -> str:
        """Extract IP address from target"""
        hostname = self._extract_hostname(target)
        return hostname

    def get_scope_summary(self) -> Dict:
        """Get summary of current scope"""
        return {
            "assessment_id": self.assessment_id,
            "in_scope_count": len(self.in_scope_targets),
            "out_of_scope_count": len(self.out_of_scope_targets),
            "domains": list(self._domain_patterns),
            "ip_ranges": [str(n) for n in self._ip_networks],
            "url_patterns": [p.pattern for p in self._url_patterns],
            "exclusions": list(self._out_of_scope_patterns)
        }


# Global scope validator instance (loaded per assessment)
_active_validators: Dict[str, ScopeValidator] = {}


def get_scope_validator(assessment_id: str) -> ScopeValidator:
    """Get or create scope validator for assessment"""
    if assessment_id not in _active_validators:
        _active_validators[assessment_id] = ScopeValidator(assessment_id)
    return _active_validators[assessment_id]


def clear_scope_validator(assessment_id: str) -> None:
    """Clear scope validator when assessment ends"""
    if assessment_id in _active_validators:
        del _active_validators[assessment_id]
