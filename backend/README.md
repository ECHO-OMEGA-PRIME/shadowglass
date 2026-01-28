# SHADOWGLASS API

## Professional Penetration Testing Toolkit

McWilliams Security Consulting | Authority Level 7+ Required

---

## Overview

SHADOWGLASS is a professional penetration testing toolkit designed for authorized security assessments. It provides:

- **Assessment Management**: Create and manage security engagements
- **Scope Validation**: Enforce testing only against authorized targets
- **Evidence Logging**: Capture all testing activity for reports
- **Finding Tracking**: Document vulnerabilities with OWASP/CVSS alignment
- **Report Generation**: Professional pentest deliverables

## Compliance

This toolkit follows industry standards:
- PTES (Penetration Testing Execution Standard)
- OWASP Testing Guide
- NIST SP 800-115

---

## Quick Start

### Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### Run Development Server

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8080
```

### API Documentation

- Swagger UI: http://localhost:8080/docs
- ReDoc: http://localhost:8080/redoc

---

## API Endpoints

### Browser Modules (Existing)

| Endpoint | Description |
|----------|-------------|
| `/api/browser` | Stealth browser sessions |
| `/api/search` | Uncensored search engines |
| `/api/profiles` | Device profiles |
| `/api/proxy` | Proxy management |

### Pentest Infrastructure (New)

| Endpoint | Description |
|----------|-------------|
| `/api/assessments` | Assessment CRUD |
| `/api/targets` | Scope management |
| `/api/findings` | Vulnerability tracking |
| `/api/evidence` | Audit trails |
| `/api/reports` | Report generation |

---

## Workflow

### 1. Create Assessment

```bash
POST /api/assessments
{
  "name": "Q1 2026 Security Assessment",
  "client_name": "Acme Corp",
  "methodology": "PTES",
  "roe_document_url": "https://...",
  "sow_document_url": "https://..."
}
```

### 2. Define Scope

```bash
POST /api/targets
{
  "assessment_id": "...",
  "value": "*.acme.com",
  "target_type": "domain",
  "scope": "in_scope"
}
```

### 3. Validate Before Testing

```bash
POST /api/targets/validate?assessment_id=...&target_value=app.acme.com

Response:
{
  "is_in_scope": true,
  "matched_target": "*.acme.com",
  "match_type": "domain"
}
```

### 4. Log Evidence

```bash
POST /api/evidence/log-request
{
  "assessment_id": "...",
  "method": "GET",
  "url": "https://app.acme.com/api/users",
  "headers": {...}
}
```

### 5. Document Findings

```bash
POST /api/findings
{
  "assessment_id": "...",
  "title": "SQL Injection in Login",
  "description": "...",
  "severity": "critical",
  "category": "A03_Injection"
}
```

### 6. Generate Report

```bash
GET /api/reports/{assessment_id}/generate?format=markdown
```

---

## Key Features

### Scope Validator

The scope validator is a **mandatory security control** that prevents testing against unauthorized targets:

```python
from services.scope_validator import get_scope_validator, OutOfScopeError

validator = get_scope_validator(assessment_id)

# Check if target is authorized
result = validator.is_in_scope("https://target.com/api")

if not result.is_in_scope:
    raise OutOfScopeError(target, result.reason)
```

### Evidence Logger

Captures all testing activity for audit trails:

```python
from services.evidence_logger import get_evidence_logger

logger = get_evidence_logger(assessment_id, user_id)

# Log HTTP request
logger.log_http_request(
    method="POST",
    url="https://target.com/login",
    headers={"Content-Type": "application/json"},
    body='{"user": "test"}'
)
```

### Report Generator

Creates professional reports following PTES format:

```python
from services.report_generator import ReportGenerator, ReportFormat

generator = ReportGenerator(assessment, targets, findings, evidence)

# Generate markdown report
report = generator.generate(format=ReportFormat.MARKDOWN)

# Generate executive summary
summary = generator.generate(format=ReportFormat.EXECUTIVE)
```

---

## Architecture

```
backend/
├── main.py                 # FastAPI application
├── api/
│   ├── assessments.py      # Assessment CRUD
│   ├── targets.py          # Scope management
│   ├── findings.py         # Vulnerability tracking
│   ├── evidence.py         # Audit logging
│   ├── reports.py          # Report generation
│   ├── browser.py          # Browser sessions
│   ├── search.py           # Search engines
│   ├── profiles.py         # Device profiles
│   └── proxy.py            # Proxy management
├── models/
│   ├── assessment.py       # Assessment model
│   ├── target.py           # Target/scope model
│   ├── finding.py          # Finding model
│   └── evidence.py         # Evidence model
├── services/
│   ├── scope_validator.py  # Scope enforcement
│   ├── evidence_logger.py  # Evidence capture
│   ├── report_generator.py # Report creation
│   └── data_store.py       # Data storage
└── core/
    ├── config.py           # Configuration
    └── auth.py             # Authentication
```

---

## Security Considerations

1. **Scope Validation**: All testing MUST pass through scope validation
2. **Evidence Logging**: All activity is logged for audit trails
3. **Authorization**: Level 7+ authority required
4. **ROE Compliance**: Always have signed ROE before testing

---

## Authority: 11.0 SOVEREIGN

McWilliams Security Consulting
Echo Omega Prime
