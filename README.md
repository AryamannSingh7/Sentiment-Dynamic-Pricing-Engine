# Sentiment Dynamic Pricing Engine

![Java](https://img.shields.io/badge/Java-17-orange?logo=openjdk)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2-brightgreen?logo=springboot)
![Python](https://img.shields.io/badge/Python-3.11-blue?logo=python)
![Kafka](https://img.shields.io/badge/Apache%20Kafka-7.6-black?logo=apachekafka)
![MongoDB](https://img.shields.io/badge/MongoDB-7.0-green?logo=mongodb)
![Docker](https://img.shields.io/badge/Docker-Compose-blue?logo=docker)

> An event-driven backend that listens to real-world signals — social media trends, competitor price changes, review surges — and automatically adjusts product prices using AI-powered sentiment analysis.abc

---

## How It Works

```
External Signals                 AI Pipeline                  Pricing Engine
─────────────────                ────────────                 ──────────────
 Social trends   ──┐             ┌──────────┐                ┌─────────────┐
 Competitor      ──┼──► Kafka ──►│  Python  │──► Kafka ─────►│ Spring Boot │──► MongoDB
 Review surges   ──┘  (raw-     │  + LLM   │  (price-       │  + Audit    │
 News events     ──┘  sentiment) └──────────┘   adjustment)  │    Log      │
                                                              └─────────────┘
```

Each signal flows through a Kafka topic into a Python worker that calls an LLM (Ollama / OpenAI) to compute a calibrated price multiplier. Spring Boot consumes the result, applies safety checks, and writes the new price to MongoDB with a full immutable audit trail.

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                         Docker Compose Network                        │
│                                                                        │
│  ┌─────────────────┐    raw-sentiment-events    ┌──────────────────┐  │
│  │ event-simulator │ ──────────────────────────► │ ai-sentiment-    │  │
│  │   (Python)      │                             │ consumer         │  │
│  └─────────────────┘                             │ (Python + LLM)   │  │
│                                                  └────────┬─────────┘  │
│  ┌─────────────────┐                                      │            │
│  │   Zookeeper     │    price-adjustment-events           │            │
│  │   + Kafka       │ ◄────────────────────────────────────┘            │
│  └─────────────────┘                                      │            │
│                                                           ▼            │
│  ┌─────────────────┐    price-adjustment-events    ┌─────────────────┐ │
│  │    MongoDB      │ ◄──────────────────────────── │ product-catalog │ │
│  │  (products +    │                               │ service         │ │
│  │   audit log)    │                               │ (Spring Boot)   │ │
│  └─────────────────┘                               └─────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Key Features

- **Real-time event processing** — Kafka with 3 partitions per topic, keyed by `productId` for ordered per-product delivery
- **AI-powered pricing** — LLM (Ollama or OpenAI) evaluates raw signals and returns a structured `price_multiplier`, `sentiment_score`, `confidence`, and plain-English reason
- **5-layer safety system** in `ProductService.applyPriceAdjustment()`:
  1. **Idempotency** — skips duplicate events via unique `adjustmentEventId` index
  2. **Cooldown** — enforces minimum 30s between price changes per product
  3. **Delta cap** — single event moves multiplier at most ±0.25
  4. **Bounds guard** — multiplier clamped to [0.50, 2.00]
  5. **Optimistic locking** — `@Version` field prevents concurrent write conflicts, retries 3×
- **Immutable audit trail** — every price change appended to `price_audit_log` collection; insert-only, never updated
- **Manual Kafka offset commit** — offset committed only after successful DB write + audit log write; guarantees at-least-once delivery
- **Graceful Kafka consumer** — `AckMode.MANUAL`, SIGINT/SIGTERM handlers for clean shutdown

---

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| API Service | Java 17 + Spring Boot 3.2 | Production-grade REST, auto-configuration, mature Kafka/MongoDB ecosystem |
| Message Broker | Apache Kafka (Confluent 7.6) | Durable, ordered, replayable event log; decouples producers from consumers |
| AI Worker | Python 3.11 + confluent-kafka | Lightweight consumer; Python's LLM ecosystem (OpenAI SDK, Ollama) is best-in-class |
| LLM | Ollama (llama3.2:1b) / OpenAI | Structured JSON output for deterministic pricing recommendations |
| Database | MongoDB 7 | Flexible schema for products; native support for append-only audit collections |
| Orchestration | Docker Compose | Single-command local deployment of all 7 services |

---

## Kafka Topics

| Topic | Partitions | Producer | Consumer |
|---|---|---|---|
| `raw-sentiment-events` | 3 | event-simulator | ai-sentiment-consumer |
| `price-adjustment-events` | 3 | ai-sentiment-consumer | product-catalog-service |

---

## REST API

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/products` | Create a product |
| `GET` | `/api/products` | List all active products |
| `GET` | `/api/products/{id}` | Get product by ID |
| `PUT` | `/api/products/{id}` | Update product fields (not basePrice) |
| `DELETE` | `/api/products/{id}` | Soft delete (sets status = DISCONTINUED) |
| `GET` | `/api/products/{id}/audit` | Fetch full price audit history |

> **Note:** `basePrice` is immutable after creation. `currentPrice` is always derived as `basePrice × priceMultiplier`. Price changes only flow through the Kafka pipeline — never through REST.

---

## Getting Started

### Prerequisites

- Docker Desktop
- Ollama with `llama3.2:1b` pulled (`ollama pull llama3.2:1b`)

### Run the full stack

```bash
git clone https://github.com/AryamannSingh7/Sentiment-Dynamic-Pricing-Engine.git
cd Sentiment-Dynamic-Pricing-Engine
docker compose up --build
```

All 7 services start automatically. The event simulator fetches product IDs from the catalog service on startup.

### Create a product and watch the price change

```bash
# Create a product
curl -X POST http://localhost:8080/api/products \
  -H "Content-Type: application/json" \
  -d '{"name":"Wireless Headphones","description":"Premium ANC","category":"Electronics","basePrice":199.99,"inventory":250}'

# Watch price updates (replace <id> with the productId from above)
curl http://localhost:8080/api/products/<id>
curl http://localhost:8080/api/products/<id>/audit
```

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `MONGODB_URI` | `mongodb://mongo:27017/pricing_db` | MongoDB connection string |
| `KAFKA_BOOTSTRAP_SERVERS` | `kafka:29092` | Kafka broker address |
| `KAFKA_ENABLED` | `true` | Set `false` to disable Kafka (testing) |
| `PRICING_COOLDOWN_SECONDS` | `30` | Min seconds between price updates per product |
| `OPENAI_API_KEY` | *(empty)* | OpenAI/OpenRouter key — if blank, falls back to Ollama |
| `OPENAI_BASE_URL` | *(empty)* | Custom base URL (e.g. OpenRouter) |
| `OLLAMA_BASE_URL` | `http://host.docker.internal:11434` | Ollama endpoint |
| `OLLAMA_MODEL` | `llama3.2:1b` | Ollama model to use |
| `MOCK_LLM` | `false` | Set `true` for deterministic pipeline testing without LLM |
| `SIMULATOR_EVENTS_PER_SECOND` | `0.2` | Event production rate |

---

## Project Structure

```
├── product-catalog-service/     # Java Spring Boot — REST API + Kafka consumer
│   ├── src/main/java/com/pricing/catalog/
│   │   ├── model/               # Product, PriceAuditLog, ProductStatus
│   │   ├── dto/                 # Request/response DTOs
│   │   ├── service/             # Business logic + 5-layer safety system
│   │   ├── kafka/               # PriceAdjustmentConsumer (AckMode.MANUAL)
│   │   ├── controller/          # REST endpoints
│   │   └── config/              # Kafka configuration
│   └── Dockerfile               # Multi-stage build (Maven → JRE Alpine)
├── ai-sentiment-consumer/       # Python — Kafka consumer + LLM pipeline
│   ├── main.py                  # Consumer loop with graceful shutdown
│   ├── sentiment_analyzer.py    # OpenAI / Ollama / Mock backends
│   ├── kafka_producer.py        # Publishes price-adjustment-events
│   └── config.py                # Environment-driven configuration
├── event-simulator/             # Python — publishes mock sentiment events
│   └── simulator.py
└── docker-compose.yml           # Full stack orchestration
```

---

## License

MIT
