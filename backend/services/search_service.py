"""
SHADOWGLASS Search Service
Interfaces with search_engine_integration.py
"""
import sys
from pathlib import Path
from typing import List, Dict, Any

# Add browser modules to path
BROWSER_PATH = Path(__file__).parent.parent.parent / "browser"
if str(BROWSER_PATH) not in sys.path:
    sys.path.insert(0, str(BROWSER_PATH))

class SearchService:
    """Service for executing searches through uncensored engines"""

    ENGINES = {
        "duckduckgo": "https://duckduckgo.com/",
        "searx": "https://searx.be/",
        "brave": "https://search.brave.com/",
        "startpage": "https://www.startpage.com/",
        "qwant": "https://www.qwant.com/",
        "mojeek": "https://www.mojeek.com/",
        "swisscows": "https://swisscows.com/",
        "metager": "https://metager.org/",
    }

    async def search(
        self,
        query: str,
        engine: str = "duckduckgo",
        max_results: int = 10,
        safe_search: bool = False
    ) -> List[Dict[str, Any]]:
        """Execute search through selected engine"""
        # In full implementation, use search_engine_integration.py
        # For now, return mock results
        base_url = self.ENGINES.get(engine, self.ENGINES["duckduckgo"])

        return [
            {
                "title": f"Result {i+1} for: {query}",
                "url": f"{base_url}?q={query.replace(' ', '+')}",
                "snippet": f"Search result from {engine} for query: {query}",
                "engine": engine
            }
            for i in range(min(max_results, 5))
        ]

    def get_engines(self) -> List[Dict[str, str]]:
        """Get list of available search engines"""
        return [
            {"id": engine_id, "url": url}
            for engine_id, url in self.ENGINES.items()
        ]
