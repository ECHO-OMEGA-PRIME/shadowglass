# SHADOWGLASS API Routes

# Browser & Search (existing)
from api.browser import router as browser_router
from api.search import router as search_router
from api.profiles import router as profiles_router
from api.proxy import router as proxy_router

# Pentest Assessment Infrastructure
from api.assessments import router as assessments_router
from api.targets import router as targets_router
from api.findings import router as findings_router
from api.evidence import router as evidence_router
from api.reports import router as reports_router

# Prometheus Prime OSINT Integration
from api.prometheus import router as prometheus_router

__all__ = [
    # Browser & Search
    "browser_router",
    "search_router",
    "profiles_router",
    "proxy_router",
    # Pentest Infrastructure
    "assessments_router",
    "targets_router",
    "findings_router",
    "evidence_router",
    "reports_router",
    # Prometheus Prime
    "prometheus_router",
]
