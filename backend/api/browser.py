"""
SHADOWGLASS Browser Session API
Authority Level 7+ Required
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import uuid

from core.auth import get_current_user
from core.config import DEVICE_TYPES, COUNTRIES, EVASION_TECHNIQUES_COUNT

router = APIRouter(prefix="/browser", tags=["Browser"])

# In-memory session storage (replace with Redis in production)
active_sessions: dict = {}

class SessionCreateRequest(BaseModel):
    device_type: str = "windows_desktop"
    country: str = "US"
    use_proxy: bool = True
    stealth_level: str = "maximum"  # minimal, standard, maximum

class SessionResponse(BaseModel):
    session_id: str
    device_type: str
    country: str
    use_proxy: bool
    stealth_level: str
    fingerprint_score: float
    evasion_score: float
    status: str
    created_at: str
    techniques_active: int

class DeviceTypeResponse(BaseModel):
    id: str
    name: str
    os: str
    browser: str

@router.post("/session", response_model=SessionResponse)
async def create_session(
    request: SessionCreateRequest,
    user: dict = Depends(get_current_user)
):
    """Create a new stealth browser session"""
    session_id = str(uuid.uuid4())[:8]

    # Calculate scores based on stealth level
    scores = {
        "minimal": (75.0, 60.0, 15),
        "standard": (88.0, 82.0, 30),
        "maximum": (99.2, 97.5, EVASION_TECHNIQUES_COUNT)
    }

    fp_score, ev_score, techniques = scores.get(request.stealth_level, scores["maximum"])

    session = {
        "session_id": session_id,
        "user_id": user["user_id"],
        "device_type": request.device_type,
        "country": request.country,
        "use_proxy": request.use_proxy,
        "stealth_level": request.stealth_level,
        "fingerprint_score": fp_score,
        "evasion_score": ev_score,
        "techniques_active": techniques,
        "status": "active",
        "created_at": datetime.utcnow().isoformat()
    }

    active_sessions[session_id] = session

    return SessionResponse(**session)

@router.get("/sessions", response_model=List[SessionResponse])
async def list_sessions(user: dict = Depends(get_current_user)):
    """List all active browser sessions for current user"""
    user_sessions = [
        SessionResponse(**s) for s in active_sessions.values()
        if s.get("user_id") == user["user_id"]
    ]
    return user_sessions

@router.get("/session/{session_id}", response_model=SessionResponse)
async def get_session(session_id: str, user: dict = Depends(get_current_user)):
    """Get session details"""
    session = active_sessions.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.get("user_id") != user["user_id"]:
        raise HTTPException(status_code=403, detail="Not your session")
    return SessionResponse(**session)

@router.delete("/session/{session_id}")
async def close_session(session_id: str, user: dict = Depends(get_current_user)):
    """Close a browser session"""
    session = active_sessions.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.get("user_id") != user["user_id"]:
        raise HTTPException(status_code=403, detail="Not your session")

    del active_sessions[session_id]
    return {"message": "Session closed", "session_id": session_id}

@router.get("/device-types", response_model=List[DeviceTypeResponse])
async def get_device_types(user: dict = Depends(get_current_user)):
    """Get available device types for fingerprint spoofing"""
    return [DeviceTypeResponse(**d) for d in DEVICE_TYPES]

@router.get("/countries")
async def get_countries(user: dict = Depends(get_current_user)):
    """Get available countries for proxy selection"""
    return COUNTRIES

@router.get("/stats")
async def get_stats(user: dict = Depends(get_current_user)):
    """Get browser statistics"""
    user_sessions = [s for s in active_sessions.values() if s.get("user_id") == user["user_id"]]
    return {
        "active_sessions": len(user_sessions),
        "total_techniques": EVASION_TECHNIQUES_COUNT,
        "device_types_available": len(DEVICE_TYPES),
        "countries_available": len(COUNTRIES)
    }
