"""
Quick smoke test for the Groq integration.

Usage:
  cd ai-sentiment-consumer
  pip install -r requirements.txt
  GROQ_API_KEY=<your_key> python test_groq.py        (bash)
  $env:GROQ_API_KEY="<your_key>"; python test_groq.py (PowerShell)
"""

import os
import sys

if not os.environ.get("GROQ_API_KEY"):
    print("ERROR: GROQ_API_KEY is not set.")
    print("Get a free key at https://console.groq.com, then re-run.")
    sys.exit(1)

import config
import sentiment_analyzer

SAMPLE_EVENTS = [
    {
        "eventId": "test-001",
        "productId": "test-product-001",
        "eventType": "SOCIAL_TREND_POSITIVE",
        "rawText": "These headphones are getting amazing reviews on Reddit. Everyone loves the sound quality and build.",
        "source": "reddit-r/headphones",
        "magnitude": None,
        "timestamp": "2025-01-01T00:00:00Z",
    },
    {
        "eventId": "test-002",
        "productId": "test-product-002",
        "eventType": "COMPETITOR_PRICE_DROP",
        "rawText": "Main competitor slashed their equivalent headphone price by 25%. Risk of customer churn.",
        "source": "competitor-tracker",
        "magnitude": 0.25,
        "timestamp": "2025-01-01T00:00:01Z",
    },
    {
        "eventId": "test-003",
        "productId": "test-product-003",
        "eventType": "NEWS_NEGATIVE",
        "rawText": "Consumer watchdog published a critical report on audio product safety standards and data privacy concerns.",
        "source": "rss-techcrunch.com",
        "magnitude": None,
        "timestamp": "2025-01-01T00:00:02Z",
    },
]

print(f"\nBackend: Groq / {config.GROQ_MODEL}")
print("=" * 60)

passed = 0
for event in SAMPLE_EVENTS:
    print(f"\nEvent: {event['eventType']} (source: {event['source']})")
    print(f"Text:  {event['rawText'][:80]}...")
    result = sentiment_analyzer.analyze(event)
    if result is None:
        print("FAIL — analyze() returned None")
        continue
    print(f"  sentiment_score:   {result.sentiment_score:+.3f}")
    print(f"  price_multiplier:  {result.price_multiplier:.4f}")
    print(f"  confidence:        {result.confidence:.2f}")
    print(f"  adjustment_reason: {result.adjustment_reason}")
    passed += 1

print("\n" + "=" * 60)
print(f"Result: {passed}/{len(SAMPLE_EVENTS)} events processed successfully")
if passed == len(SAMPLE_EVENTS):
    print("Groq integration OK")
else:
    print("Some events failed — check logs above")
    sys.exit(1)
