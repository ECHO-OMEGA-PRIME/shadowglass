"""
SHADOWGLASS Authentication
Authority Level 7+ Required
"""
from fastapi import HTTPException, Header, Depends
from typing import Optional
import httpx

from core.config import MIN_TRUST_LEVEL

async def verify_authority(
    authorization: Optional[str] = Header(None),
    x_trust_level: Optional[str] = Header(None, alias="X-Trust-Level"),
    x_user_id: Optional[str] = Header(None, alias="X-User-Id"),
) -> dict:
    """
    Verify that the user has Authority Level 7+
    Headers are passed from the website after Firebase auth
    """
    if not authorization:
        raise HTTPException(
            status_code=401,
            detail="Authorization header required"
        )

    # Trust level passed from website auth
    trust_level = 0
    if x_trust_level:
        try:
            trust_level = int(x_trust_level)
        except ValueError:
            trust_level = 0

    if trust_level < MIN_TRUST_LEVEL:
        raise HTTPException(
            status_code=403,
            detail=f"Authority Level {MIN_TRUST_LEVEL}+ required. Current: {trust_level}"
        )

    return {
        "user_id": x_user_id or "unknown",
        "trust_level": trust_level,
        "authorized": True
    }

async def get_current_user(auth: dict = Depends(verify_authority)) -> dict:
    """Get current authorized user"""
    return auth
