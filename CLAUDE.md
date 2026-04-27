# CLAUDE.md — Sentiment Dynamic Pricing Engine

## CURRENT STATUS (read this first in every new session)

**Project:** Sentiment-Aware Dynamic Pricing Engine
**Repo:** https://github.com/AryamannSingh7/Sentiment-Dynamic-Pricing-Engine
**Git author:** Aryamann Singh <aryamann.singh21@gmail.com>

### Phase completion state
| Phase | Status | Description |
|---|---|---|
| Phase 1 — Spring Boot + MongoDB | **Code complete, not yet tested** | All files written, initial commit pushed to GitHub |
| Phase 2 — Kafka + Event Simulator | Code complete, not yet tested | docker-compose.yml + simulator.py written |
| Phase 3 — AI Sentiment Consumer | Code complete, not yet tested | Python LLM pipeline written |
| Phase 4 — Dynamic Pricing Updater | Code complete, not yet tested | Kafka consumer + optimistic lock in Spring Boot |
| Phase 5 — Full Docker Compose | Code complete, not yet tested | All services wired in docker-compose.yml |

### What to do in the next session
**Resume Phase 1 testing.** The user just installed Java 17, Maven, Docker Desktop, and
Python 3.11 and restarted their machine. Pick up with the Phase 1 test sequence below.

---

## Git Commit Rules (MANDATORY — read before every commit)
- **Always ask the user for approval before making any commit or push**
- Only commit after a phase is fully implemented AND tested
- Never add `Co-Authored-By: Claude` or any AI author line to commits
- Never stage or commit `SYSTEM_DESIGN.txt` or `.env`
- Commit author is always: Aryamann Singh <aryamann.singh21@gmail.com>
- Remote: https://github.com/AryamannSingh7/Sentiment-Dynamic-Pricing-Engine.git
- gh CLI is at: `C:\Program Files\GitHub CLI\gh.exe`

---

## Project Overview

An event-driven e-commerce backend. External sentiment signals (social media trends,
competitor price drops) flow through Kafka into a Python AI worker that calls an LLM
to compute a price multiplier. Spring Boot consumes the result and updates MongoDB with
full optimistic-lock concurrency safety and an immutable audit trail.

### Tech Stack
- **product-catalog-service** — Java 17, Spring Boot 3.2, MongoDB, Kafka consumer
- **ai-sentiment-consumer** — Python 3.11, confluent-kafka, OpenAI / Ollama
- **event-simulator** — Python 3.11, confluent-kafka
- **Infrastructure** — MongoDB 7, Kafka + Zookeeper (Confluent 7.6), Docker Compose

---

## Phase 1 Test Sequence (START HERE after restart)

### Prerequisites check (run in a new terminal after restart)
```bash
java -version        # must say 17.x
mvn -version         # must say 3.x
docker --version     # must respond
docker compose version
```

### Step 1 — Start MongoDB
```bash
cd "C:\Users\aryam\OneDrive\Desktop\Projects\Project 1"
docker compose up mongo -d
```
Expected: container `pricing-mongo` starts. Verify: `docker ps` shows it running.

### Step 2 — Run the Spring Boot service (Kafka disabled for Phase 1)
```bash
cd "C:\Users\aryam\OneDrive\Desktop\Projects\Project 1\product-catalog-service"
set KAFKA_ENABLED=false
mvn spring-boot:run
```
Expected: Spring Boot starts on port 8080. Look for "Started PricingEngineApplication".

### Step 3 — Run unit tests (separate terminal, service does NOT need to be running)
```bash
cd "C:\Users\aryam\OneDrive\Desktop\Projects\Project 1\product-catalog-service"
mvn test
```
Expected: all 9 tests pass (ProductServiceTest x6, ProductControllerTest x5).

### Step 4 — Test the REST API (PowerShell or curl)
```powershell
# Create a product
Invoke-RestMethod -Method POST -Uri http://localhost:8080/api/products `
  -ContentType "application/json" `
  -Body '{"name":"Wireless Headphones","description":"Premium ANC","category":"Electronics","basePrice":199.99,"inventory":250}'

# List products
Invoke-RestMethod http://localhost:8080/api/products

# Get by ID (replace <productId> with the UUID from the create response)
Invoke-RestMethod http://localhost:8080/api/products/<productId>

# Update inventory
Invoke-RestMethod -Method PUT -Uri http://localhost:8080/api/products/<productId> `
  -ContentType "application/json" `
  -Body '{"inventory":100}'

# Soft delete
Invoke-RestMethod -Method DELETE -Uri http://localhost:8080/api/products/<productId>

# Fetch audit log (should be empty at this stage)
Invoke-RestMethod http://localhost:8080/api/products/<productId>/audit
```

### Phase 1 pass criteria
- [ ] `mvn test` — all tests green
- [ ] POST /api/products returns 201 with `currentPrice == basePrice` and `priceMultiplier == 1`
- [ ] GET /api/products returns the product list
- [ ] PUT /api/products/{id} updates fields (not basePrice)
- [ ] DELETE sets `status = DISCONTINUED` (soft delete, product still retrievable)
- [ ] GET /api/products/{id}/audit returns empty array
- [ ] POST with missing `name` returns 400 with validation error

---

## Key Domain Rules
- `basePrice` is **immutable** — set at creation, never exposed in update endpoints
- `currentPrice` is always derived: `basePrice × priceMultiplier`
- `priceMultiplier` is bounded to `[0.50, 2.00]`; default `1.0`
- Price changes **only** flow through the Kafka pipeline — never through REST
- `PriceAuditLog` is insert-only; `adjustmentEventId` is a unique index (idempotency)
- Kafka offset is committed **only after** successful DB write + audit log write

## Safety layers in ProductService.applyPriceAdjustment()
1. **Idempotency** — skip if `adjustmentEventId` already in audit log
2. **Cooldown** — skip if product updated within last 30s (`PRICING_COOLDOWN_SECONDS`)
3. **Delta cap** — single event moves multiplier at most ±0.25
4. **Bounds guard** — multiplier clamped to [0.50, 2.00]
5. **Optimistic lock** — `@Version` checked on save; retries up to 3× on conflict

---

## Package Layout (`com.pricing.catalog`)
| Package | File | Purpose |
|---|---|---|
| root | `PricingEngineApplication.java` | Spring Boot entry point |
| `model` | `Product.java` | MongoDB document, `@Version` field |
| `model` | `PriceAuditLog.java` | Immutable audit record |
| `model` | `ProductStatus.java` | ACTIVE / INACTIVE / DISCONTINUED |
| `dto` | `CreateProductRequest.java` | Validated create payload |
| `dto` | `UpdateProductRequest.java` | Update payload (basePrice excluded) |
| `dto` | `PriceAdjustmentEvent.java` | Kafka event deserialization record |
| `repository` | `ProductRepository.java` | MongoRepository + custom finders |
| `repository` | `AuditLogRepository.java` | existsByAdjustmentEventId (idempotency) |
| `service` | `ProductService.java` | All business logic + pricing safety layers |
| `controller` | `ProductController.java` | REST endpoints |
| `kafka` | `PriceAdjustmentConsumer.java` | @KafkaListener, AckMode.MANUAL |
| `config` | `KafkaConfig.java` | Consumer factory, topic beans |
| `exception` | `GlobalExceptionHandler.java` | ProblemDetail error responses |
| `exception` | `ProductNotFoundException.java` | 404 exception |

## MongoDB Collections
| Collection | Class | Notes |
|---|---|---|
| `products` | `Product` | Optimistic locking via `@Version` |
| `price_audit_log` | `PriceAuditLog` | Append-only, unique index on `adjustmentEventId` |

## Kafka Topics
| Topic | Partitions | Producer | Consumer |
|---|---|---|---|
| `raw-sentiment-events` | 3 | event-simulator | ai-sentiment-consumer |
| `price-adjustment-events` | 3 | ai-sentiment-consumer | product-catalog-service |

## Environment Variables
| Variable | Default | Purpose |
|---|---|---|
| `MONGODB_URI` | `mongodb://mongo:27017/pricing_db` | MongoDB connection |
| `KAFKA_BOOTSTRAP_SERVERS` | `kafka:29092` | Kafka broker |
| `KAFKA_ENABLED` | `true` | Set `false` to disable Kafka (Phase 1 testing) |
| `PRICING_COOLDOWN_SECONDS` | `30` | Min seconds between price updates per product |
| `OPENAI_API_KEY` | *(empty)* | Set for OpenAI; blank = Ollama fallback |
| `SIMULATOR_PRODUCT_IDS` | *(empty)* | Comma-separated UUIDs for the simulator |
