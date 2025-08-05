from typing import List, Optional
from urllib.parse import quote
import re
from bs4 import BeautifulSoup
import logging

from .base_agent import AbstractScrapingAgent
from ..models.schemas import Product, Language

logger = logging.getLogger(__name__)

class JumiaAgent(AbstractScrapingAgent):
    """Scraping agent for Jumia Egypt - major e-commerce platform"""
    
    def get_search_url(self, query: str) -> str:
        encoded_query = quote(query)
        return f"{self.config.base_url}/catalog/?q={encoded_query}"
    
    async def search_products(self, query: str, language: Language = Language.ARABIC, max_results: int = 20) -> List[Product]:
        try:
            search_url = self.get_search_url(query)
            logger.info(f"Searching Jumia Egypt: {search_url}")
            
            html_content = await self.fetch_with_retry(search_url)
            if not html_content:
                return []
            
            soup = BeautifulSoup(html_content, 'html.parser')
            products = []
            
            # Jumia product selectors
            product_elements = soup.select('.prd, ._-f-k0, .product, .core')
            
            for element in product_elements[:max_results]:
                try:
                    product = self._extract_product_info(element)
                    if product:
                        products.append(product)
                except Exception as e:
                    logger.error(f"Error extracting Jumia product: {e}")
                    continue
            
            return products
            
        except Exception as e:
            logger.error(f"Error searching Jumia Egypt: {e}")
            return []
    
    def _extract_product_info(self, element) -> Optional[Product]:
        try:
            # Extract name
            name_elem = element.select_one('.name, .title, ._-fs14, h3, h4')
            if not name_elem:
                return None
            name = name_elem.get_text(strip=True)
            
            # Extract price
            price_elem = element.select_one('.prc, ._-gbg, .price-now, .current-price')
            if not price_elem:
                return None
            price = self.extract_price(price_elem.get_text(strip=True))
            if not price:
                return None
            
            # Extract other details
            image_elem = element.select_one('img')
            image_url = None
            if image_elem:
                image_url = image_elem.get('data-src') or image_elem.get('src')
                if image_url and image_url.startswith('/'):
                    image_url = self.config.base_url + image_url
            
            link_elem = element.find('a')
            product_url = None
            if link_elem:
                product_url = link_elem.get('href')
                if product_url and product_url.startswith('/'):
                    product_url = self.config.base_url + product_url
            
            weight, unit = self.extract_weight(name)
            
            # Check brand from Jumia's brand element
            brand_elem = element.select_one('.brand, ._-ptxxs')
            brand = brand_elem.get_text(strip=True) if brand_elem else None
            
            return Product(
                name=name,
                price=price,
                retailer=self.config.name,
                url=product_url or "",
                image_url=image_url,
                weight=weight,
                weight_unit=unit,
                brand=brand,
                in_stock=True,
                delivery_available=True
            )
            
        except Exception as e:
            logger.error(f"Error extracting Jumia product info: {e}")
            return None