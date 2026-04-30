"""
AI Sentiment Consumer

Consumes raw-sentiment-events, calls an LLM to evaluate each signal, and
publishes a price-adjustment-events message for the Spring Boot pricing updater.

Consumer group: ai-sentiment-group
Partition key:  productId (matches simulator and producer — ensures ordering)
"""

import json
import logging
import signal
import sys
import time

from confluent_kafka import Consumer, KafkaError, KafkaException

import config
import kafka_producer
import sentiment_analyzer

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [ai-consumer] %(levelname)s %(message)s",
)
log = logging.getLogger(__name__)

# ── Graceful shutdown ────────────────────────────────────────────────────────

_running = True

def _handle_signal(sig, frame):
    global _running
    log.info("Shutdown signal received, stopping consumer loop...")
    _running = False

signal.signal(signal.SIGINT,  _handle_signal)
signal.signal(signal.SIGTERM, _handle_signal)

# ── Consumer setup ───────────────────────────────────────────────────────────

def build_consumer() -> Consumer:
    conf = {
        "bootstrap.servers":        config.KAFKA_BOOTSTRAP,
        "group.id":                 config.CONSUMER_GROUP,
        "auto.offset.reset":        "earliest",
        "enable.auto.commit":       False,
        "max.poll.interval.ms":     300_000,
        "session.timeout.ms":       30_000,
    }
    if config.USE_SASL:
        conf.update({
            "security.protocol": "SASL_SSL",
            "sasl.mechanism":    "SCRAM-SHA-256",
            "sasl.username":     config.KAFKA_SASL_USERNAME,
            "sasl.password":     config.KAFKA_SASL_PASSWORD,
        })
    return Consumer(conf)

# ── Main loop ────────────────────────────────────────────────────────────────

def main():
    consumer = build_consumer()
    consumer.subscribe([config.RAW_TOPIC])
    log.info("Subscribed to '%s' as group '%s'", config.RAW_TOPIC, config.CONSUMER_GROUP)
    if config.MOCK_LLM:
        log.info("LLM backend: MOCK (deterministic, no external calls)")
    elif config.USE_GROQ:
        log.info("LLM backend: Groq %s", config.GROQ_MODEL)
    elif config.USE_OPENAI:
        log.info("LLM backend: OpenAI %s", config.OPENAI_MODEL)
    else:
        log.info("LLM backend: Ollama %s", config.OLLAMA_MODEL)

    processed = 0
    try:
        while _running:
            msg = consumer.poll(timeout=config.POLL_INTERVAL_MS / 1000.0)

            if msg is None:
                continue
            if msg.error():
                if msg.error().code() == KafkaError._PARTITION_EOF:
                    log.debug("Reached end of partition %s", msg.partition())
                else:
                    raise KafkaException(msg.error())
                continue

            raw_value = msg.value().decode("utf-8")
            log.info("Received event [partition=%s, offset=%s]", msg.partition(), msg.offset())

            try:
                event = json.loads(raw_value)
            except json.JSONDecodeError as exc:
                log.error("Malformed JSON at offset %s: %s", msg.offset(), exc)
                consumer.commit(message=msg)
                continue

            # Call LLM
            recommendation = sentiment_analyzer.analyze(event)

            if recommendation is None:
                log.warning("LLM returned no result for event %s, skipping", event.get("eventId"))
                consumer.commit(message=msg)
                continue

            # Publish pricing decision
            kafka_producer.publish_price_adjustment(event, recommendation)

            # Commit offset only after successful publish
            consumer.commit(message=msg)
            processed += 1

            log.info(
                "Processed event %s | product=%s | multiplier=%.4f | score=%.4f | confidence=%.2f",
                event.get("eventId"), event.get("productId"),
                recommendation.price_multiplier, recommendation.sentiment_score,
                recommendation.confidence,
            )

    except Exception as exc:
        log.exception("Fatal error in consumer loop: %s", exc)
        sys.exit(1)
    finally:
        log.info("Closing consumer. Total events processed: %d", processed)
        consumer.close()


if __name__ == "__main__":
    main()
