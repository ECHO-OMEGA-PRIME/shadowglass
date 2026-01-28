"""
SHADOWGLASS Browser Service
Interfaces with browser/ modules
"""
import sys
from pathlib import Path
from typing import Optional, Dict, Any

# Add browser modules to path
BROWSER_PATH = Path(__file__).parent.parent.parent / "browser"
if str(BROWSER_PATH) not in sys.path:
    sys.path.insert(0, str(BROWSER_PATH))

class BrowserService:
    """Service for managing stealth browser sessions"""

    def __init__(self):
        self._sessions: Dict[str, Any] = {}

    async def create_session(
        self,
        device_type: str = "windows_desktop",
        country: str = "US",
        use_proxy: bool = True,
        stealth_level: str = "maximum"
    ) -> Dict[str, Any]:
        """Create a new stealth browser session"""
        # In full implementation, this would use unified_browser.py
        # For now, return session metadata
        import uuid
        session_id = str(uuid.uuid4())[:8]

        session = {
            "session_id": session_id,
            "device_type": device_type,
            "country": country,
            "use_proxy": use_proxy,
            "stealth_level": stealth_level,
            "status": "active"
        }

        self._sessions[session_id] = session
        return session

    async def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Get session by ID"""
        return self._sessions.get(session_id)

    async def close_session(self, session_id: str) -> bool:
        """Close a browser session"""
        if session_id in self._sessions:
            # In full implementation, close the actual browser
            del self._sessions[session_id]
            return True
        return False

    async def list_sessions(self, user_id: str) -> list:
        """List all sessions for a user"""
        return [
            s for s in self._sessions.values()
            if s.get("user_id") == user_id
        ]
