"""
Real Sentiment Fetcher — polls Reddit and RSS feeds for real-world sentiment
signals and publishes them to the raw-sentiment-events Kafka topic.

Produces the same schema as event-simulator so the rest of the pipeline
(ai-sentiment-consumer → product-catalog-service) is unaffected.

Environment variables:
  KAFKA_BOOTSTRAP_SERVERS   default: localhost:9092
  CATALOG_SERVICE_URL       default: http://localhost:8080
  SIMULATOR_PRODUCT_IDS     comma-separated UUIDs (optional — fetched from catalog otherwise)
  FETCH_INTERVAL_SECONDS    default: 300 (5 min)

  REDDIT_CLIENT_ID          Reddit app client ID  (skip Reddit if absent)
  REDDIT_CLIENT_SECRET      Reddit app client secret
  REDDIT_USER_AGENT         default: sentiment-fetcher/1.0
  REDDIT_SUBREDDITS         default: gadgets,headphones,tech,Electronics,buildapc

  RSS_FEEDS                 comma-separated feed URLs (defaults provided)
"""

import argparse
import json
import logging
import os
import random
import re
import threading
import time
import uuid
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import urlparse

import feedparser
import praw
import requests
from confluent_kafka import Producer
from textblob import TextBlob

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [fetcher] %(levelname)s %(message)s",
)
log = logging.getLogger(__name__)

# ── Configuration ─────────────────────────────────────────────────────────────

KAFKA_BOOTSTRAP      = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")
KAFKA_SASL_USERNAME  = os.getenv("KAFKA_SASL_USERNAME", "")
KAFKA_SASL_PASSWORD  = os.getenv("KAFKA_SASL_PASSWORD", "")
TOPIC                = "raw-sentiment-events"
CATALOG_URL          = os.getenv("CATALOG_SERVICE_URL", "http://localhost:8080")
FETCH_INTERVAL       = int(os.getenv("FETCH_INTERVAL_SECONDS", "300"))

REDDIT_CLIENT_ID     = os.getenv("REDDIT_CLIENT_ID", "")
REDDIT_CLIENT_SECRET = os.getenv("REDDIT_CLIENT_SECRET", "")
REDDIT_USER_AGENT    = os.getenv("REDDIT_USER_AGENT", "sentiment-fetcher/1.0")
REDDIT_SUBREDDITS    = [s.strip() for s in os.getenv(
    "REDDIT_SUBREDDITS", "gadgets,headphones,tech,Electronics,buildapc"
).split(",") if s.strip()]

_default_rss = ",".join([
    "https://techcrunch.com/feed/",
    "https://www.theverge.com/rss/index.xml",
    "https://feeds.arstechnica.com/arstechnica/technology-lab",
])
RSS_FEEDS = [f.strip() for f in os.getenv("RSS_FEEDS", _default_rss).split(",") if f.strip()]

# ── Keyword patterns ──────────────────────────────────────────────────────────

_PRICE_DROP   = re.compile(r"price.?drop|cheaper|discount|on sale|price.?cut|reduced|markdown|deal", re.I)
_PRICE_SURGE  = re.compile(r"price.?(hike|increase|surge|raise|up)|expensive|mark.?up|price.?jump", re.I)
_REVIEW_WORDS = re.compile(r"\breview|rating|\bstar\b|recommend|worth.?buy|rated\b", re.I)
_PERCENT      = re.compile(r"(\d+(?:\.\d+)?)\s*%")

# ── Classification ────────────────────────────────────────────────────────────

def _polarity(text: str) -> float:
    return TextBlob(text).sentiment.polarity


def _extract_magnitude(text: str) -> float | None:
    m = _PERCENT.search(text)
    return min(float(m.group(1)) / 100.0, 1.0) if m else None


def classify(text: str, is_reddit: bool) -> tuple[str, float | None]:
    """Return (eventType, magnitude). Competitor price signals take priority."""
    if _PRICE_DROP.search(text):
        return "COMPETITOR_PRICE_DROP", _extract_magnitude(text) or 0.15

    if _PRICE_SURGE.search(text):
        return "COMPETITOR_PRICE_SURGE", _extract_magnitude(text) or 0.15

    polarity = _polarity(text)

    if _REVIEW_WORDS.search(text):
        return ("REVIEW_SURGE_POSITIVE" if polarity >= 0 else "REVIEW_SURGE_NEGATIVE"), None

    if is_reddit:
        return ("SOCIAL_TREND_POSITIVE" if polarity >= 0 else "SOCIAL_TREND_NEGATIVE"), None

    return ("NEWS_POSITIVE" if polarity >= 0 else "NEWS_NEGATIVE"), None


# ── Event builder ─────────────────────────────────────────────────────────────

def build_event(product_id: str, text: str, source: str, is_reddit: bool) -> dict:
    event_type, magnitude = classify(text, is_reddit)
    return {
        "eventId":   str(uuid.uuid4()),
        "productId": product_id,
        "eventType": event_type,
        "rawText":   text[:500],
        "source":    source,
        "magnitude": magnitude,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


DRY_RUN = False  # set via --dry-run CLI flag


def _delivery_report(err, msg):
    if err:
        log.error("Delivery failed [partition %s]: %s", msg.partition(), err)
    else:
        log.debug("Delivered to %s [%s @ %s]", msg.topic(), msg.partition(), msg.offset())


# ── Reddit fetcher ────────────────────────────────────────────────────────────

def fetch_reddit(product_ids: list[str], producer: Producer, seen: set) -> int:
    if not REDDIT_CLIENT_ID or not REDDIT_CLIENT_SECRET:
        log.warning("REDDIT_CLIENT_ID / REDDIT_CLIENT_SECRET not set — skipping Reddit")
        return 0

    reddit = praw.Reddit(
        client_id=REDDIT_CLIENT_ID,
        client_secret=REDDIT_CLIENT_SECRET,
        user_agent=REDDIT_USER_AGENT,
    )

    published = 0
    for sub_name in REDDIT_SUBREDDITS:
        try:
            subreddit = reddit.subreddit(sub_name)
            for post in subreddit.new(limit=10):
                if post.id in seen:
                    continue
                seen.add(post.id)

                text = post.title
                if post.selftext:
                    text += " " + post.selftext[:300]

                product_id = random.choice(product_ids)
                event = build_event(product_id, text, f"reddit-r/{sub_name}", is_reddit=True)
                if DRY_RUN:
                    log.info("[DRY-RUN] Reddit r/%-12s → %-28s | %s", sub_name, event["eventType"], post.title[:55])
                else:
                    producer.produce(TOPIC, key=product_id, value=json.dumps(event), callback=_delivery_report)
                    producer.poll(0)
                    log.info("Reddit r/%-15s → %-28s | %s", sub_name, event["eventType"], post.title[:55])
                published += 1

        except Exception as exc:
            log.error("r/%s fetch error: %s", sub_name, exc)

    return published


# ── RSS fetcher ───────────────────────────────────────────────────────────────

def fetch_rss(product_ids: list[str], producer: Producer, seen: set) -> int:
    published = 0
    for feed_url in RSS_FEEDS:
        try:
            feed   = feedparser.parse(feed_url)
            domain = urlparse(feed_url).netloc.replace("www.", "")
            source = f"rss-{domain}"

            for entry in feed.entries[:5]:
                entry_id = entry.get("id") or entry.get("link", "")
                if not entry_id or entry_id in seen:
                    continue
                seen.add(entry_id)

                title   = entry.get("title", "")
                summary = re.sub(r"<[^>]+>", " ", entry.get("summary", ""))  # strip HTML
                text    = f"{title} {summary}".strip()
                if not text:
                    continue

                product_id = random.choice(product_ids)
                event = build_event(product_id, text, source, is_reddit=False)
                if DRY_RUN:
                    log.info("[DRY-RUN] RSS  %-19s → %-28s | %s", domain, event["eventType"], title[:55])
                else:
                    producer.produce(TOPIC, key=product_id, value=json.dumps(event), callback=_delivery_report)
                    producer.poll(0)
                    log.info("RSS  %-22s → %-28s | %s", domain, event["eventType"], title[:55])
                published += 1

        except Exception as exc:
            log.error("RSS feed %s error: %s", feed_url, exc)

    return published


# ── Product ID resolution ─────────────────────────────────────────────────────

def resolve_product_ids() -> list[str]:
    raw = os.getenv("SIMULATOR_PRODUCT_IDS", "")
    ids = [p.strip() for p in raw.split(",") if p.strip()]
    if ids:
        return ids
    try:
        resp = requests.get(f"{CATALOG_URL}/api/products", timeout=5)
        resp.raise_for_status()
        return [p["productId"] for p in resp.json()]
    except Exception as exc:
        log.error("Failed to fetch products from catalog: %s", exc)
        return []


# ── Main loop ─────────────────────────────────────────────────────────────────

def _start_health_server():
    class _H(BaseHTTPRequestHandler):
        def do_GET(self):
            self.send_response(200)
            self.end_headers()
            self.wfile.write(b"OK")
        def log_message(self, *args):
            pass
    port = int(os.getenv("PORT", "8080"))
    HTTPServer(("0.0.0.0", port), _H).serve_forever()


def main():
    global DRY_RUN
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true",
                        help="Fetch and classify without connecting to Kafka (test mode)")
    args = parser.parse_args()
    DRY_RUN = args.dry_run

    if not DRY_RUN:
        threading.Thread(target=_start_health_server, daemon=True).start()
        log.info("Health server started on port %s", os.getenv("PORT", "8080"))

    if DRY_RUN:
        log.info("DRY-RUN mode — events will be classified and logged but NOT sent to Kafka")
        producer = None
        product_ids = ["dry-run-product-001", "dry-run-product-002"]
    else:
        conf = {"bootstrap.servers": KAFKA_BOOTSTRAP}
        if KAFKA_SASL_USERNAME:
            conf.update({
                "security.protocol": "SASL_SSL",
                "sasl.mechanism":    "SCRAM-SHA-256",
                "sasl.username":     KAFKA_SASL_USERNAME,
                "sasl.password":     KAFKA_SASL_PASSWORD,
            })
        producer    = Producer(conf)
        product_ids = resolve_product_ids()
        if not product_ids:
            log.error("No product IDs available. Create products first or set SIMULATOR_PRODUCT_IDS.")
            return
        log.info("Connected to Kafka at %s", KAFKA_BOOTSTRAP)

    log.info("Tracking %d product(s) | interval=%ds | subreddits=%s | rss_feeds=%d",
             len(product_ids), FETCH_INTERVAL, REDDIT_SUBREDDITS, len(RSS_FEEDS))

    seen: set[str] = set()
    cycle = 0

    while True:
        cycle += 1
        log.info("=== Fetch cycle #%d ===", cycle)
        total  = fetch_reddit(product_ids, producer, seen)
        total += fetch_rss(product_ids, producer, seen)
        if not DRY_RUN:
            producer.flush()
        log.info("=== Cycle #%d done: %d events. Next in %ds ===", cycle, total, FETCH_INTERVAL)
        time.sleep(FETCH_INTERVAL)


if __name__ == "__main__":
    main()
