🏗️ Fullstack Architecture Document – Egyptian Price Comparison App

1\. System Overview

The system is a modular, distributed AI-driven web application built with a service-oriented backend and an orchestrated multi-agent scraping layer. A FastAPI backend acts as the orchestration hub for managing requests, coordinating agents, storing memory, and responding to the front end. Each scraping agent operates independently and in parallel, using best-in-class tools like Firecrawl or Puppeteer/Playwright-based open-source crawlers. Shared agent memory is stored in Redis or a similar fast in-memory store. The frontend is built using a lightweight, responsive React-based stack with Arabic/English i18n support.



2\. Component Architecture

🔧 Core Components:

Frontend (React + Tailwind + i18n)



Web UI for user input, search, and results table



Arabic/English toggle



Progressive filters, search bar, and clean layout



API Gateway / Orchestrator (FastAPI)



Receives product search requests



Manages and launches scraping agents



Aggregates results and handles logic for alternatives



AI Scraper Agents (Firecrawl / Playwright)



Each agent handles one retailer



Headless scraping or API fetch (prefers API, falls back to DOM-based scraping)



Fully parallelized with failure/retry logic



Shared Memory Layer (Redis)



Temporary storage for agent outputs



Tracks request ID → product queries → intermediate results



Enables deduplication, sync, and fallback logic



Data Normalization Engine



Compares item sizes, brands, packaging variations



Standardizes weights, prices per 100g, etc.



Suggests nearest alternatives



Admin Panel (Future)



Manages supported retailers, scraping logic, blacklist/whitelist rules



Manually maps outlier product formats



3\. Technology Stack Justification

Layer	Tool/Stack	Justification

Frontend	React + Tailwind CSS	Modern, mobile-first, Arabic RTL support, rapid iteration

Backend API	FastAPI	High-performance async Python API for orchestrating agents and scraping

Scraping	Firecrawl / Playwright	Best-in-class for real-time, headless, stealth scraping and fallback control

AI Agents	Python Async Workers	Enables spawning and managing isolated crawlers per retailer in parallel

Memory	Redis	Fast, reliable, shared memory store with pub/sub and TTL handling

Hosting	Render / Railway / Docker	Scalable, easy-to-deploy for MVP, with future migration options

Database	PostgreSQL (optional)	If product history or usage analytics needed; optional at MVP phase

Language	Arabic \& English (i18n)	Required for local market accessibility and dual-language UX



4\. Deployment Architecture (Logical Flow)

plaintext

Copy

Edit

\[ User Browser (React Web App) ]

&nbsp;         ↓

\[ FastAPI Gateway / Orchestrator ]

&nbsp;         ↓

&nbsp;┌────────┬────────┬────────┐

&nbsp;│ Agent1 │ Agent2 │ AgentN │  ← Scraper agents run in parallel

&nbsp;└────────┴────────┴────────┘

&nbsp;         ↓

&nbsp;  \[ Shared Memory Layer (Redis) ]

&nbsp;         ↓

\[ Normalizer Engine → Final Response ]

&nbsp;         ↓

\[ Browser renders comparison UI ]

