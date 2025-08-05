# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.
o^O
## Project Overview

This is an AI-powered Egyptian price comparison web application that helps consumers find the cheapest prices for grocery and household items across local online retailers. The system uses a multi-agent architecture with parallel scraping agents, shared memory coordination, and Arabic/English language support.

## Architecture Overview

The system follows a service-oriented architecture with these key components:

### Backend (FastAPI)
- **Orchestrator API**: Central hub that receives search requests and coordinates scraping agents
- **Agent Manager**: Spawns and manages parallel scraping agents for different retailers
- **Shared Memory Layer**: Redis-based coordination between agents and results aggregation
- **Data Normalization Engine**: Standardizes weights, prices, and suggests alternatives

### Frontend (React + Tailwind)
- **Mobile-first responsive design** with Arabic RTL support
- **Bilingual UI** with Arabic/English toggle using i18n
- **Real-time results table** showing price comparisons and retailer links
- **Progressive enhancement** for advanced filtering

### Multi-Agent Scraping System
- **Parallel execution**: Each agent handles one retailer independently
- **Firecrawl primary**: Best-in-class scraping with Playwright/Puppeteer fallback
- **Retry logic**: Built-in failure handling and retry mechanisms
- **Shared memory**: Redis coordination for deduplication and sync

## Development Commands

Since this is a pre-implementation project, these commands will be established during development:

### Backend (Python/FastAPI)
```bash
# Install dependencies
pip install -r requirements.txt

# Run development server
uvicorn main:app --reload

# Run tests
pytest

# Format code
black .
isort .

# Type checking
mypy .
```

### Frontend (React)
```bash
# Install dependencies
npm install

# Development server
npm run dev

# Build production
npm run build

# Run tests
npm test

# Lint
npm run lint
```

### Infrastructure
```bash
# Start Redis locally
docker run -d -p 6379:6379 redis:alpine

# Start full development environment
docker-compose up -d
```

## Key Implementation Requirements

### Performance Requirements
- **Sub-3 second response time** from user input to comparison results
- **Parallel agent execution** for concurrent retailer scraping
- **Redis-based shared memory** for fast inter-agent communication

### Localization Requirements
- **Arabic RTL layout** with proper text direction handling
- **Bilingual content** with fallback from Arabic to English
- **Cultural considerations** for Egyptian market preferences

### Scraping Architecture
- **10 Egyptian retailers** minimum for MVP
- **Anti-bot detection handling** with IP rotation and stealth mode
- **Graceful fallbacks** when exact product matches aren't found
- **Weight/size normalization** for fair price comparisons

### Data Handling
- **No sensitive user data storage** - ephemeral search only
- **Encrypted data transfers** throughout the system
- **Request ID tracking** through Redis for debugging

## Project Structure (Planned)

```
/
├── backend/
│   ├── app/
│   │   ├── agents/          # Scraping agents for each retailer
│   │   ├── models/          # Pydantic schemas and data models
│   │   ├── services/        # Business logic and orchestration
│   │   ├── utils/           # Normalization and helper functions
│   │   └── main.py          # FastAPI application entry point
│   ├── tests/
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── services/        # API client functions
│   │   ├── locales/         # Arabic/English translations
│   │   └── App.jsx
│   └── package.json
├── docker-compose.yml       # Local development environment
└── deployment/              # Production deployment configs
```

## Critical Implementation Notes

### Agent System Design
- Each retailer requires a dedicated agent class inheriting from a base scraper
- Agents must write results to Redis with standardized schemas
- Implement circuit breaker pattern for failing retailers
- Log all scraping attempts for debugging and rate limit compliance

### Normalization Logic
- Product matching should handle size variations (500g vs 0.5kg)
- Brand equivalency mapping for common Egyptian brands
- Price per unit calculations for fair comparisons
- Alternative suggestion engine based on category and attributes

### Arabic Language Support
- Use proper Arabic fonts and typography
- Handle mixed Arabic/English product names correctly
- Right-to-left layout for all UI components
- Number formatting according to Arabic conventions

### Security Considerations
- No user authentication required for MVP
- Rate limiting on search endpoints
- Input sanitization for product search queries
- Secure Redis configuration with appropriate timeouts

## Success Metrics to Track
- Response time under 3 seconds (80% of requests)
- 90% scraping accuracy compared to manual verification
- Support for at least 10 Egyptian retailers
- 30% user retention after 30 days
- System scalability to 100 concurrent queries

## Known Challenges
- **Retailer site changes**: Implement fallback detection and manual overrides
- **Anti-bot measures**: Requires IP rotation and stealth mode capabilities  
- **Arabic text processing**: Complex RTL layout and mixed content handling
- **Price normalization**: Handling inconsistent product descriptions and units

## Future Enhancements (Post-MVP)
- Geolocation-based store matching
- Admin panel for retailer management
- Product history and price trends
- User preferences and saved searches
- Mobile app development
