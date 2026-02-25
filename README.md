<p align="center">
  <h1 align="center">ShadowGlass</h1>
  <p align="center">
    Privacy-first stealth browser and professional penetration testing toolkit with 50+ evasion techniques, OSINT integration, and full assessment lifecycle management.
  </p>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/python-3.11+-blue?logo=python&logoColor=white" alt="Python 3.11+">
  <img src="https://img.shields.io/badge/FastAPI-latest-009688?logo=fastapi&logoColor=white" alt="FastAPI">
  <img src="https://img.shields.io/badge/Next.js-14-black?logo=next.js&logoColor=white" alt="Next.js">
  <img src="https://img.shields.io/badge/Selenium-stealth-43B02A?logo=selenium&logoColor=white" alt="Selenium">
  <img src="https://img.shields.io/badge/lines-18%2C300+-purple" alt="18,300+ lines">
  <img src="https://img.shields.io/badge/license-Private-red" alt="Private">
</p>

---

## Overview

ShadowGlass is a comprehensive security platform combining an anti-detection stealth browser engine with a professional penetration testing toolkit. The browser component implements 50+ evasion techniques spanning fingerprint randomization, headless detection prevention, TLS/HTTP2 spoofing, and human behavioral mimicry. The pentest component provides full assessment lifecycle management with scope validation, evidence logging, finding tracking, and report generation -- all compliant with PTES, OWASP, and NIST SP 800-115 standards. Integrated OSINT capabilities are provided through the Prometheus Prime module.

---

## Architecture

```
shadowglass/
+-- browser/                          # Stealth browser engine
|   +-- unified_browser.py           # OmegaPrimeEchoBrowser - main entry point
|   +-- anti_detect_browser.py       # Core anti-detection layer
|   +-- headless_detection_prevention.py # WebDriver hiding, CDP concealment
|   +-- behavioral_mimicry.py        # Human mouse/typing/scroll simulation
|   +-- enterprise_evasion.py        # Corporate firewall bypass techniques
|   +-- residential_proxy_system.py  # Residential proxy pool management
|   +-- realistic_profile_generator.py # Device/OS/browser profile generation
|   +-- tls_http2_fingerprinting.py  # JA3/JA3S/HTTP2 fingerprint spoofing
|   +-- search_engine_integration.py # 8 privacy-focused search engines
|   +-- fingerprint_tester.py        # Fingerprint verification suite
|   +-- advanced_features.py         # Session persistence, CAPTCHA, monitoring
|   +-- proxy_manager.py            # Proxy rotation and health checking
|   +-- omega_prime_echo.py         # Orchestration layer
+-- backend/                         # FastAPI pentest API
|   +-- main.py                     # Application factory, route registration
|   +-- core/
|   |   +-- config.py              # Application configuration
|   |   +-- auth.py                # Authentication and authorization
|   +-- api/
|   |   +-- assessments.py         # Assessment CRUD and lifecycle
|   |   +-- browser.py             # Browser session management
|   |   +-- search.py              # Search engine API
|   |   +-- profiles.py            # Browser profile management
|   |   +-- proxy.py               # Proxy configuration
|   |   +-- targets.py             # Target scope management
|   |   +-- findings.py            # Vulnerability documentation
|   |   +-- evidence.py            # Evidence capture and storage
|   |   +-- reports.py             # Professional report generation
|   |   +-- prometheus.py          # OSINT integration
|   +-- services/
|   |   +-- browser_service.py     # Browser session orchestration
|   |   +-- search_service.py      # Search aggregation
|   |   +-- profile_service.py     # Profile generation
|   |   +-- scope_validator.py     # Authorization enforcement
|   |   +-- evidence_logger.py     # Forensic evidence capture
|   |   +-- report_generator.py    # PDF/HTML report builder
|   |   +-- data_store.py          # Data persistence layer
|   |   +-- firebase_service.py    # Firebase cloud sync
|   |   +-- prometheus_integration.py # Prometheus Prime OSINT bridge
|   +-- models/
|       +-- assessment.py          # Assessment data model
|       +-- target.py              # Target/scope model
|       +-- finding.py             # Vulnerability finding model
|       +-- evidence.py            # Evidence artifact model
+-- frontend/                       # Next.js web interface
|   +-- app/
|   |   +-- page.tsx               # Dashboard
|   |   +-- assessments/           # Assessment management
|   |   +-- targets/               # Target scope views
|   |   +-- findings/              # Finding browser
|   |   +-- reports/               # Report viewer
|   |   +-- prometheus/            # OSINT tools
|   |   +-- login/                 # Authentication
|   |   +-- osint/                 # OSINT dashboard
|   +-- components/
|   |   +-- ErrorBoundary.tsx
|   |   +-- LoadingSpinner.tsx
|   |   +-- Providers.tsx
|   |   +-- Sidebar.tsx
|   +-- lib/
|   |   +-- api.ts                 # API client
|   |   +-- auth.ts                # Auth helpers
|   |   +-- AuthContext.tsx         # Auth state provider
|   |   +-- echo-prime.ts          # Echo Prime integration
|   |   +-- security.ts            # Client-side security
|   |   +-- env-validation.ts      # Environment validation
|   +-- middleware.ts              # Auth middleware
```

---

## Evasion Techniques (50+)

### Browser Fingerprinting Prevention (15 techniques)

| Technique | Description |
|-----------|-------------|
| Canvas Fingerprint Noise | Injects controlled noise into canvas operations |
| WebGL Vendor/Renderer Spoofing | Randomizes GPU identification strings |
| AudioContext Fingerprinting | Randomizes audio processing fingerprint |
| Screen Resolution Spoofing | Reports different screen dimensions |
| Device Pixel Ratio | Modifies DPR to match profile |
| Color Depth Randomization | Varies reported color depth |
| Plugin List Spoofing | Injects realistic browser plugin list |
| Navigator Property Override | Overrides platform, vendor, language |
| Battery API Spoofing | Fakes battery status readings |
| Network Information Spoofing | Spoofs connection type and speed |
| Hardware Concurrency | Modifies reported CPU core count |
| Device Memory Spoofing | Changes reported device memory |
| Touch Support Spoofing | Adds/removes touch capability |
| Pointer/Hover Capability | Adjusts pointer media queries |
| PDF Viewer Detection | Prevents PDF viewer fingerprinting |

### Headless Detection Prevention (10 techniques)

| Technique | Description |
|-----------|-------------|
| WebDriver Property Hiding | Removes `navigator.webdriver` flag |
| Chrome Runtime Injection | Injects `window.chrome` object |
| Plugin Array Population | Adds realistic plugin entries |
| Permissions API Spoofing | Returns human-like permission responses |
| Notification Permission | Handles notification API naturally |
| Language Consistency | Ensures language headers match navigator |
| Automation Flag Removal | Clears Chrome automation flags |
| CDP Protocol Hiding | Conceals DevTools Protocol connections |
| Chrome Object Injection | Full `chrome.runtime` mock |
| WebDriver Flag Deletion | Removes all webdriver indicators |

### Enterprise Evasion (30+ techniques)

| Category | Techniques |
|----------|------------|
| TLS/SSL | JA3/JA3S fingerprint rotation, cipher suite randomization |
| HTTP/2 | Frame ordering, SETTINGS spoofing, priority tree mimicry |
| Headers | Order randomization, Accept-Language consistency, DNT management |
| Behavior | Mouse movement (Bezier curves), typing delays, scroll simulation |
| Timing | Request timing humanization, page load delays, form fill pacing |
| Session | Cookie management, localStorage handling, referrer policy |
| Advanced | Tab switching patterns, window focus/blur, page visibility |

---

## Uncensored Search Engines (8)

| Engine | Focus |
|--------|-------|
| DuckDuckGo | Privacy-focused, no tracking |
| SearX | Open-source metasearch |
| Brave Search | Independent index, no big-tech |
| Startpage | Google results with privacy |
| Qwant | European privacy laws |
| Mojeek | Independent web crawler |
| Swisscows | Swiss data protection |
| MetaGer | German privacy, Tor support |

---

## Penetration Testing Features

### Assessment Lifecycle
```
Create Assessment -> Define Scope -> Validate Targets -> Execute Testing
       |                                                       |
       v                                                       v
  Set Parameters                                     Log Evidence
       |                                                       |
       v                                                       v
  Assign Team                                        Track Findings
       |                                                       |
       v                                                       v
  Schedule Window                                    Generate Report
```

### API Endpoints

| Category | Method | Endpoint | Description |
|----------|--------|----------|-------------|
| Browser | POST | `/api/browser/session` | Create stealth browser session |
| Browser | GET | `/api/browser/session/{id}` | Get session status |
| Browser | DELETE | `/api/browser/session/{id}` | Close session |
| Search | GET | `/api/search/{engine}` | Execute privacy search |
| Profiles | GET | `/api/profiles` | List browser profiles |
| Profiles | POST | `/api/profiles/generate` | Generate new profile |
| Proxy | GET | `/api/proxy/list` | List proxy pool |
| Proxy | POST | `/api/proxy/test` | Test proxy health |
| Assessments | GET | `/api/assessments` | List assessments |
| Assessments | POST | `/api/assessments` | Create assessment |
| Assessments | GET | `/api/assessments/{id}` | Get assessment detail |
| Targets | GET | `/api/targets` | List authorized targets |
| Targets | POST | `/api/targets` | Add target to scope |
| Findings | GET | `/api/findings` | List findings |
| Findings | POST | `/api/findings` | Report finding |
| Evidence | GET | `/api/evidence` | List evidence |
| Evidence | POST | `/api/evidence` | Upload evidence artifact |
| Reports | GET | `/api/reports` | List reports |
| Reports | POST | `/api/reports/generate` | Generate pentest report |
| OSINT | GET | `/api/prometheus/email/{email}` | Email enumeration |
| OSINT | GET | `/api/prometheus/phone/{phone}` | Phone lookup |
| OSINT | GET | `/api/prometheus/username/{user}` | Username search |
| System | GET | `/health` | Health check |
| System | GET | `/api/stats` | System statistics |

### Compliance Standards
- **PTES** - Penetration Testing Execution Standard
- **OWASP** - Testing Guide methodology
- **NIST SP 800-115** - Technical Guide to Information Security Testing

---

## Quick Start

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8080 --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Stealth Browser (Python)
```python
from browser.unified_browser import OmegaPrimeEchoBrowser

omega = OmegaPrimeEchoBrowser()
session = omega.create_session(
    device_type='desktop_highend',
    country='US',
    use_proxy=True
)
driver = session.browser_session.driver
driver.get('https://example.com')
omega.close_session(session.session_id)
```

---

## Device Profiles

| Profile | OS | Browser | Typical Use |
|---------|-----|---------|-------------|
| `desktop_highend` | Win 11 / macOS | Chrome 120+ | General browsing |
| `desktop_midrange` | Win 10 | Chrome/Firefox | Corporate networks |
| `desktop_linux` | Ubuntu 22 | Firefox | Developer environments |
| `mobile_ios` | iOS 17 | Safari | Mobile simulation |
| `mobile_android` | Android 14 | Chrome Mobile | Mobile simulation |
| `tablet_ipad` | iPadOS 17 | Safari | Tablet simulation |
| `corporate_win` | Win 11 Enterprise | Edge | Corporate bypass |
| `developer` | macOS | Chrome Dev | Developer tools |
| `privacy_focused` | Various | Firefox | Maximum anonymity |

---

## Security Notice

This tool is designed for **authorized security testing only**. Use exclusively on systems you own or have explicit written permission to test. Unauthorized access to computer systems is illegal. Always maintain proper scope documentation and evidence logging.

---

## License

Private. All rights reserved.

## Part of Echo Omega Prime

Built by [Echo Prime Technologies](https://echo-ept.com) as part of the Echo Omega Prime autonomous AI platform.
