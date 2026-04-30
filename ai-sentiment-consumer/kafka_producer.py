import json
import logging
import uuid
from datetime import datetime, timezone, timedelta

from confluent_kafka import Producer

import config
from sentiment_analyzer import PricingRecommendation

log = logging.getLogger(__name__)

_producer: Producer | None = None


def _get_producer() -> Producer:
    global _producer
    if _producer is None:
        conf = {"bootstrap.servers": config.KAFKA_BOOTSTRAP}
        if config.USE_SASL:
            conf.update({
                "security.protocol": "SASL_SSL",
                "sasl.mechanism":    "SCRAM-SHA-256",
                "sasl.username":     config.KAFKA_SASL_USERNAME,
                "sasl.password":     config.KAFKA_SASL_PASSWORD,
            })
        _producer = Producer(conf)
    return _producer


def _delivery_report(err, msg):
    if err:
        log.error("Delivery failed [partition=%s]: %s", msg.partition(), err)
    else:
        log.debug("Published to %s [partition=%s, offset=%s]",
                  msg.topic(), msg.partition(), msg.offset())


def publish_price_adjustment(raw_event: dict, recommendation: PricingRecommendation) -> None:
    """
    Publishes a price-adjustment-events message, keyed by productId so all
    events for the same product land on the same partition (ordered delivery).
    """
    product_id = raw_event["productId"]
    now        = datetime.now(timezone.utc)

    payload = {
        "adjustmentEventId": str(uuid.uuid4()),
        "sourceEventId":     raw_event["eventId"],
        "productId":         product_id,
        "priceMultiplier":   round(recommendation.price_multiplier, 4),
        "sentimentScore":    round(recommendation.sentiment_score, 4),
        "adjustmentReason":  recommendation.adjustment_reason,
        "confidence":        round(recommendation.confidence, 4),
        "timestamp":         now.isoformat(),
        "expiresAt":         (now + timedelta(hours=24)).isoformat(),
    }

    _get_producer().produce(
        topic=config.ADJUSTMENT_TOPIC,
        key=product_id,
        value=json.dumps(payload),
        callback=_delivery_report,
    )
    _get_producer().poll(0)

    log.info("Published price adjustment for product %s: multiplier=%.4f, reason='%s'",
             product_id, recommendation.price_multiplier, recommendation.adjustment_reason)
