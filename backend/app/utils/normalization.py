import re
from typing import Optional, Tuple, Dict, Any
from loguru import logger

from ..models.schemas import Product, WeightUnit

class ProductNormalizer:
    """
    Normalizes product data for fair price comparisons
    Handles weight conversions, brand mapping, and price standardization
    """
    
    def __init__(self):
        self.brand_aliases = self._load_brand_aliases()
        self.category_keywords = self._load_category_keywords()
        
    def _load_brand_aliases(self) -> Dict[str, str]:
        """Load brand name aliases for normalization"""
        return {
            # Common Egyptian brand variations
            'العامة': 'General Egyptian Company',
            'الاهلى': 'Al Ahly',
            'العائلة': 'Al Ayla',
            'فريش': 'Fresh',
            'جهينة': 'Juhayna',
            'الوادى': 'Al Wadi',
            'المراعى': 'Almarai',
            'نستله': 'Nestle',
            'كرافت': 'Kraft',
            'يونيليفر': 'Unilever',
            'سيدى سالم': 'Sidi Salem',
            'كيللو': 'Kello',
            'العلالى': 'Al Alali',
            # Add more as needed
        }
    
    def _load_category_keywords(self) -> Dict[str, list]:
        """Load category classification keywords"""
        return {
            'dairy': ['لبن', 'جبن', 'زبد', 'كريمة', 'milk', 'cheese', 'butter', 'cream'],
            'meat': ['لحمة', 'فراخ', 'سمك', 'meat', 'chicken', 'fish', 'beef'],
            'vegetables': ['خضار', 'طماطم', 'بصل', 'جزر', 'vegetables', 'tomato', 'onion', 'carrot'],
            'fruits': ['فاكهة', 'تفاح', 'موز', 'برتقال', 'fruits', 'apple', 'banana', 'orange'],
            'grains': ['أرز', 'عيش', 'مكرونة', 'rice', 'bread', 'pasta'],
            'beverages': ['مشروبات', 'عصير', 'مياه', 'شاى', 'drinks', 'juice', 'water', 'tea'],
            'cleaning': ['منظفات', 'صابون', 'شامبو', 'cleaning', 'soap', 'shampoo'],
            'personal_care': ['عناية شخصية', 'معجون أسنان', 'كريم', 'personal care', 'toothpaste', 'cream']
        }
    
    async def normalize_product(self, product: Product, original_query: str) -> Product:
        """
        Normalize a product for standardized comparison
        """
        try:
            # Normalize brand
            normalized_brand = self._normalize_brand(product.brand)
            
            # Extract and normalize weight
            weight, unit = self._extract_weight_from_name(product.name)
            if not weight and product.weight:
                weight = product.weight
                unit = product.weight_unit.value if product.weight_unit else None
            
            # Calculate price per unit
            price_per_unit, price_per_kg = self._calculate_price_per_unit(
                product.price, weight, unit
            )
            
            # Classify category
            category = self._classify_category(product.name, product.brand)
            
            # Calculate confidence score
            confidence = self._calculate_confidence_score(product, original_query)
            
            # Create normalized product
            normalized_product = Product(
                name=product.name,
                name_ar=self._extract_arabic_name(product.name),
                name_en=self._extract_english_name(product.name),
                price=product.price,
                currency=product.currency,
                retailer=product.retailer,
                retailer_logo=product.retailer_logo,
                url=product.url,
                image_url=product.image_url,
                weight=weight,
                weight_unit=WeightUnit(unit) if unit and unit in [u.value for u in WeightUnit] else product.weight_unit,
                brand=normalized_brand,
                category=category,
                price_per_unit=price_per_unit,
                price_per_kg=price_per_kg,
                in_stock=product.in_stock,
                delivery_available=product.delivery_available,
                pickup_available=product.pickup_available,
                scraped_at=product.scraped_at,
                confidence_score=confidence
            )
            
            return normalized_product
            
        except Exception as e:
            logger.warning(f"Normalization failed for product {product.name}: {e}")
            return product  # Return original if normalization fails
    
    def _normalize_brand(self, brand: Optional[str]) -> Optional[str]:
        """Normalize brand names using aliases"""
        if not brand:
            return None
            
        brand_clean = brand.strip()
        
        # Check for direct alias match
        for alias, canonical in self.brand_aliases.items():
            if alias.lower() in brand_clean.lower():
                return canonical
        
        return brand_clean.title()  # Title case for consistency
    
    def _extract_weight_from_name(self, name: str) -> Tuple[Optional[float], Optional[str]]:
        """Extract weight and unit from product name"""
        patterns = [
            # Arabic patterns
            r'(\d+(?:\.\d+)?)\s*كيلو',
            r'(\d+(?:\.\d+)?)\s*كجم',
            r'(\d+(?:\.\d+)?)\s*جم',
            r'(\d+(?:\.\d+)?)\s*جرام',
            r'(\d+(?:\.\d+)?)\s*لتر',
            r'(\d+(?:\.\d+)?)\s*مل',
            r'(\d+)\s*قطعة',
            r'(\d+)\s*حبة',
            # English patterns
            r'(\d+(?:\.\d+)?)\s*kg',
            r'(\d+(?:\.\d+)?)\s*g\b',
            r'(\d+(?:\.\d+)?)\s*gram',
            r'(\d+(?:\.\d+)?)\s*l\b',
            r'(\d+(?:\.\d+)?)\s*liter',
            r'(\d+(?:\.\d+)?)\s*ml',
            r'(\d+)\s*pc',
            r'(\d+)\s*piece',
            # Combined patterns
            r'(\d+(?:\.\d+)?)\s*(kg|g|l|ml|pc|كيلو|جم|لتر|مل|قطعة|حبة)'
        ]
        
        unit_mapping = {
            'كيلو': 'kg', 'كجم': 'kg', 'kg': 'kg',
            'جم': 'g', 'جرام': 'g', 'g': 'g', 'gram': 'g',
            'لتر': 'l', 'l': 'l', 'liter': 'l',
            'مل': 'ml', 'ml': 'ml',
            'قطعة': 'pc', 'حبة': 'pc', 'pc': 'pc', 'piece': 'pc'
        }
        
        for pattern in patterns:
            match = re.search(pattern, name, re.IGNORECASE)
            if match:
                try:
                    weight = float(match.group(1))
                    unit = match.group(2) if len(match.groups()) > 1 else None
                    
                    if unit:
                        normalized_unit = unit_mapping.get(unit.lower(), unit.lower())
                        return weight, normalized_unit
                    
                    # Try to infer unit from context
                    if weight >= 500:  # Likely grams
                        return weight, 'g'
                    elif weight >= 1:  # Likely kg
                        return weight, 'kg'
                        
                except ValueError:
                    continue
        
        return None, None
    
    def _calculate_price_per_unit(self, price: float, weight: Optional[float], unit: Optional[str]) -> Tuple[Optional[float], Optional[float]]:
        """Calculate price per standard unit (100g/ml) and per kg"""
        if not price or not weight or not unit:
            return None, None
        
        try:
            # Convert to grams/ml for standardization
            weight_in_base_unit = weight
            
            if unit == 'kg':
                weight_in_base_unit = weight * 1000  # kg to g
            elif unit == 'l':
                weight_in_base_unit = weight * 1000  # l to ml
            elif unit in ['g', 'ml']:
                weight_in_base_unit = weight
            elif unit == 'pc':
                # For pieces, assume average weight (this is approximate)
                return None, None
            
            # Price per 100g/ml
            price_per_unit = (price / weight_in_base_unit) * 100 if weight_in_base_unit > 0 else None
            
            # Price per kg (for weight-based items)
            price_per_kg = None
            if unit in ['kg', 'g']:
                price_per_kg = (price / weight_in_base_unit) * 1000 if weight_in_base_unit > 0 else None
            
            return price_per_unit, price_per_kg
            
        except (ValueError, ZeroDivisionError):
            return None, None
    
    def _classify_category(self, name: str, brand: Optional[str]) -> Optional[str]:
        """Classify product into category based on keywords"""
        text_to_check = f"{name} {brand or ''}".lower()
        
        for category, keywords in self.category_keywords.items():
            for keyword in keywords:
                if keyword.lower() in text_to_check:
                    return category
        
        return None
    
    def _calculate_confidence_score(self, product: Product, query: str) -> float:
        """Calculate confidence score for product matching"""
        score = 0.0
        query_lower = query.lower()
        name_lower = product.name.lower()
        
        # Exact query match in name
        if query_lower in name_lower:
            score += 0.4
        
        # Word-level matching
        query_words = set(query_lower.split())
        name_words = set(name_lower.split())
        common_words = query_words & name_words
        if query_words:
            word_match_ratio = len(common_words) / len(query_words)
            score += word_match_ratio * 0.3
        
        # Brand matching
        if product.brand and query_lower in product.brand.lower():
            score += 0.2
        
        # Data completeness bonus
        if product.weight and product.weight_unit:
            score += 0.05
        if product.image_url:
            score += 0.03
        if product.brand:
            score += 0.02
        
        return min(score, 1.0)  # Cap at 1.0
    
    def _extract_arabic_name(self, name: str) -> Optional[str]:
        """Extract Arabic portion of name"""
        # Check if name contains Arabic characters
        arabic_pattern = r'[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]+'
        arabic_matches = re.findall(arabic_pattern, name)
        
        if arabic_matches:
            return ' '.join(arabic_matches).strip()
        
        return None
    
    def _extract_english_name(self, name: str) -> Optional[str]:
        """Extract English portion of name"""
        # Remove Arabic characters and get remaining text
        arabic_pattern = r'[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]+'
        english_text = re.sub(arabic_pattern, ' ', name)
        english_text = ' '.join(english_text.split())  # Clean whitespace
        
        if english_text and len(english_text) > 2:
            return english_text.strip()
        
        return None