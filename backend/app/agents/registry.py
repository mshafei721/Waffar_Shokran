from typing import List, Dict
import redis.asyncio as redis
from loguru import logger

from .base_agent import AbstractScrapingAgent
from ..models.schemas import RetailerConfig, RetailerStatus

# Import retailer agents
from .carrefour_agent import CarrefourAgent
from .spinneys_agent import SpinneysAgent
from .metro_agent import MetroAgent
from .kazyon_agent import KazyonAgent
from .freshmart_agent import FreshMartAgent
from .gourmet_agent import GourmetAgent
from .alkhairy_agent import AlKhairyAgent
from .otlob_agent import OtlobAgent
from .elmenus_agent import ElMenusAgent
from .jumia_agent import JumiaAgent

# Egyptian retailer configurations
EGYPTIAN_RETAILERS = [
    RetailerConfig(
        name="Carrefour Egypt",
        name_ar="كارفور مصر",
        base_url="https://www.carrefouregypt.com",
        search_url="https://www.carrefouregypt.com/search?q={query}",
        logo_url="https://www.carrefouregypt.com/logo.png",
        priority=1,
        timeout_seconds=15,
        max_retries=3,
        scraping_method="firecrawl"
    ),
    RetailerConfig(
        name="Spinneys Egypt",
        name_ar="سبينيز مصر",
        base_url="https://spinneys-egypt.com",
        search_url="https://spinneys-egypt.com/search?q={query}",
        logo_url="https://spinneys-egypt.com/logo.png",
        priority=2,
        timeout_seconds=12,
        max_retries=2,
        scraping_method="firecrawl"
    ),
    RetailerConfig(
        name="Metro Egypt",
        name_ar="مترو مصر",
        base_url="https://www.metro-markets.com.eg",
        search_url="https://www.metro-markets.com.eg/search?term={query}",
        priority=3,
        timeout_seconds=10,
        scraping_method="playwright"
    ),
    RetailerConfig(
        name="Kazyon",
        name_ar="كازيون",
        base_url="https://kazyon.com",
        search_url="https://kazyon.com/search?q={query}",
        priority=4,
        timeout_seconds=10,
        scraping_method="firecrawl"
    ),
    RetailerConfig(
        name="FreshMart",
        name_ar="فريش مارت",
        base_url="https://freshmart.com.eg",
        search_url="https://freshmart.com.eg/search?query={query}",
        priority=5,
        timeout_seconds=8,
        scraping_method="playwright"
    ),
    RetailerConfig(
        name="Gourmet Egypt",
        name_ar="جورميه مصر",
        base_url="https://gourmet-egypt.com",
        search_url="https://gourmet-egypt.com/search/{query}",
        priority=6,
        timeout_seconds=8,
        scraping_method="firecrawl"
    ),
    RetailerConfig(
        name="Al Khairy",
        name_ar="الخيري",
        base_url="https://alkhairy.com",
        search_url="https://alkhairy.com/products/search?q={query}",
        priority=7,
        timeout_seconds=8,
        scraping_method="playwright"
    ),
    RetailerConfig(
        name="Otlob Market",
        name_ar="اطلب ماركت",
        base_url="https://otlob.com/market",
        search_url="https://otlob.com/market/search?q={query}",
        priority=8,
        timeout_seconds=6,
        scraping_method="selenium"
    ),
    RetailerConfig(
        name="ElMenus Market",
        name_ar="الميونيز ماركت",
        base_url="https://elmenus.com/market",
        search_url="https://elmenus.com/market/search?query={query}",
        priority=9,
        timeout_seconds=6,
        scraping_method="selenium"
    ),
    RetailerConfig(
        name="Jumia Egypt",
        name_ar="جوميا مصر",
        base_url="https://www.jumia.com.eg",
        search_url="https://www.jumia.com.eg/catalog/?q={query}",
        priority=10,
        timeout_seconds=10,
        scraping_method="firecrawl"
    )
]

# Agent class mapping
AGENT_CLASSES = {
    "Carrefour Egypt": CarrefourAgent,
    "Spinneys Egypt": SpinneysAgent,
    "Metro Egypt": MetroAgent,
    "Kazyon": KazyonAgent,
    "FreshMart": FreshMartAgent,
    "Gourmet Egypt": GourmetAgent,
    "Al Khairy": AlKhairyAgent,
    "Otlob Market": OtlobAgent,
    "ElMenus Market": ElMenusAgent,
    "Jumia Egypt": JumiaAgent
}

async def get_active_agents(redis_client: redis.Redis) -> List[AbstractScrapingAgent]:
    """
    Get all active scraping agents for Egyptian retailers
    """
    active_agents = []
    
    for config in EGYPTIAN_RETAILERS:
        if config.status == RetailerStatus.ACTIVE:
            try:
                # Get agent class
                agent_class = AGENT_CLASSES.get(config.name)
                if not agent_class:
                    logger.warning(f"No agent class found for {config.name}")
                    continue
                
                # Create agent instance
                agent = agent_class(config, redis_client)
                active_agents.append(agent)
                
            except Exception as e:
                logger.error(f"Failed to create agent for {config.name}: {e}")
                continue
    
    logger.info(f"Loaded {len(active_agents)} active agents")
    return active_agents

def get_available_retailers() -> List[Dict]:
    """Get list of all available retailers"""
    return [
        {
            "name": config.name,
            "name_ar": config.name_ar,
            "status": config.status.value,
            "priority": config.priority,
            "base_url": config.base_url
        }
        for config in EGYPTIAN_RETAILERS
    ]

def get_retailer_config(retailer_name: str) -> RetailerConfig:
    """Get configuration for a specific retailer"""
    for config in EGYPTIAN_RETAILERS:
        if config.name == retailer_name:
            return config
    raise ValueError(f"Retailer {retailer_name} not found")

async def health_check_agents(redis_client: redis.Redis) -> Dict[str, bool]:
    """
    Check health status of all agents
    """
    agents = await get_active_agents(redis_client)
    health_status = {}
    
    for agent in agents:
        try:
            is_healthy = await agent.test_connection()
            health_status[agent.config.name] = is_healthy
        except Exception as e:
            logger.error(f"Health check failed for {agent.config.name}: {e}")
            health_status[agent.config.name] = False
    
    return health_status