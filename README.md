# Sentiment-Aware Dynamic Pricing Engine

![Java](https://img.shields.io/badge/Java_17-Spring_Boot_3.2-orange?logo=openjdk&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.11-blue?logo=python&logoColor=white)
![Kafka](https://img.shields.io/badge/Apache_Kafka-Redpanda_Cloud-black?logo=apachekafka&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green?logo=mongodb&logoColor=white)
![Groq](https://img.shields.io/badge/LLM-Groq_llama--3.1--8b-purple?logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PC9zdmc+)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)
![Render](https://img.shields.io/badge/Deployed-Render-46E3B7?logo=render&logoColor=white)
![Vercel](https://img.shields.io/badge/Frontend-Vercel-black?logo=vercel&logoColor=white)

> An event-driven, AI-powered pricing engine that ingests real-world market signals — Reddit discussions, tech news, competitor price changes — and automatically adjusts product prices using an LLM. Fully deployed and running autonomously.

**[→ Live Demo](https://pricing-portfolio.vercel.app)**

---

## What It Does

Every 5 minutes, a Python worker scrapes Reddit communities and tech news sites (TechCrunch, The Verge, Ars Technica) for pricing signals. Posts are filtered for relevance, classified into one of 8 signal types using keyword analysis and sentiment scoring, then published to Kafka. A second Python worker consumes those events, sends each one to Groq's LLM API to compute a calibrated price adjustment, and publishes the decision back to Kafka. A Spring Boot service consumes those decisions, runs them through a 5-layer safety system, and updates prices in MongoDB — with every change written to an immutable audit log.

The portfolio site at the link above shows this happening live. You can also trigger any of the 8 event types yourself and watch the price update in real time through the same pipeline.

---

## Architecture

```
 Real-World Sources               Kafka (Redpanda Cloud)          Spring Boot (Render)
 ──────────────────               ──────────────────────          ────────────────────
 Reddit RSS feeds   ──┐
 Tech news RSS      ──┼──► raw-sentiment-events ──► AI Consumer ──► price-adjustment-events ──► ProductService
 Event Simulator    ──┘    (3 partitions,              (Groq LLM,        (3 partitions,              (5 safety layers)
                            key: productId)             Render)           key: productId)                    │
                                                                                                             ▼
                                                                                                      MongoDB Atlas
                                                                                                  (products + audit log)
                                                                                                             │
                                                                                                             ▼
                                                                                                  Next.js Portfolio (Vercel)
                                                                                                     [live interactive demo]
```

---

## Key Features

**Real-world signal ingestion**
- Polls Reddit subreddits (r/gadgets, r/headphones, r/tech, r/Electronics, r/buildapc) via public RSS — no API key required
- Polls TechCrunch, The Verge, and Ars Technica
- Relevance pre-filter discards posts with no pricing or product signal before they enter Kafka
- TextBlob sentiment + keyword regex classifies posts into 8 event types

**AI-powered pricing decisions**
- Groq API (llama-3.1-8b-instant) evaluates each signal and returns a structured JSON recommendation: `price_multiplier`, `sentiment_score`, `adjustment_reason`, `confidence`
- Pydantic validates every LLM response; malformed outputs are safely skipped
- Ollama (llama3.2:1b) used locally — zero cost, no external API needed

**5-layer safety system** in `ProductService.applyPriceAdjustment()`

| Layer | What it prevents |
|---|---|
| 1. Idempotency check | Duplicate event processing on Kafka redelivery |
| 2. Cooldown (30s) | Price thrashing from burst signals |
| 3. Delta cap (±0.25) | Single extreme LLM output spiking or crashing a price |
| 4. Bounds guard [0.50–2.00] | Price ever leaving a sane range |
| 5. Optimistic locking (@Version, 3× retry) | Concurrent writes corrupting data |

**Full audit trail**
- Every price change appended to `price_audit_log` — insert-only, never modified
- Each record traces back to the original raw signal via `sourceEventId`
- Includes LLM's `adjustmentReason` and `confidence` for full explainability

**Reliable event processing**
- `AckMode.MANUAL` — Kafka offset committed only after DB write + audit log write both succeed
- SIGTERM handler for clean consumer shutdown and partition rebalance
- At-least-once delivery with idempotency for effectively exactly-once semantics

---

## Tech Stack

| Component | Technology | Role |
|---|---|---|
| Core API | Java 17 + Spring Boot 3.2 | REST endpoints, Kafka consumer, pricing safety layers |
| Database | MongoDB Atlas | Products collection + immutable audit log |
| Message Broker | Apache Kafka (Redpanda Cloud) | Durable, ordered, replayable event streaming |
| AI Worker | Python 3.11 + Groq API | LLM sentiment analysis, price recommendation |
| Signal Fetcher | Python 3.11 + feedparser + TextBlob | Real-world Reddit/RSS ingestion and classification |
| Event Simulator | Python 3.11 | Deterministic mock events for local testing |
| Portfolio UI | Next.js 14 + Tailwind CSS + Framer Motion | Live interactive demo, price history charts |
| Local Dev | Docker Compose (8 containers) | Single-command full stack |
| Deployment | Render (3 free web services) | Spring Boot + Python workers |
| Frontend Hosting | Vercel | Next.js portfolio, auto-deploys on push |
| Keep-Alive | UptimeRobot | Prevents Render free-tier sleep |

---

## Kafka Topics

| Topic | Partitions | Producer | Consumer |
|---|---|---|---|
| `raw-sentiment-events` | 3 | Event Simulator + Real-Sentiment Fetcher | AI Sentiment Consumer |
| `price-adjustment-events` | 3 | AI Sentiment Consumer | Product Catalog Service |

Both topics use `productId` as the partition key — all events for a given product land on the same partition, guaranteeing ordered processing per product.

---

## REST API

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/products` | Create a product |
| `GET` | `/api/products` | List all active products |
| `GET` | `/api/products/{id}` | Get product by ID |
| `PUT` | `/api/products/{id}` | Update metadata (not basePrice — immutable) |
| `DELETE` | `/api/products/{id}` | Soft delete → status = DISCONTINUED |
| `GET` | `/api/products/{id}/audit` | Full immutable price change history |
| `POST` | `/api/products/{id}/demo-trigger` | Fire a demo event (portfolio use) |

`basePrice` is immutable after creation. `currentPrice` is always `basePrice × priceMultiplier`. All automated price changes flow through the Kafka pipeline — never through REST.

---

## Running Locally

### Prerequisites

- Docker Desktop
- Ollama running locally with `llama3.2:1b` pulled

```bash
ollama pull llama3.2:1b
```

### Start the full stack

```bash
git clone https://github.com/AryamannSingh7/Sentiment-Dynamic-Pricing-Engine.git
cd Sentiment-Dynamic-Pricing-Engine
docker compose up --build
```

This starts 8 containers in dependency order: MongoDB → Zookeeper → Kafka → kafka-init (creates topics) → Spring Boot → AI Consumer + Event Simulator + Real-Sentiment Fetcher.

### Create demo products and watch prices update

```bash
# Create a product
curl -X POST http://localhost:8080/api/products \
  -H "Content-Type: application/json" \
  -d '{"name":"Wireless Headphones","description":"Premium ANC headphones","category":"Electronics","basePrice":199.99,"inventory":250}'

# Watch the current price (run this repeatedly)
curl http://localhost:8080/api/products/<productId>

# See the full audit trail
curl http://localhost:8080/api/products/<productId>/audit
```

### Test signal classification without Kafka

```bash
cd real-sentiment-fetcher
pip install -r requirements.txt && python -m textblob.download_corpora
python fetcher.py --dry-run
```

### Test the LLM pipeline without Kafka

```bash
cd ai-sentiment-consumer
pip install -r requirements.txt
GROQ_API_KEY=<your-key> python test_groq.py
```

Or set `MOCK_LLM=true` to run the full pipeline with deterministic hardcoded responses — no LLM required.

---

## Environment Variables

### Spring Boot

| Variable | Default | Description |
|---|---|---|
| `MONGODB_URI` | `mongodb://mongo:27017/pricing_db` | MongoDB connection string |
| `KAFKA_BOOTSTRAP_SERVERS` | `kafka:29092` | Kafka broker address |
| `KAFKA_ENABLED` | `true` | `false` disables Kafka (Phase 1 testing) |
| `KAFKA_SASL_USERNAME` | *(empty)* | Set for cloud Kafka (Redpanda) auth |
| `KAFKA_SASL_PASSWORD` | *(empty)* | |
| `PRICING_COOLDOWN_SECONDS` | `30` | Min seconds between price updates per product |

### AI Consumer

| Variable | Default | Description |
|---|---|---|
| `GROQ_API_KEY` | *(empty)* | Set to use Groq (production). Takes priority over OpenAI |
| `GROQ_MODEL` | `llama-3.1-8b-instant` | Groq model ID |
| `OPENAI_API_KEY` | *(empty)* | Set to use OpenAI (if no Groq key) |
| `OLLAMA_BASE_URL` | `http://host.docker.internal:11434` | Ollama endpoint (local fallback) |
| `OLLAMA_MODEL` | `llama3.2:1b` | |
| `MOCK_LLM` | `false` | `true` = deterministic responses, no LLM needed |
| `KAFKA_SASL_USERNAME` | *(empty)* | Set for cloud Kafka auth |

### Real-Sentiment Fetcher

| Variable | Default | Description |
|---|---|---|
| `FETCH_INTERVAL_SECONDS` | `300` | How often to poll feeds (seconds) |
| `RSS_FEEDS` | TechCrunch, The Verge, ArsTechnica + 5 Reddit RSS | Comma-separated feed URLs |
| `REDDIT_CLIENT_ID` | *(empty)* | Optional — for Reddit API via PRAW |
| `REDDIT_CLIENT_SECRET` | *(empty)* | |
| `SIMULATOR_PRODUCT_IDS` | *(empty)* | Comma-separated UUIDs (bypasses catalog lookup) |
| `KAFKA_SASL_USERNAME` | *(empty)* | Set for cloud Kafka auth |

---

## Project Structure

```
├── product-catalog-service/        Java 17 + Spring Boot 3.2
│   └── src/main/java/com/pricing/catalog/
│       ├── controller/             REST endpoints
│       ├── service/                5-layer safety system
│       ├── kafka/                  PriceAdjustmentConsumer (AckMode.MANUAL)
│       ├── model/                  Product (@Version), PriceAuditLog
│       ├── dto/                    CreateProductRequest, PriceAdjustmentEvent
│       └── config/                 KafkaConfig (SASL support, topic beans)
│
├── ai-sentiment-consumer/          Python 3.11 — LLM pipeline
│   ├── main.py                     Consumer loop, graceful shutdown, health server
│   ├── sentiment_analyzer.py       Groq / OpenAI / Ollama / Mock backends
│   ├── kafka_producer.py           Publishes price-adjustment-events
│   └── config.py                   Environment-driven config (LLM + SASL)
│
├── real-sentiment-fetcher/         Python 3.11 — real-world signal ingestion
│   └── fetcher.py                  Reddit RSS + tech news + TextBlob classification
│
├── event-simulator/                Python 3.11 — deterministic mock events
│   └── simulator.py                8 event templates, configurable rate
│
├── pricing-portfolio/              Next.js 14 — portfolio + live demo
│   └── src/
│       ├── app/                    Page, layout, metadata
│       ├── components/             HeroSection, LiveDemo, Pipeline, Architecture, TechDeepDive
│       ├── hooks/                  useProducts, useAuditLog, useDemoTrigger
│       └── lib/                    api.ts, constants.ts, types.ts
│
└── docker-compose.yml              Full local stack (8 services)
```

---

## How the Safety System Works

Every price adjustment — whether from Kafka or the demo trigger — passes through all 5 layers in `ProductService.applyPriceAdjustment()`:

```
Incoming adjustment event
        │
        ▼
[1] Idempotency ── adjustmentEventId already in audit log? ──► SKIP
        │ NO
        ▼
[2] Cooldown ──── price updated in last 30s? ─────────────────► SKIP
        │ NO
        ▼
[3] Delta cap ─── clamp to (current ± 0.25)
        │
        ▼
[4] Bounds ─────── clamp to [0.50, 2.00]
        │
        ▼
[5] Optimistic ─── save with @Version check ──► conflict? ─────► RETRY (max 3×)
     lock               │
                        ▼
                  Write product + audit log
                  Commit Kafka offset
```

---

## License

MIT
