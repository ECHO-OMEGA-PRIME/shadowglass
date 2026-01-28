"""
SHADOWGLASS Configuration
Authority Level 7+ Required
"""
import os
from typing import List

# API Settings
API_TITLE = "SHADOWGLASS API"
API_VERSION = "1.0.0"
API_DESCRIPTION = "Private Stealth Browser API - Authority Level 7+ Required"

# CORS Origins
CORS_ORIGINS: List[str] = [
    "https://echo-op.com",
    "https://www.echo-op.com",
    "http://localhost:3000",
    "http://localhost:3001",
]

# Firebase Project
FIREBASE_PROJECT_ID = os.getenv("FIREBASE_PROJECT_ID", "echo-prime-ai")

# Minimum trust level required
MIN_TRUST_LEVEL = 7

# Search Engines
SEARCH_ENGINES = {
    "duckduckgo": {"name": "DuckDuckGo", "icon": "duck", "url": "https://duckduckgo.com/"},
    "searx": {"name": "SearX", "icon": "search", "url": "https://searx.be/"},
    "brave": {"name": "Brave Search", "icon": "lion", "url": "https://search.brave.com/"},
    "startpage": {"name": "Startpage", "icon": "globe", "url": "https://www.startpage.com/"},
    "qwant": {"name": "Qwant", "icon": "lock", "url": "https://www.qwant.com/"},
    "mojeek": {"name": "Mojeek", "icon": "target", "url": "https://www.mojeek.com/"},
    "swisscows": {"name": "Swisscows", "icon": "swiss", "url": "https://swisscows.com/"},
    "metager": {"name": "MetaGer", "icon": "german", "url": "https://metager.org/"},
}

# Device Types
DEVICE_TYPES = [
    {"id": "windows_desktop", "name": "Windows Desktop", "os": "Windows 11", "browser": "Chrome"},
    {"id": "windows_laptop", "name": "Windows Laptop", "os": "Windows 10", "browser": "Edge"},
    {"id": "mac_desktop", "name": "Mac Desktop", "os": "macOS Ventura", "browser": "Safari"},
    {"id": "mac_laptop", "name": "MacBook Pro", "os": "macOS Sonoma", "browser": "Chrome"},
    {"id": "linux_desktop", "name": "Linux Desktop", "os": "Ubuntu 22.04", "browser": "Firefox"},
    {"id": "android_phone", "name": "Android Phone", "os": "Android 14", "browser": "Chrome Mobile"},
    {"id": "android_tablet", "name": "Android Tablet", "os": "Android 13", "browser": "Chrome Mobile"},
    {"id": "iphone", "name": "iPhone", "os": "iOS 17", "browser": "Safari Mobile"},
    {"id": "ipad", "name": "iPad", "os": "iPadOS 17", "browser": "Safari Mobile"},
]

# Countries for proxy selection
COUNTRIES = [
    {"code": "US", "name": "United States"},
    {"code": "GB", "name": "United Kingdom"},
    {"code": "DE", "name": "Germany"},
    {"code": "FR", "name": "France"},
    {"code": "NL", "name": "Netherlands"},
    {"code": "CH", "name": "Switzerland"},
    {"code": "CA", "name": "Canada"},
    {"code": "AU", "name": "Australia"},
    {"code": "JP", "name": "Japan"},
    {"code": "SG", "name": "Singapore"},
]

# Evasion Techniques Count
EVASION_TECHNIQUES_COUNT = 50
