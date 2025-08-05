from abc import ABC, abstractmethod
from typing import List, Optional, Dict, Any
import asyncio
import time
import httpx
from loguru import logger
from tenacity import retry, stop_after_attempt, wait_exponential
import redis.asyncio as redis

from ..models.schemas import Product, ScrapingResult, RetailerConfig, Language
from ..utils.normalization import ProductNormalizer

class AbstractScrapingAgent(ABC):
    """
    Abstract base class for all retailer scraping agents
    Each Egyptian retailer will have its own implementation
    """
    
    def __init__(self, config: RetailerConfig, redis_client: redis.Redis):
        self.config = config
        self.redis_client = redis_client
        self.normalizer = ProductNormalizer()
        self.session: Optional[httpx.AsyncClient] = None
        
    async def __aenter__(self):
        """Async context manager entry"""
        self.session = httpx.AsyncClient(
            timeout=httpx.Timeout(self.config.timeout_seconds),
            headers={
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        )
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        if self.session:
            await self.session.aclose()
    
    @abstractmethod
    async def search_products(self, query: str, language: Language = Language.ARABIC, max_results: int = 20) -> List[Product]:
        """
        Search for products on this retailer's website
        Must be implemented by each retailer agent
        """
        pass
    
    @abstractmethod
    def get_search_url(self, query: str) -> str:
        """
        Generate the search URL for this retailer
        Must be implemented by each retailer agent
        """
        pass
    
    async def execute_search(self, query: str, request_id: str, language: Language = Language.ARABIC, max_results: int = 20) -> ScrapingResult:
        """
        Execute the search and return structured result
        This is the main entry point called by the orchestrator
        """
        start_time = time.time()
        
        try:
            logger.info(f"[{self.config.name}] Starting search for: {query}")
            
            # Store search start in Redis
            await self.redis_client.hset(
                f"search:{request_id}:{self.config.name}",
                mapping={
                    "status": "started",
                    "query": query,
                    "start_time": str(start_time)
                }
            )
            await self.redis_client.expire(f"search:{request_id}:{self.config.name}", 300)  # 5 min TTL
            
            # Execute the actual search with retry logic
            products = await self._search_with_retry(query, language, max_results)
            
            # Normalize products
            normalized_products = []
            for product in products:
                try:
                    normalized_product = await self.normalizer.normalize_product(product, query)
                    normalized_products.append(normalized_product)
                except Exception as e:
                    logger.warning(f"[{self.config.name}] Failed to normalize product: {e}")
                    normalized_products.append(product)  # Use original if normalization fails
            
            response_time_ms = int((time.time() - start_time) * 1000)
            
            # Store results in Redis
            await self.redis_client.hset(
                f"search:{request_id}:{self.config.name}",
                mapping={
                    "status": "completed",
                    "products_found": len(normalized_products),
                    "response_time_ms": response_time_ms
                }
            )
            
            # Store individual products
            for i, product in enumerate(normalized_products):
                await self.redis_client.hset(
                    f"search:{request_id}:{self.config.name}:product:{i}",
                    mapping=product.dict()
                )
                await self.redis_client.expire(f"search:{request_id}:{self.config.name}:product:{i}", 300)
            
            logger.info(f"[{self.config.name}] Found {len(normalized_products)} products in {response_time_ms}ms")
            
            return ScrapingResult(
                retailer=self.config.name,
                products=normalized_products,
                success=True,
                response_time_ms=response_time_ms,
                products_found=len(normalized_products)
            )
            
        except Exception as e:
            response_time_ms = int((time.time() - start_time) * 1000)
            error_msg = str(e)
            
            logger.error(f"[{self.config.name}] Search failed: {error_msg}")
            
            # Store error in Redis
            await self.redis_client.hset(
                f"search:{request_id}:{self.config.name}",
                mapping={
                    "status": "failed",
                    "error": error_msg,
                    "response_time_ms": response_time_ms
                }
            )
            
            return ScrapingResult(
                retailer=self.config.name,
                products=[],
                success=False,
                error_message=error_msg,
                response_time_ms=response_time_ms,
                products_found=0
            )
    
    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
    async def _search_with_retry(self, query: str, language: Language, max_results: int) -> List[Product]:
        """Execute search with retry logic"""
        async with self:
            return await self.search_products(query, language, max_results)
    
    async def test_connection(self) -> bool:
        """Test if the retailer website is accessible"""
        try:
            async with self:
                response = await self.session.get(self.config.base_url)
                return response.status_code == 200
        except Exception as e:
            logger.error(f"[{self.config.name}] Connection test failed: {e}")
            return False
    
    def extract_price(self, price_text: str) -> Optional[float]:
        """Extract numeric price from text"""
        try:
            import re
            # Remove currency symbols and extract numbers
            price_clean = re.sub(r'[^\d.,]', '', price_text)
            price_clean = price_clean.replace(',', '')
            return float(price_clean)
        except (ValueError, AttributeError):
            return None
    
    def extract_weight(self, text: str) -> tuple[Optional[float], Optional[str]]:
        """Extract weight and unit from text"""
        try:
            import re
            # Common weight patterns
            patterns = [
                r'(\d+(?:\.\d+)?)\s*(kg|كيلو|كيلوجرام)',
                r'(\d+(?:\.\d+)?)\s*(g|جم|جرام)',
                r'(\d+(?:\.\d+)?)\s*(l|لتر|لتر)',
                r'(\d+(?:\.\d+)?)\s*(ml|مل|مليلتر)',
                r'(\d+)\s*(قطعة|حبة|pc|piece)'
            ]
            
            for pattern in patterns:
                match = re.search(pattern, text, re.IGNORECASE)
                if match:
                    weight = float(match.group(1))
                    unit = match.group(2).lower()
                    
                    # Normalize units
                    unit_mapping = {
                        'kg': 'kg', 'كيلو': 'kg', 'كيلوجرام': 'kg',
                        'g': 'g', 'جم': 'g', 'جرام': 'g',
                        'l': 'l', 'لتر': 'l',
                        'ml': 'ml', 'مل': 'ml', 'مليلتر': 'ml',
                        'قطعة': 'pc', 'حبة': 'pc', 'pc': 'pc', 'piece': 'pc'
                    }
                    
                    return weight, unit_mapping.get(unit, unit)
            
            return None, None
        except Exception:
            return None, None