"""
Event Simulator — publishes mock sentiment events to raw-sentiment-events Kafka topic.

Usage:
  # via Docker Compose (recommended)
  docker compose up event-simulator

  # standalone
  KAFKA_BOOTSTRAP_SERVERS=localhost:9092 \
  SIMULATOR_PRODUCT_IDS=<uuid1>,<uuid2> \
  python simulator.py

If SIMULATOR_PRODUCT_IDS is empty, the script fetches active product IDs from
the Product Catalog Service automatically (CATALOG_SERVICE_URL must be set).
"""

import json
import logging
import os
import random
import time
import uuid
from datetime import datetime, timezone

import requests
from confluent_kafka import Producer

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [simulator] %(levelname)s %(message)s",
)
log = logging.getLogger(__name__)

# ── Configuration ────────────────────────────────────────────────────────────

KAFKA_BOOTSTRAP = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")
TOPIC           = "raw-sentiment-events"
CATALOG_URL     = os.getenv("CATALOG_SERVICE_URL", "http://localhost:8080")
EVENTS_PER_SEC  = float(os.getenv("SIMULATOR_EVENTS_PER_SECOND", "1"))
SLEEP_SEC       = 1.0 / EVENTS_PER_SEC

# ── Event templates ──────────────────────────────────────────────────────────

EVENTS = [
    {
        "eventType": "SOCIAL_TREND_POSITIVE",
        "rawText": "Product is trending on Twitter with 94% positive mentions. Influencers praising quality.",
        "source": "twitter-simulator",
        "magnitude": None,
    },
    {
        "eventType": "SOCIAL_TREND_NEGATIVE",
        "rawText": "Multiple complaints about product quality flooding Reddit. Sentiment turning negative.",
        "source": "reddit-simulator",
        "magnitude": None,
    },
    {
        "eventType": "COMPETITOR_PRICE_DROP",
        "rawText": "Main competitor slashed their equivalent product price by 20%. Risk of customer churn.",
        "source": "competitor-tracker",
        "magnitude": 0.20,
    },
    {
        "eventType": "COMPETITOR_PRICE_SURGE",
        "rawText": "Competitor product out of stock, prices up 30%. Strong demand signal for our product.",
        "source": "competitor-tracker",
        "magnitude": 0.30,
    },
    {
        "eventType": "REVIEW_SURGE_POSITIVE",
        "rawText": "Product received 500 five-star reviews in the last 24 hours. Customer satisfaction high.",
        "source": "review-aggregator",
        "magnitude": None,
    },
    {
        "eventType": "REVIEW_SURGE_NEGATIVE",
        "rawText": "Product review score dropped from 4.5 to 3.1 after a defective batch report.",
        "source": "review-aggregator",
        "magnitude": None,
    },
    {
        "eventType": "NEWS_POSITIVE",
        "rawText": "Major tech outlet featured our product in Best Buys of 2024. Traffic spiking.",
        "source": "news-monitor",
        "magnitude": None,
    },
    {
        "eventType": "NEWS_NEGATIVE",
        "rawText": "Consumer watchdog published critical report on product safety standards.",
        "source": "news-monitor",
        "magnitude": None,
    },
]

# ── Helpers ──────────────────────────────────────────────────────────────────

def fetch_product_ids() -> list[str]:
    """Fetch active product IDs from the catalog service."""
    try:
        resp = requests.get(f"{CATALOG_URL}/api/products", timeout=5)
        resp.raise_for_status()
        return [p["productId"] for p in resp.json()]
    except Exception as exc:
        log.error("Failed to fetch products from catalog service: %s", exc)
        return []


def build_event(product_id: str) -> dict:
    template = random.choice(EVENTS)
    return {
        "eventId":   str(uuid.uuid4()),
        "productId": product_id,
        "eventType": template["eventType"],
        "rawText":   template["rawText"],
        "source":    template["source"],
        "magnitude": template["magnitude"],
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


def delivery_report(err, msg):
    if err:
        log.error("Delivery failed for event on partition %s: %s", msg.partition(), err)
    else:
        log.debug("Event delivered to %s [partition %s @ offset %s]",
                  msg.topic(), msg.partition(), msg.offset())


# ── Main loop ────────────────────────────────────────────────────────────────

def main():
    producer = Producer({"bootstrap.servers": KAFKA_BOOTSTRAP})
    log.info("Connected to Kafka at %s", KAFKA_BOOTSTRAP)

    # Resolve product IDs
    raw_ids = os.getenv("SIMULATOR_PRODUCT_IDS", "")
    product_ids = [p.strip() for p in raw_ids.split(",") if p.strip()]

    if not product_ids:
        log.info("SIMULATOR_PRODUCT_IDS not set — fetching from catalog service...")
        product_ids = fetch_product_ids()

    if not product_ids:
        log.error("No product IDs available. Create products first via POST /api/products, "
                  "then set SIMULATOR_PRODUCT_IDS or ensure CATALOG_SERVICE_URL is reachable.")
        return

    log.info("Simulating events for %d product(s): %s", len(product_ids), product_ids)
    log.info("Rate: %.1f events/sec (sleep %.2fs between events)", EVENTS_PER_SEC, SLEEP_SEC)

    sent = 0
    while True:
        product_id = random.choice(product_ids)
        event = build_event(product_id)

        producer.produce(
            topic=TOPIC,
            key=product_id,          # partition key ensures ordering per product
            value=json.dumps(event),
            callback=delivery_report,
        )
        producer.poll(0)
        sent += 1

        if sent % 10 == 0:
            log.info("Sent %d events so far. Last: [%s] for product %s",
                     sent, event["eventType"], product_id)

        time.sleep(SLEEP_SEC)


if __name__ == "__main__":
    main()
