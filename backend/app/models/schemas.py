from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any
from enum import Enum
from datetime import datetime
import re

class Language(str, Enum):
    ARABIC = "ar"
    ENGLISH = "en"

class Currency(str, Enum):
    EGP = "EGP"

class RetailerStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    ERROR = "error"

class WeightUnit(str, Enum):
    GRAM = "g"
    KILOGRAM = "kg"
    LITER = "l"
    MILLILITER = "ml"
    PIECE = "pc"
    PACK = "pack"

class Product(BaseModel):
    name: str = Field(..., description="Product name in original language")
    name_ar: Optional[str] = Field(None, description="Product name in Arabic")
    name_en: Optional[str] = Field(None, description="Product name in English")
    price: float = Field(..., gt=0, description="Product price in EGP")
    currency: Currency = Field(default=Currency.EGP)
    retailer: str = Field(..., description="Retailer name")
    retailer_logo: Optional[str] = Field(None, description="Retailer logo URL")
    url: str = Field(..., description="Product URL at retailer")
    image_url: Optional[str] = Field(None, description="Product image URL")
    
    # Product specifications
    weight: Optional[float] = Field(None, description="Product weight/volume")
    weight_unit: Optional[WeightUnit] = Field(None, description="Weight unit")
    brand: Optional[str] = Field(None, description="Product brand")
    category: Optional[str] = Field(None, description="Product category")
    
    # Normalized pricing
    price_per_unit: Optional[float] = Field(None, description="Price per standard unit (per 100g/ml)")
    price_per_kg: Optional[float] = Field(None, description="Price per kilogram")
    
    # Availability
    in_stock: bool = Field(default=True, description="Product availability")
    delivery_available: bool = Field(default=True, description="Delivery availability")
    pickup_available: bool = Field(default=False, description="Pickup availability")
    
    # Metadata
    scraped_at: datetime = Field(default_factory=datetime.now)
    confidence_score: float = Field(default=1.0, ge=0, le=1, description="Matching confidence")
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class SearchRequest(BaseModel):
    query: str = Field(..., min_length=2, max_length=200, description="Product search query")
    language: Language = Field(default=Language.ARABIC, description="Preferred language")
    max_results: int = Field(default=50, ge=1, le=100, description="Maximum results to return")
    include_alternatives: bool = Field(default=True, description="Include similar products")
    min_price: Optional[float] = Field(None, ge=0, description="Minimum price filter")
    max_price: Optional[float] = Field(None, ge=0, description="Maximum price filter")
    preferred_retailers: Optional[List[str]] = Field(None, description="Preferred retailers")
    
    @validator('query')
    def validate_query(cls, v):
        # Remove excessive whitespace and special characters
        v = re.sub(r'\s+', ' ', v.strip())
        if len(v) < 2:
            raise ValueError('Query must be at least 2 characters long')
        return v

class SearchResponse(BaseModel):
    request_id: str = Field(..., description="Unique request identifier")
    query: str = Field(..., description="Original search query")
    products: List[Product] = Field(..., description="Found products")
    total_results: int = Field(..., description="Total number of results")
    search_time_ms: int = Field(..., description="Search time in milliseconds")
    retailers_searched: List[str] = Field(..., description="List of retailers searched")
    alternatives_included: bool = Field(default=False, description="Whether alternatives are included")
    error_retailers: List[str] = Field(default_factory=list, description="Retailers that failed")
    
class RetailerConfig(BaseModel):
    name: str = Field(..., description="Retailer name")
    name_ar: str = Field(..., description="Retailer name in Arabic")
    base_url: str = Field(..., description="Retailer base URL")
    search_url: str = Field(..., description="Search endpoint URL pattern")
    logo_url: Optional[str] = Field(None, description="Retailer logo URL")
    status: RetailerStatus = Field(default=RetailerStatus.ACTIVE)
    priority: int = Field(default=1, ge=1, le=10, description="Search priority (1=highest)")
    timeout_seconds: int = Field(default=10, ge=1, le=30)
    max_retries: int = Field(default=2, ge=0, le=5)
    requires_proxy: bool = Field(default=False)
    scraping_method: str = Field(default="firecrawl", description="firecrawl, playwright, or selenium")
    
class ScrapingResult(BaseModel):
    retailer: str
    products: List[Product]
    success: bool
    error_message: Optional[str] = None
    response_time_ms: int
    products_found: int