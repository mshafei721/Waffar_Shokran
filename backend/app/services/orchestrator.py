import asyncio
import time
from typing import List, Dict, Any
from loguru import logger
import redis.asyncio as redis

from ..models.schemas import Product, Language, ScrapingResult
from ..agents.registry import get_active_agents
from ..utils.alternative_finder import AlternativeFinder

class SearchOrchestrator:
    """
    Orchestrates parallel scraping agents and aggregates results
    Core component that manages the multi-agent search system
    """
    
    def __init__(self, redis_client: redis.Redis, request_id: str):
        self.redis_client = redis_client
        self.request_id = request_id
        self.search_time_ms: int = 0
        self.retailers_searched: List[str] = []
        self.alternative_finder = AlternativeFinder()
        
    async def search_products(self, query: str, language: Language = Language.ARABIC, max_results: int = 50) -> List[Product]:
        """
        Execute parallel search across all active Egyptian retailers
        Returns aggregated and ranked results within 3 seconds
        """
        start_time = time.time()
        
        try:
            # Get all active agents
            agents = await get_active_agents(self.redis_client)
            self.retailers_searched = [agent.config.name for agent in agents]
            
            logger.info(f"Starting parallel search across {len(agents)} retailers for: {query}")
            
            # Store search metadata in Redis
            await self.redis_client.hset(
                f"search:{self.request_id}",
                mapping={
                    "query": query,
                    "language": language.value,
                    "start_time": str(start_time),
                    "retailers_count": len(agents),
                    "status": "running"
                }
            )
            await self.redis_client.expire(f"search:{self.request_id}", 300)  # 5 min TTL
            
            # Execute parallel searches with 3-second timeout
            search_tasks = []
            for agent in agents:
                task = asyncio.create_task(
                    agent.execute_search(query, self.request_id, language, max_results // len(agents))
                )
                search_tasks.append(task)
            
            # Wait for all searches with timeout
            try:
                results = await asyncio.wait_for(
                    asyncio.gather(*search_tasks, return_exceptions=True),
                    timeout=2.8  # Leave 200ms buffer for processing
                )
            except asyncio.TimeoutError:
                logger.warning(f"Search timeout reached for request {self.request_id}")
                # Cancel remaining tasks
                for task in search_tasks:
                    if not task.done():
                        task.cancel()
                results = [task.result() if task.done() else None for task in search_tasks]
            
            # Process results
            all_products = []
            successful_retailers = []
            failed_retailers = []
            
            for i, result in enumerate(results):
                if isinstance(result, Exception):
                    logger.error(f"Agent {agents[i].config.name} failed with exception: {result}")
                    failed_retailers.append(agents[i].config.name)
                    continue
                    
                if result and isinstance(result, ScrapingResult):
                    if result.success and result.products:
                        all_products.extend(result.products)
                        successful_retailers.append(result.retailer)
                        logger.info(f"[{result.retailer}] Retrieved {len(result.products)} products")
                    else:
                        failed_retailers.append(result.retailer)
                        logger.warning(f"[{result.retailer}] Search failed: {result.error_message}")
            
            # Deduplicate and rank products
            deduplicated_products = await self._deduplicate_products(all_products)
            ranked_products = await self._rank_products(deduplicated_products, query)
            
            # Find alternatives if needed
            if len(ranked_products) < 5:  # If we have few results, find alternatives
                alternatives = await self.alternative_finder.find_alternatives(
                    query, ranked_products, self.redis_client
                )
                ranked_products.extend(alternatives)
            
            # Limit to max_results
            final_products = ranked_products[:max_results]
            
            self.search_time_ms = int((time.time() - start_time) * 1000)
            
            # Update search metadata
            await self.redis_client.hset(
                f"search:{self.request_id}",
                mapping={
                    "status": "completed",
                    "total_products": len(final_products),
                    "successful_retailers": ",".join(successful_retailers),
                    "failed_retailers": ",".join(failed_retailers),
                    "search_time_ms": self.search_time_ms
                }
            )
            
            logger.info(f"Search completed in {self.search_time_ms}ms. Found {len(final_products)} products from {len(successful_retailers)} retailers")
            
            return final_products
            
        except Exception as e:
            self.search_time_ms = int((time.time() - start_time) * 1000)
            logger.error(f"Orchestrator error: {e}")
            
            await self.redis_client.hset(
                f"search:{self.request_id}",
                mapping={
                    "status": "failed",
                    "error": str(e),
                    "search_time_ms": self.search_time_ms
                }
            )
            
            raise e
    
    async def _deduplicate_products(self, products: List[Product]) -> List[Product]:
        """
        Remove duplicate products based on name, brand, and price similarity
        """
        if not products:
            return []
        
        deduplicated = []
        seen_products = set()
        
        for product in products:
            # Create a signature for deduplication
            name_normalized = product.name.lower().strip()
            price_rounded = round(product.price, 2) if product.price else 0
            brand_normalized = product.brand.lower().strip() if product.brand else ""
            
            signature = f"{name_normalized}_{brand_normalized}_{price_rounded}"
            
            if signature not in seen_products:
                seen_products.add(signature)
                deduplicated.append(product)
        
        logger.info(f"Deduplicated {len(products)} products to {len(deduplicated)}")
        return deduplicated
    
    async def _rank_products(self, products: List[Product], query: str) -> List[Product]:
        """
        Rank products by relevance and price
        Primary sort: relevance to query
        Secondary sort: price (lowest first)
        """
        def calculate_relevance_score(product: Product, query: str) -> float:
            score = 0.0
            query_lower = query.lower()
            
            # Name matching
            if query_lower in product.name.lower():
                score += 0.5
            
            # Brand matching
            if product.brand and query_lower in product.brand.lower():
                score += 0.3
            
            # Exact word matches in name
            query_words = query_lower.split()
            product_words = product.name.lower().split()
            common_words = set(query_words) & set(product_words)
            score += len(common_words) * 0.1
            
            # Confidence score from scraping
            score += product.confidence_score * 0.1
            
            # Stock bonus
            if product.in_stock:
                score += 0.1
            
            return score
        
        # Calculate relevance scores
        scored_products = []
        for product in products:
            relevance = calculate_relevance_score(product, query)
            scored_products.append((product, relevance))
        
        # Sort by relevance (desc) then by price (asc)
        scored_products.sort(key=lambda x: (-x[1], x[0].price if x[0].price else float('inf')))
        
        return [product for product, _ in scored_products]
    
    async def get_search_status(self) -> Dict[str, Any]:
        """Get current search status from Redis"""
        status = await self.redis_client.hgetall(f"search:{self.request_id}")
        return status if status else {"status": "not_found"}