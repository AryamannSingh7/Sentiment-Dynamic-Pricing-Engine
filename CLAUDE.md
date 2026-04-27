# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Sentiment-Aware Dynamic Pricing Engine** — a microservices system that adjusts product prices based on AI sentiment analysis. Only `product-catalog-service` has implementation; `event-simulator` and `ai-sentiment-consumer` are empty placeholders.

## Build & Run Commands

All commands run from `product-catalog-service/`:

```bash
# Build
mvn clean package

# Run
mvn spring-boot:run

# Run tests
mvn test

# Run a single test class
mvn test -Dtest=ProductServiceTest

# Run a single test method
mvn test -Dtest=ProductServiceTest#methodName
```

## Architecture

### Pricing Flow
1. External AI component publishes `PriceAdjustmentEvent` to Kafka topic `price-adjustment-events`
2. Product Catalog Service consumes the event and updates `Product.currentPrice = basePrice × priceMultiplier`
3. An immutable `PriceAuditLog` entry is written for every price change

### Key Domain Rules
- `basePrice` is **immutable** — set at creation, never changed through the API
- `currentPrice` is always derived: `basePrice × priceMultiplier`
- `priceMultiplier` is bounded to `[0.50, 2.00]`; default is `1.0`
- `sentimentScore` on `Product` is a rolling value in `[-1.0, 1.0]`
- `PriceAuditLog` is insert-only (never updated or deleted); `adjustmentEventId` enforces idempotency
- Price changes **only** flow through the Kafka pipeline — never through REST update endpoints

### MongoDB Collections
| Collection | Class | Notes |
|---|---|---|
| `products` | `Product` | Optimistic locking via `@Version` |
| `price_audit_log` | `PriceAuditLog` | Append-only audit trail |

### Kafka Topics
| Topic | Direction | Purpose |
|---|---|---|
| `price-adjustment-events` | Consumed | Triggers price multiplier updates |
| `raw-sentiment-events` | Referenced (audit only) | Source event tracing stored in audit log |

### Package Layout (`com.pricing.catalog`)
| Package | Status | Purpose |
|---|---|---|
| `model` | Done | `Product`, `PriceAuditLog`, `ProductStatus` |
| `dto` | Done | `CreateProductRequest`, `UpdateProductRequest`, `PriceAdjustmentEvent` |
| `repository` | Done | `ProductRepository`, `AuditLogRepository` |
| `exception` | Done | `GlobalExceptionHandler` (uses `ProblemDetail`), `ProductNotFoundException` |
| `controller` | Empty | REST endpoints to implement |
| `service` | Empty | Business logic to implement |
| `kafka` | Empty | Kafka consumer to implement |
| `config` | Empty | MongoDB/Kafka configuration to implement |

### Testing Infrastructure
- **Embedded MongoDB** (`de.flapdoodle.embed.mongo`) — no external MongoDB needed for tests
- **`spring-kafka-test`** — embedded Kafka broker available for integration tests
- Test source root: `src/test/java/com/pricing/catalog/` (controller/ and service/ subdirs exist but are empty)
