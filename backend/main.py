"""
SHADOWGLASS API - Main Application
Professional Penetration Testing Toolkit
Authority Level 7+ Required

ECHO OMEGA PRIME | Authority 11.0 SOVEREIGN
McWilliams Security Consulting
"""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging

from core.config import (
    API_TITLE,
    API_VERSION,
    API_DESCRIPTION,
    CORS_ORIGINS,
    EVASION_TECHNIQUES_COUNT,
    SEARCH_ENGINES
)
from api import (
    # Browser modules
    browser_router,
    search_router,
    profiles_router,
    proxy_router,
    # Pentest infrastructure
    assessments_router,
    targets_router,
    findings_router,
    evidence_router,
    reports_router,
    # Prometheus Prime OSINT
    prometheus_router,
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title=API_TITLE,
    version=API_VERSION,
    description=f"""{API_DESCRIPTION}

## Professional Penetration Testing Toolkit

This API provides:
- **Assessment Management**: Create and manage security assessments
- **Scope Validation**: Enforce authorized targets only
- **Evidence Logging**: Capture all testing activity
- **Finding Tracking**: Document vulnerabilities
- **Report Generation**: Professional pentest reports
- **Prometheus Prime OSINT**: Email, phone, username enumeration

### Compliance
- PTES (Penetration Testing Execution Standard)
- OWASP Testing Guide
- NIST SP 800-115

### Authorization Required
Authority Level 7+ is required for all endpoints.
""",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include browser routers
app.include_router(browser_router, prefix="/api")
app.include_router(search_router, prefix="/api")
app.include_router(profiles_router, prefix="/api")
app.include_router(proxy_router, prefix="/api")

# Include pentest infrastructure routers
app.include_router(assessments_router, prefix="/api")
app.include_router(targets_router, prefix="/api")
app.include_router(findings_router, prefix="/api")
app.include_router(evidence_router, prefix="/api")
app.include_router(reports_router, prefix="/api")

# Include Prometheus Prime OSINT router
app.include_router(prometheus_router, prefix="/api")


@app.get("/")
async def root():
    """API Root - System Info"""
    return {
        "name": "SHADOWGLASS API",
        "version": API_VERSION,
        "status": "operational",
        "authority_required": 7,
        "type": "Professional Penetration Testing Toolkit",
        "features": {
            "evasion_techniques": EVASION_TECHNIQUES_COUNT,
            "search_engines": len(SEARCH_ENGINES),
            "device_profiles": 9,
            "proxy_countries": 10
        },
        "pentest_features": {
            "assessment_management": True,
            "scope_validation": True,
            "evidence_logging": True,
            "finding_tracking": True,
            "report_generation": True,
            "prometheus_osint": True
        },
        "compliance": ["PTES", "OWASP", "NIST SP 800-115"],
        "endpoints": {
            # Browser
            "browser": "/api/browser",
            "search": "/api/search",
            "profiles": "/api/profiles",
            "proxy": "/api/proxy",
            # Pentest
            "assessments": "/api/assessments",
            "targets": "/api/targets",
            "findings": "/api/findings",
            "evidence": "/api/evidence",
            "reports": "/api/reports",
            # OSINT
            "prometheus": "/api/prometheus"
        }
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "shadowglass-api",
        "version": API_VERSION
    }


@app.get("/api/stats")
async def api_stats():
    """Public API stats"""
    return {
        "total_techniques": EVASION_TECHNIQUES_COUNT,
        "search_engines": list(SEARCH_ENGINES.keys()),
        "authority_required": 7,
        "api_version": API_VERSION,
        "capabilities": [
            "browser_fingerprint_testing",
            "proxy_detection_testing",
            "evasion_technique_testing",
            "assessment_management",
            "scope_enforcement",
            "evidence_capture",
            "vulnerability_tracking",
            "report_generation",
            "prometheus_osint"
        ]
    }


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler"""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "detail": str(exc) if app.debug else "An unexpected error occurred"
        }
    )


# Startup event
@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    logger.info("="*60)
    logger.info("SHADOWGLASS API Starting")
    logger.info("Professional Penetration Testing Toolkit")
    logger.info(f"Version: {API_VERSION}")
    logger.info("="*60)


# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("SHADOWGLASS API Shutting down")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)
