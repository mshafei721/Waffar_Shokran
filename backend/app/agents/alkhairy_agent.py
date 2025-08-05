from typing import List, Optional
from urllib.parse import quote
import re
from bs4 import BeautifulSoup
import logging

from .base_agent import AbstractScrapingAgent
from ..models.schemas import Product, Language

logger = logging.getLogger(__name__)

class AlKhairyAgent(AbstractScrapingAgent):
    """Scraping agent for Al Khairy - Egyptian grocery chain"""
    
    def get_search_url(self, query: str) -> str:
        encoded_query = quote(query)
        return f"{self.config.base_url}/products/search?q={encoded_query}"
    
    async def search_products(self, query: str, language: Language = Language.ARABIC, max_results: int = 20) -> List[Product]:
        try:
            search_url = self.get_search_url(query)
            logger.info(f"Searching Al Khairy: {search_url}")
            
            html_content = await self.fetch_with_retry(search_url)
            if not html_content:
                return []
            
            soup = BeautifulSoup(html_content, 'html.parser')
            products = []
            
            # Al Khairy product selectors
            product_elements = soup.select('.product-item, .product-card, .grid-item')
            
            for element in product_elements[:max_results]:
                try:
                    product = self._extract_product_info(element)
                    if product:
                        products.append(product)
                except Exception as e:
                    logger.error(f"Error extracting Al Khairy product: {e}")
                    continue
            
            return products
            
        except Exception as e:
            logger.error(f"Error searching Al Khairy: {e}")
            return []
    
    def _extract_product_info(self, element) -> Optional[Product]:
        try:
            # Extract name
            name_elem = element.select_one('.product-name, .title, h3, h4')
            if not name_elem:
                return None
            name = name_elem.get_text(strip=True)
            
            # Extract price
            price_elem = element.select_one('.price, .product-price, .current-price')
            if not price_elem:
                return None
            price = self.extract_price(price_elem.get_text(strip=True))
            if not price:
                return None
            
            # Extract other details
            image_elem = element.select_one('img')
            image_url = None
            if image_elem:
                image_url = image_elem.get('src') or image_elem.get('data-src')
                if image_url and image_url.startswith('/'):
                    image_url = self.config.base_url + image_url
            
            link_elem = element.find('a')
            product_url = None
            if link_elem:
                product_url = link_elem.get('href')
                if product_url and product_url.startswith('/'):
                    product_url = self.config.base_url + product_url
            
            weight, unit = self.extract_weight(name)
            
            return Product(
                name=name,
                price=price,
                retailer=self.config.name,
                url=product_url or "",
                image_url=image_url,
                weight=weight,
                weight_unit=unit,
                in_stock=True
            )
            
        except Exception as e:
            logger.error(f"Error extracting Al Khairy product info: {e}")
            return None