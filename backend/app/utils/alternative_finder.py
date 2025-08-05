from typing import List, Optional, Dict, Set
import re
from loguru import logger
import redis.asyncio as redis

from ..models.schemas import Product, Language

class AlternativeFinder:
    """
    Finds alternative products when exact matches are limited
    Suggests similar size, brand, or category alternatives
    """
    
    def __init__(self):
        self.common_substitutes = self._load_substitutes()
        self.size_variations = self._load_size_variations()
        
    def _load_substitutes(self) -> Dict[str, List[str]]:
        """Load common product substitutes"""
        return {
            # Dairy alternatives
            'لبن': ['حليب', 'milk'],
            'جبنة': ['جبن', 'cheese'],
            'زبدة': ['زبد', 'butter'],
            
            # Meat alternatives
            'فراخ': ['دجاج', 'chicken'],
            'لحمة': ['لحم', 'meat', 'beef'],
            
            # Cleaning products
            'صابون': ['soap', 'منظف'],
            'شامبو': ['shampoo'],
            
            # Beverages
            'عصير': ['juice', 'مشروب'],
            'مياه': ['ماء', 'water'],
            
            # Common brands
            'نستله': ['nestle'],
            'العلالى': ['al alali', 'alalali'],
            'جهينة': ['juhayna'],
        }
    
    def _load_size_variations(self) -> List[Tuple[float, float]]:
        """Load size variation ranges for alternatives"""
        return [
            (0.8, 1.2),   # ±20%
            (0.5, 2.0),   # 50% to double
            (0.25, 4.0),  # Wide range for different pack sizes
        ]
    
    async def find_alternatives(self, original_query: str, existing_products: List[Product], redis_client: redis.Redis) -> List[Product]:
        """
        Find alternative products when search results are limited
        """
        if len(existing_products) >= 10:  # Already have enough results
            return []
        
        logger.info(f"Finding alternatives for query: {original_query}")
        
        alternative_products = []
        
        # Generate alternative search terms
        alternative_queries = self._generate_alternative_queries(original_query)
        
        # Search for alternatives using cached results or similar products
        for alt_query in alternative_queries[:3]:  # Limit to 3 alternative searches
            cached_results = await self._get_cached_alternatives(alt_query, redis_client)
            if cached_results:
                # Filter to avoid duplicates
                filtered_alternatives = self._filter_duplicates(cached_results, existing_products)
                alternative_products.extend(filtered_alternatives[:5])  # Max 5 from each alternative
        
        # Find size variations of existing products
        size_alternatives = self._find_size_alternatives(existing_products)
        alternative_products.extend(size_alternatives)
        
        # Mark alternatives
        for product in alternative_products:
            product.confidence_score *= 0.8  # Reduce confidence for alternatives
            
        logger.info(f"Found {len(alternative_products)} alternative products")
        return alternative_products[:10]  # Limit total alternatives
    
    def _generate_alternative_queries(self, query: str) -> List[str]:
        """Generate alternative search queries"""
        alternatives = []
        query_lower = query.lower().strip()
        
        # Direct substitutes
        for original, substitutes in self.common_substitutes.items():
            if original in query_lower:
                for substitute in substitutes:
                    alt_query = query_lower.replace(original, substitute)
                    alternatives.append(alt_query)
        
        # Generic terms
        if any(word in query_lower for word in ['صغير', 'كبير', 'عادي']):
            # Remove size descriptors
            cleaned_query = re.sub(r'\b(صغير|كبير|عادي|small|large|medium)\b', '', query_lower).strip()
            if cleaned_query:
                alternatives.append(cleaned_query)
        
        # Brand variations
        if 'نستله' in query_lower:
            alternatives.append(query_lower.replace('نستله', 'nestle'))
        if 'nestle' in query_lower:
            alternatives.append(query_lower.replace('nestle', 'نستله'))
        
        # Category-based alternatives
        category_alternatives = self._get_category_alternatives(query_lower)
        alternatives.extend(category_alternatives)
        
        return list(set(alternatives))  # Remove duplicates
    
    def _get_category_alternatives(self, query: str) -> List[str]:
        """Get category-based alternative queries"""
        alternatives = []
        
        # Dairy products
        if any(word in query for word in ['لبن', 'milk', 'جبن', 'cheese']):
            alternatives.extend(['منتجات الألبان', 'dairy products'])
        
        # Cleaning products  
        if any(word in query for word in ['صابون', 'soap', 'منظف', 'cleaner']):
            alternatives.extend(['منظفات', 'cleaning products'])
        
        # Beverages
        if any(word in query for word in ['عصير', 'juice', 'مشروب', 'drink']):
            alternatives.extend(['مشروبات', 'beverages'])
        
        return alternatives
    
    async def _get_cached_alternatives(self, query: str, redis_client: redis.Redis) -> List[Product]:
        """Get alternatives from Redis cache"""
        try:
            # Look for recent searches with similar queries
            keys_pattern = f"search:*:*:product:*"
            keys = await redis_client.keys(keys_pattern)
            
            alternative_products = []
            query_words = set(query.lower().split())
            
            for key in keys[:50]:  # Limit to avoid performance issues
                try:
                    product_data = await redis_client.hgetall(key)
                    if not product_data:
                        continue
                    
                    # Check if product name contains any query words
                    product_name = product_data.get('name', '').lower()
                    product_words = set(product_name.split())
                    
                    # If there's word overlap, consider it an alternative
                    if query_words & product_words:
                        # Reconstruct product (simplified)
                        product = Product(
                            name=product_data.get('name', ''),
                            price=float(product_data.get('price', 0)),
                            retailer=product_data.get('retailer', ''),
                            url=product_data.get('url', ''),
                            brand=product_data.get('brand'),
                            confidence_score=0.6  # Lower confidence for cached alternatives
                        )
                        alternative_products.append(product)
                        
                except (ValueError, KeyError) as e:
                    continue
            
            return alternative_products
            
        except Exception as e:
            logger.warning(f"Failed to get cached alternatives: {e}")
            return []
    
    def _filter_duplicates(self, alternatives: List[Product], existing: List[Product]) -> List[Product]:
        """Filter out products that are too similar to existing ones"""
        filtered = []
        existing_signatures = set()
        
        # Create signatures for existing products
        for product in existing:
            signature = self._create_product_signature(product)
            existing_signatures.add(signature)
        
        # Filter alternatives
        for product in alternatives:
            signature = self._create_product_signature(product)
            if signature not in existing_signatures:
                filtered.append(product)
                existing_signatures.add(signature)  # Avoid duplicates within alternatives
        
        return filtered
    
    def _create_product_signature(self, product: Product) -> str:
        """Create a signature for duplicate detection"""
        name_clean = re.sub(r'\W+', '', product.name.lower())
        price_rounded = round(product.price, 0) if product.price else 0
        brand_clean = re.sub(r'\W+', '', (product.brand or '').lower())
        
        return f"{name_clean}_{brand_clean}_{price_rounded}_{product.retailer}"
    
    def _find_size_alternatives(self, products: List[Product]) -> List[Product]:
        """Find different size variations of existing products"""
        size_alternatives = []
        
        for product in products:
            if not product.weight or not product.weight_unit:
                continue
            
            # Generate alternative sizes
            for ratio_min, ratio_max in self.size_variations:
                for ratio in [ratio_min, ratio_max]:
                    if ratio == 1.0:  # Skip same size
                        continue
                    
                    alt_weight = product.weight * ratio
                    alt_price = product.price * ratio * 0.9  # Slightly better per-unit pricing for larger sizes
                    
                    # Create alternative product
                    alt_product = Product(
                        name=f"{product.name} ({alt_weight}{product.weight_unit.value})",
                        price=alt_price,
                        retailer=product.retailer,
                        url=product.url,
                        brand=product.brand,
                        weight=alt_weight,
                        weight_unit=product.weight_unit,
                        category=product.category,
                        confidence_score=0.5,  # Lower confidence for size alternatives
                        in_stock=product.in_stock
                    )
                    
                    size_alternatives.append(alt_product)
        
        return size_alternatives[:5]  # Limit size alternatives