from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import asyncio
import redis.asyncio as redis
import os
from loguru import logger
import uuid
from datetime import datetime

from .services.orchestrator import SearchOrchestrator
from .models.schemas import SearchRequest, SearchResponse, Product

app = FastAPI(
    title="Waffar Shokran - Egyptian Price Comparison API",
    description="AI-powered price comparison across Egyptian retailers",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Redis connection
redis_client = None

@app.on_event("startup")
async def startup_event():
    global redis_client
    redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
    redis_client = redis.from_url(redis_url, decode_responses=True)
    logger.info("Connected to Redis")

@app.on_event("shutdown")
async def shutdown_event():
    if redis_client:
        await redis_client.close()

@app.get("/")
async def root():
    return {"message": "Waffar Shokran API - Egyptian Price Comparison"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

@app.post("/search", response_model=SearchResponse)
async def search_products(request: SearchRequest):
    """
    Search for products across Egyptian retailers
    Returns price comparison results in under 3 seconds
    """
    try:
        request_id = str(uuid.uuid4())
        logger.info(f"Processing search request {request_id}: {request.query}")
        
        # Initialize orchestrator
        orchestrator = SearchOrchestrator(redis_client, request_id)
        
        # Execute parallel agent search
        results = await orchestrator.search_products(
            query=request.query,
            language=request.language,
            max_results=request.max_results
        )
        
        return SearchResponse(
            request_id=request_id,
            query=request.query,
            products=results,
            total_results=len(results),
            search_time_ms=orchestrator.search_time_ms,
            retailers_searched=orchestrator.retailers_searched
        )
        
    except asyncio.TimeoutError:
        raise HTTPException(
            status_code=408, 
            detail="Search timeout - retailers may be temporarily unavailable"
        )
    except Exception as e:
        logger.error(f"Search error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal search error")

@app.get("/retailers")
async def get_supported_retailers():
    """Get list of supported Egyptian retailers"""
    from .agents.registry import get_available_retailers
    return {"retailers": get_available_retailers()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)