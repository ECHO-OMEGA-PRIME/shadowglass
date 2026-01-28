"""
SHADOWGLASS Search Engine API
8 Uncensored Search Engines
Authority Level 7+ Required
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import httpx

from core.auth import get_current_user
from core.config import SEARCH_ENGINES

router = APIRouter(prefix="/search", tags=["Search"])

class SearchRequest(BaseModel):
    query: str
    engine: str = "duckduckgo"
    safe_search: bool = False
    max_results: int = 10

class SearchResult(BaseModel):
    title: str
    url: str
    snippet: str
    engine: str

class SearchResponse(BaseModel):
    query: str
    engine: str
    results: List[SearchResult]
    total: int
    searched_at: str

class SearchEngineInfo(BaseModel):
    id: str
    name: str
    icon: str
    url: str
    privacy_focused: bool = True
    uncensored: bool = True

@router.get("/engines", response_model=List[SearchEngineInfo])
async def list_engines(user: dict = Depends(get_current_user)):
    """List all 8 uncensored search engines"""
    return [
        SearchEngineInfo(
            id=engine_id,
            **engine_data,
            privacy_focused=True,
            uncensored=True
        )
        for engine_id, engine_data in SEARCH_ENGINES.items()
    ]

@router.post("/query", response_model=SearchResponse)
async def execute_search(
    request: SearchRequest,
    user: dict = Depends(get_current_user)
):
    """Execute a search query through selected engine"""
    if request.engine not in SEARCH_ENGINES:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown engine: {request.engine}. Available: {list(SEARCH_ENGINES.keys())}"
        )

    engine = SEARCH_ENGINES[request.engine]

    # For demo/MVP - return mock results
    # In production, use the browser modules to actually scrape
    mock_results = [
        SearchResult(
            title=f"Result {i+1} for: {request.query}",
            url=f"{engine['url']}?q={request.query.replace(' ', '+')}",
            snippet=f"This is a search result from {engine['name']} for your query about {request.query}.",
            engine=request.engine
        )
        for i in range(min(request.max_results, 5))
    ]

    return SearchResponse(
        query=request.query,
        engine=request.engine,
        results=mock_results,
        total=len(mock_results),
        searched_at=datetime.utcnow().isoformat()
    )

@router.get("/engine/{engine_id}")
async def get_engine_info(engine_id: str, user: dict = Depends(get_current_user)):
    """Get detailed info about a search engine"""
    if engine_id not in SEARCH_ENGINES:
        raise HTTPException(status_code=404, detail="Engine not found")

    engine = SEARCH_ENGINES[engine_id]
    return {
        "id": engine_id,
        **engine,
        "privacy_focused": True,
        "uncensored": True,
        "features": [
            "No tracking",
            "No personalized results",
            "Anonymous search",
            "HTTPS only"
        ]
    }
