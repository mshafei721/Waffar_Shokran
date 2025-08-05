# 🛠️ Implementation Plan – Egyptian Price Comparison App (MVP)

## ✅ MVP Scope

| Feature                           | Included? | Notes                                                                 |
|----------------------------------|-----------|-----------------------------------------------------------------------|
| Product search bar (manual input)| ✅        | Must support English/Arabic                                          |
| Multi-agent scraper framework    | ✅        | Firecrawl API or Playwright fallback                                 |
| Shared memory (Redis)            | ✅        | Coordination between agents and orchestrator                         |
| Result table + alternative suggestions | ✅ | Weight/size logic must normalize items                               |
| Arabic/English switch UI         | ✅        | RTL support required                                                  |
| 10 hardcoded Egyptian retailers  | ✅        | Can be scripted or manually sourced initially                        |
| Simple admin interface (optional)| ❌        | Deferred to post-MVP                                                  |
| Geolocation matching             | ❌        | Tagged as roadmap (post-MVP)                                          |

---

## 🗂️ Implementation Phases

### 🧱 Phase 0: Environment & Tooling Setup

| Deliverable                     | Owner     | Dependencies            |
|--------------------------------|-----------|--------------------------|
| Initialize Git + CI/CD repo    | Dev       | GitHub / Railway / Render |
| Setup Python project + FastAPI | Dev       | `uvicorn`, `fastapi`     |
| Configure Redis locally        | Dev       | Docker or Railway        |
| Create shared `.env` structure | Dev       | Agent config keys        |
| Define folder scaffolding      | Architect | Based on architecture doc|

---

### ⚙️ Phase 1: Core Backend Architecture

| Deliverable                           | Owner   | Dependencies       |
|--------------------------------------|---------|--------------------|
| Orchestrator API – `/search` endpoint| Dev     | FastAPI, Redis     |
| Request validation / parsing layer   | Dev     | Pydantic schemas   |
| Redis memory broker integration      | Dev     | Redis              |
| Parallel agent spawner service       | Dev     | `asyncio`, Firecrawl fallback setup |

---

### 🔍 Phase 2: Scraper Agent System

| Deliverable                          | Owner  | Dependencies            |
|-------------------------------------|--------|--------------------------|
| Build agent base class (abstract)   | Dev    | Agent lifecycle manager |
| 10 retailer scrapers                | Dev    | Static list or config   |
| Logging + retry mechanism           | Dev    | Firecrawl/Playwright    |
| Normalize price/weight result model | Architect | Shared schemas         |
| Unit tests for scraper logic        | QA     | Mocks / Fixtures        |

---

### 🎨 Phase 3: Frontend (React + Tailwind)

| Deliverable                                | Owner  | Dependencies     |
|-------------------------------------------|--------|------------------|
| Basic search page layout                   | UX     | PRD + Architecture|
| Arabic RTL layout + i18n hook              | UX     | React-i18next    |
| Search input + result table                | UX     | API integration  |
| Loading, error, and fallback states        | UX     | Redis + API calls|
| Basic theming + mobile layout              | UX     | Tailwind CSS     |

---

### 🔄 Phase 4: Result Normalization & Integration

| Deliverable                            | Owner    | Dependencies   |
|---------------------------------------|----------|----------------|
| Normalizer module (brand/size logic)  | Architect| Agent memory   |
| Agent-to-normalizer bridge             | Dev      | Redis key sync |
| UI formatter for “cheapest + alt” rows| UX       | Normalized data|

---

### 🚀 Phase 5: QA + Polish + Soft Launch

| Deliverable                         | Owner | Dependencies |
|------------------------------------|-------|--------------|
| Agent health monitoring            | QA    | Redis keys   |
| Rate limiting and timeouts         | Dev   | Orchestrator |
| Arabic/English toggle final test   | UX    | i18n config  |
| MVP deployment                     | Dev   | Railway/Docker|

---

## ⚠️ Risks & Constraints

- **Retailer site changes**: Need fallback detection and manual override
- **Scraping limits**: Anti-bot systems may block agents (rotate IPs, stealth mode)
- **Weight/Size ambiguity**: Requires heuristics for unit standardization
- **Arabic RTL bugs**: Must be tested on multiple devices