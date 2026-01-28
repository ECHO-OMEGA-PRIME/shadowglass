"""
PROMETHEUS PRIME INTEGRATION
Connect to Prometheus Prime (192.168.1.202:8370) for OSINT capabilities

Prometheus Prime provides 206 endpoints across 25 categories:
- Email verification (Holehe)
- Phone verification (PhoneInfoga)
- Username enumeration (Sherlock, Maigret)
- Domain reconnaissance
- Network scanning
- And more...
"""
from typing import Optional, Dict, Any, List
from datetime import datetime
import httpx
import logging
from pydantic import BaseModel

logger = logging.getLogger(__name__)


class PrometheusConfig(BaseModel):
    """Prometheus Prime connection settings"""
    base_url: str = "http://192.168.1.202:8370"
    api_key: str = "Pr0m3th3us!Prime2025"
    timeout: int = 30


class PrometheusClient:
    """
    PROMETHEUS PRIME Client

    Integrates with the Prometheus Prime API for OSINT operations
    during authorized security assessments.

    All operations are logged for evidence capture.
    """

    def __init__(self, config: Optional[PrometheusConfig] = None):
        self.config = config or PrometheusConfig()
        self.headers = {
            "X-API-Key": self.config.api_key,
            "Content-Type": "application/json"
        }

    async def health_check(self) -> Dict[str, Any]:
        """Check Prometheus Prime availability"""
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                response = await client.get(
                    f"{self.config.base_url}/health",
                    headers=self.headers
                )
                return {
                    "status": "online" if response.status_code == 200 else "offline",
                    "response_time_ms": response.elapsed.total_seconds() * 1000,
                    "timestamp": datetime.utcnow().isoformat()
                }
        except Exception as e:
            return {
                "status": "offline",
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }

    # ==========================================================================
    # OSINT - Email Verification
    # ==========================================================================

    async def verify_email_holehe(self, email: str) -> Dict[str, Any]:
        """
        Check email across 100+ services using Holehe

        Returns which services the email is registered on.
        """
        try:
            async with httpx.AsyncClient(timeout=self.config.timeout) as client:
                response = await client.get(
                    f"{self.config.base_url}/osint/holehe/{email}",
                    headers=self.headers
                )
                return {
                    "success": response.status_code == 200,
                    "email": email,
                    "results": response.json() if response.status_code == 200 else None,
                    "error": None if response.status_code == 200 else response.text,
                    "timestamp": datetime.utcnow().isoformat()
                }
        except Exception as e:
            logger.error(f"Holehe error for {email}: {e}")
            return {
                "success": False,
                "email": email,
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }

    async def verify_email_hunter(self, email: str) -> Dict[str, Any]:
        """Verify email using Hunter.io"""
        try:
            async with httpx.AsyncClient(timeout=self.config.timeout) as client:
                response = await client.get(
                    f"{self.config.base_url}/osint/hunter/verify/{email}",
                    headers=self.headers
                )
                return {
                    "success": response.status_code == 200,
                    "email": email,
                    "results": response.json() if response.status_code == 200 else None,
                    "error": None if response.status_code == 200 else response.text,
                    "timestamp": datetime.utcnow().isoformat()
                }
        except Exception as e:
            logger.error(f"Hunter error for {email}: {e}")
            return {"success": False, "email": email, "error": str(e)}

    # ==========================================================================
    # OSINT - Phone Verification
    # ==========================================================================

    async def verify_phone(self, phone: str) -> Dict[str, Any]:
        """
        Verify phone number using PhoneInfoga

        Returns carrier info, location, and service registrations.
        """
        try:
            async with httpx.AsyncClient(timeout=self.config.timeout) as client:
                response = await client.get(
                    f"{self.config.base_url}/osint/phoneinfoga/{phone}",
                    headers=self.headers
                )
                return {
                    "success": response.status_code == 200,
                    "phone": phone,
                    "results": response.json() if response.status_code == 200 else None,
                    "error": None if response.status_code == 200 else response.text,
                    "timestamp": datetime.utcnow().isoformat()
                }
        except Exception as e:
            logger.error(f"PhoneInfoga error for {phone}: {e}")
            return {"success": False, "phone": phone, "error": str(e)}

    # ==========================================================================
    # OSINT - Username Enumeration
    # ==========================================================================

    async def search_username_sherlock(self, username: str) -> Dict[str, Any]:
        """
        Search username across 300+ sites using Sherlock
        """
        try:
            async with httpx.AsyncClient(timeout=60) as client:  # Longer timeout for Sherlock
                response = await client.get(
                    f"{self.config.base_url}/osint/sherlock/{username}",
                    headers=self.headers
                )
                return {
                    "success": response.status_code == 200,
                    "username": username,
                    "results": response.json() if response.status_code == 200 else None,
                    "error": None if response.status_code == 200 else response.text,
                    "timestamp": datetime.utcnow().isoformat()
                }
        except Exception as e:
            logger.error(f"Sherlock error for {username}: {e}")
            return {"success": False, "username": username, "error": str(e)}

    async def search_username_maigret(self, username: str) -> Dict[str, Any]:
        """
        Search username using Maigret (more comprehensive than Sherlock)
        """
        try:
            async with httpx.AsyncClient(timeout=120) as client:  # Long timeout for Maigret
                response = await client.get(
                    f"{self.config.base_url}/osint/maigret/{username}",
                    headers=self.headers
                )
                return {
                    "success": response.status_code == 200,
                    "username": username,
                    "results": response.json() if response.status_code == 200 else None,
                    "error": None if response.status_code == 200 else response.text,
                    "timestamp": datetime.utcnow().isoformat()
                }
        except Exception as e:
            logger.error(f"Maigret error for {username}: {e}")
            return {"success": False, "username": username, "error": str(e)}

    # ==========================================================================
    # Domain Reconnaissance
    # ==========================================================================

    async def subdomain_enum(self, domain: str) -> Dict[str, Any]:
        """
        Enumerate subdomains for a domain

        Uses multiple tools: Subfinder, Amass, etc.
        """
        try:
            async with httpx.AsyncClient(timeout=120) as client:
                response = await client.get(
                    f"{self.config.base_url}/recon/subdomains/{domain}",
                    headers=self.headers
                )
                return {
                    "success": response.status_code == 200,
                    "domain": domain,
                    "results": response.json() if response.status_code == 200 else None,
                    "error": None if response.status_code == 200 else response.text,
                    "timestamp": datetime.utcnow().isoformat()
                }
        except Exception as e:
            logger.error(f"Subdomain enum error for {domain}: {e}")
            return {"success": False, "domain": domain, "error": str(e)}

    async def dns_lookup(self, domain: str, record_type: str = "A") -> Dict[str, Any]:
        """DNS record lookup"""
        try:
            async with httpx.AsyncClient(timeout=self.config.timeout) as client:
                response = await client.get(
                    f"{self.config.base_url}/recon/dns/{domain}",
                    params={"type": record_type},
                    headers=self.headers
                )
                return {
                    "success": response.status_code == 200,
                    "domain": domain,
                    "record_type": record_type,
                    "results": response.json() if response.status_code == 200 else None,
                    "timestamp": datetime.utcnow().isoformat()
                }
        except Exception as e:
            return {"success": False, "domain": domain, "error": str(e)}

    async def whois_lookup(self, domain: str) -> Dict[str, Any]:
        """WHOIS lookup for domain"""
        try:
            async with httpx.AsyncClient(timeout=self.config.timeout) as client:
                response = await client.get(
                    f"{self.config.base_url}/recon/whois/{domain}",
                    headers=self.headers
                )
                return {
                    "success": response.status_code == 200,
                    "domain": domain,
                    "results": response.json() if response.status_code == 200 else None,
                    "timestamp": datetime.utcnow().isoformat()
                }
        except Exception as e:
            return {"success": False, "domain": domain, "error": str(e)}

    # ==========================================================================
    # Network Scanning
    # ==========================================================================

    async def port_scan(
        self,
        target: str,
        ports: str = "21,22,23,25,80,443,3306,3389,8080"
    ) -> Dict[str, Any]:
        """
        Port scan target

        IMPORTANT: Only scan in-scope targets!
        """
        try:
            async with httpx.AsyncClient(timeout=120) as client:
                response = await client.post(
                    f"{self.config.base_url}/scan/ports",
                    headers=self.headers,
                    json={"target": target, "ports": ports}
                )
                return {
                    "success": response.status_code == 200,
                    "target": target,
                    "ports_scanned": ports,
                    "results": response.json() if response.status_code == 200 else None,
                    "timestamp": datetime.utcnow().isoformat()
                }
        except Exception as e:
            return {"success": False, "target": target, "error": str(e)}

    async def service_detection(self, target: str, port: int) -> Dict[str, Any]:
        """Detect service running on a port"""
        try:
            async with httpx.AsyncClient(timeout=self.config.timeout) as client:
                response = await client.get(
                    f"{self.config.base_url}/scan/service/{target}/{port}",
                    headers=self.headers
                )
                return {
                    "success": response.status_code == 200,
                    "target": target,
                    "port": port,
                    "results": response.json() if response.status_code == 200 else None,
                    "timestamp": datetime.utcnow().isoformat()
                }
        except Exception as e:
            return {"success": False, "target": target, "port": port, "error": str(e)}

    # ==========================================================================
    # Web Application Testing
    # ==========================================================================

    async def tech_detection(self, url: str) -> Dict[str, Any]:
        """
        Detect technologies used by a web application

        Uses Wappalyzer/WhatWeb
        """
        try:
            async with httpx.AsyncClient(timeout=self.config.timeout) as client:
                response = await client.get(
                    f"{self.config.base_url}/web/tech",
                    params={"url": url},
                    headers=self.headers
                )
                return {
                    "success": response.status_code == 200,
                    "url": url,
                    "results": response.json() if response.status_code == 200 else None,
                    "timestamp": datetime.utcnow().isoformat()
                }
        except Exception as e:
            return {"success": False, "url": url, "error": str(e)}

    async def header_analysis(self, url: str) -> Dict[str, Any]:
        """Analyze HTTP security headers"""
        try:
            async with httpx.AsyncClient(timeout=self.config.timeout) as client:
                response = await client.get(
                    f"{self.config.base_url}/web/headers",
                    params={"url": url},
                    headers=self.headers
                )
                return {
                    "success": response.status_code == 200,
                    "url": url,
                    "results": response.json() if response.status_code == 200 else None,
                    "timestamp": datetime.utcnow().isoformat()
                }
        except Exception as e:
            return {"success": False, "url": url, "error": str(e)}

    async def ssl_analysis(self, domain: str) -> Dict[str, Any]:
        """Analyze SSL/TLS configuration"""
        try:
            async with httpx.AsyncClient(timeout=60) as client:
                response = await client.get(
                    f"{self.config.base_url}/web/ssl/{domain}",
                    headers=self.headers
                )
                return {
                    "success": response.status_code == 200,
                    "domain": domain,
                    "results": response.json() if response.status_code == 200 else None,
                    "timestamp": datetime.utcnow().isoformat()
                }
        except Exception as e:
            return {"success": False, "domain": domain, "error": str(e)}

    # ==========================================================================
    # Vulnerability Scanning
    # ==========================================================================

    async def nuclei_scan(
        self,
        target: str,
        templates: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Run Nuclei vulnerability scanner

        Templates: cves, misconfigs, technologies, etc.
        """
        try:
            async with httpx.AsyncClient(timeout=300) as client:  # Long timeout for Nuclei
                payload = {"target": target}
                if templates:
                    payload["templates"] = templates

                response = await client.post(
                    f"{self.config.base_url}/scan/nuclei",
                    headers=self.headers,
                    json=payload
                )
                return {
                    "success": response.status_code == 200,
                    "target": target,
                    "templates": templates,
                    "results": response.json() if response.status_code == 200 else None,
                    "timestamp": datetime.utcnow().isoformat()
                }
        except Exception as e:
            return {"success": False, "target": target, "error": str(e)}

    # ==========================================================================
    # Generic API Call
    # ==========================================================================

    async def call_endpoint(
        self,
        method: str,
        endpoint: str,
        params: Optional[Dict] = None,
        body: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """
        Generic Prometheus Prime API call

        Use for endpoints not wrapped by specific methods.
        """
        try:
            async with httpx.AsyncClient(timeout=self.config.timeout) as client:
                url = f"{self.config.base_url}{endpoint}"

                if method.upper() == "GET":
                    response = await client.get(url, params=params, headers=self.headers)
                elif method.upper() == "POST":
                    response = await client.post(url, params=params, json=body, headers=self.headers)
                else:
                    return {"success": False, "error": f"Unsupported method: {method}"}

                return {
                    "success": response.status_code == 200,
                    "endpoint": endpoint,
                    "status_code": response.status_code,
                    "results": response.json() if response.status_code == 200 else None,
                    "error": response.text if response.status_code != 200 else None,
                    "timestamp": datetime.utcnow().isoformat()
                }
        except Exception as e:
            return {"success": False, "endpoint": endpoint, "error": str(e)}


# Global client instance
_prometheus_client: Optional[PrometheusClient] = None


def get_prometheus_client() -> PrometheusClient:
    """Get or create Prometheus Prime client"""
    global _prometheus_client
    if _prometheus_client is None:
        _prometheus_client = PrometheusClient()
    return _prometheus_client
