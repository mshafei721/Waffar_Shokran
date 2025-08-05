# وفر شكراً - Waffar Shokran 🇪🇬

**Egyptian Price Comparison Platform - أفضل موقع لمقارنة الأسعار في مصر**

A modern, AI-powered price comparison web application that helps Egyptian consumers find the cheapest prices for grocery and household items across 10+ local online retailers with sub-3 second response times.

[![Arabic RTL Support](https://img.shields.io/badge/Arabic-RTL%20Support-green)](https://github.com/your-repo/waffar-shokran)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104.1-blue)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18.2.0-blue)](https://reactjs.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

## 🌟 Features

### 🏪 Multi-Retailer Support
- **10+ Egyptian Retailers**: Carrefour, Spinneys, Metro, Kazyon, FreshMart, Gourmet, Al Khairy, Otlob, ElMenus, Jumia
- **Real-time Scraping**: Parallel agent system for concurrent data extraction
- **Smart Fallbacks**: Firecrawl primary with Playwright/Selenium backup

### ⚡ Performance Optimized
- **Sub-3 Second Response**: Engineered for Egyptian network conditions
- **Parallel Processing**: Multi-agent architecture with Redis coordination
- **Mobile-First**: Optimized for Egyptian mobile users and slower connections

### 🌍 Localization Excellence
- **Bilingual Interface**: Arabic RTL and English support
- **Cultural Adaptation**: Egyptian Arabic, proper number formatting, local timezone
- **Smart Translation**: Context-aware Arabic-English product matching

### 💰 Smart Price Comparison
- **Weight Normalization**: Fair comparisons across different package sizes
- **Alternative Suggestions**: Similar products when exact matches aren't found
- **Price per Unit**: Standardized pricing for accurate comparisons
- **Cheapest Highlighting**: Clear visual indication of best deals

### 🛡️ Reliability & Security
- **Anti-Bot Protection**: Stealth scraping with IP rotation
- **Circuit Breakers**: Graceful handling of retailer failures
- **Data Privacy**: No user data storage, ephemeral searches only
- **Error Recovery**: Comprehensive retry logic and fallback mechanisms

## 🏗️ Architecture

### System Overview
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Client  │    │  FastAPI Server │    │ Redis Coordinator│
│  Arabic/English │◄──►│   Orchestrator  │◄──►│  Shared Memory  │
│   Mobile-First  │    │      API        │    │   Agent Sync    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                    ┌───────────┴───────────┐
                    │                       │
            ┌───────▼────────┐    ┌────────▼────────┐
            │ Scraping Agent │    │ Scraping Agent  │
            │   Carrefour    │    │    Spinneys     │
            └────────────────┘    └─────────────────┘
                    │                       │
            ┌───────▼────────┐    ┌────────▼────────┐
            │ Scraping Agent │    │     ...8 more   │
            │     Metro      │    │     agents      │
            └────────────────┘    └─────────────────┘
```

### Tech Stack
- **Backend**: FastAPI, Python 3.11, Redis, Firecrawl/Playwright
- **Frontend**: React 18, Vite, Tailwind CSS, React i18next
- **Scraping**: Multi-agent system with parallel execution
- **Deployment**: Docker, Nginx, production-ready configuration
- **Monitoring**: Health checks, logging, performance metrics

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Firecrawl API key (optional, has fallbacks)

### Development Setup

1. **Clone the repository**
```bash
git clone https://github.com/your-username/waffar-shokran.git
cd waffar-shokran
```

2. **Configure environment**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Start development environment**
```bash
docker-compose up --build
```

4. **Access the application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

### Production Deployment

1. **Build production images**
```bash
chmod +x scripts/build.sh
./scripts/build.sh v1.0.0 production
```

2. **Deploy to production**
```bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh deploy v1.0.0 production
```

## 📁 Project Structure

```
waffar-shokran/
├── 📁 backend/                 # FastAPI backend
│   ├── 📁 app/
│   │   ├── 📁 agents/          # Retailer scraping agents
│   │   ├── 📁 models/          # Pydantic data models
│   │   ├── 📁 services/        # Business logic
│   │   ├── 📁 utils/           # Helper functions
│   │   └── 📄 main.py          # FastAPI app
│   ├── 📄 Dockerfile           # Backend container
│   └── 📄 requirements.txt     # Python dependencies
├── 📁 frontend/                # React frontend
│   ├── 📁 src/
│   │   ├── 📁 components/      # React components
│   │   ├── 📁 hooks/           # Custom hooks
│   │   ├── 📁 services/        # API client
│   │   ├── 📁 i18n/            # Localization
│   │   └── 📄 App.jsx          # Main component
│   ├── 📄 Dockerfile           # Frontend container
│   └── 📄 package.json         # Node dependencies
├── 📁 scripts/                 # Deployment scripts
│   ├── 📄 build.sh             # Build automation
│   └── 📄 deploy.sh            # Deployment automation
├── 📄 docker-compose.yml       # Development environment
├── 📄 docker-compose.prod.yml  # Production environment
└── 📄 README.md                # This file
```

## 🛍️ Supported Retailers

| Retailer | Arabic Name | Status | Scraping Method |
|----------|-------------|--------|-----------------|
| Carrefour Egypt | كارفور مصر | ✅ | Firecrawl |
| Spinneys Egypt | سبينيز مصر | ✅ | Firecrawl |
| Metro Egypt | مترو مصر | ✅ | Playwright |
| Kazyon | كازيون | ✅ | Firecrawl |
| FreshMart | فريش مارت | ✅ | Playwright |
| Gourmet Egypt | جورميه مصر | ✅ | Firecrawl |
| Al Khairy | الخيري | ✅ | Playwright |
| Otlob Market | اطلب ماركت | ✅ | Selenium |
| ElMenus Market | الميونيز ماركت | ✅ | Selenium |
| Jumia Egypt | جوميا مصر | ✅ | Firecrawl |

## 🔧 Configuration

### Environment Variables

Key configuration options in `.env`:

```bash
# API Configuration
FIRECRAWL_API_KEY=your_api_key_here
REDIS_URL=redis://localhost:6379

# Performance Tuning
SEARCH_TIMEOUT=30
MAX_CONCURRENT_SCRAPERS=10
DEFAULT_MAX_RESULTS=50

# Localization
DEFAULT_CURRENCY=EGP
DEFAULT_LANGUAGE=ar
CAIRO_TIMEZONE=Africa/Cairo

# Frontend
VITE_API_URL=http://localhost:8000
VITE_DEFAULT_LANGUAGE=ar
```

### Scraping Configuration

Each retailer agent can be configured individually:

```python
# In backend/app/agents/registry.py
RetailerConfig(
    name="Carrefour Egypt",
    priority=1,
    timeout_seconds=15,
    max_retries=3,
    scraping_method="firecrawl"
)
```

## 🧪 Testing

### Backend Tests
```bash
cd backend
pytest tests/ -v
```

### Frontend Tests
```bash
cd frontend
npm test
```

### Integration Tests
```bash
docker-compose -f docker-compose.test.yml up --build
```

## 📊 Performance Metrics

### Target Performance
- **Response Time**: < 3 seconds (80% of requests)
- **Concurrent Queries**: 100+ simultaneous searches
- **Scraping Accuracy**: 90%+ compared to manual verification
- **Uptime**: 99.9% availability

### Monitoring

Health check endpoints:
- Backend: `GET /health`
- Frontend: `GET /health`
- Redis: Built-in health checks

## 🌐 Localization

### Arabic Support
- **RTL Layout**: Proper right-to-left text direction
- **Arabic Fonts**: Noto Sans Arabic with fallbacks
- **Number Formatting**: Arabic-Indic numerals support
- **Cultural Adaptation**: Egyptian Arabic terminology

### Bilingual Features
- **Dynamic Language Toggle**: Instant switching
- **Smart Fallbacks**: English when Arabic unavailable
- **Search Intelligence**: Bilingual product matching
- **Currency Display**: EGP formatting in both languages

## 🚢 Deployment Options

### Cloud Platforms
- **Railway**: One-click deployment with `railway.json`
- **Render**: Auto-deployment with `render.yaml`
- **Docker**: Any Docker-compatible platform
- **VPS**: Traditional server deployment

### Production Checklist
- [ ] Set environment variables
- [ ] Configure SSL certificates
- [ ] Set up monitoring
- [ ] Configure backup strategy
- [ ] Test health checks
- [ ] Verify performance metrics

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Egyptian developers and retailers who inspired this project
- The open-source community for amazing tools and libraries
- Firecrawl team for reliable scraping infrastructure
- React and FastAPI communities for excellent documentation

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/your-username/waffar-shokran/issues)
- **Email**: support@waffarshokran.com
- **Documentation**: [Wiki](https://github.com/your-username/waffar-shokran/wiki)

---

<div align="center">

**Made with ❤️ in Egypt 🇪🇬**

*Helping Egyptian families save money, one search at a time*

[🌐 Website](https://waffarshokran.com) • [📱 Demo](https://demo.waffarshokran.com) • [📚 Docs](https://docs.waffarshokran.com)

</div>