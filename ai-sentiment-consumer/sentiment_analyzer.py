"""
Sentiment Analyzer — calls an LLM to evaluate a raw sentiment event and
return a structured pricing recommendation.

Primary backend:  OpenAI gpt-4o-mini  (set OPENAI_API_KEY)
Fallback backend: Ollama llama3        (requires a running Ollama instance)
"""

import json
import logging
from typing import Optional

from pydantic import BaseModel, Field, field_validator

import config

log = logging.getLogger(__name__)

# ── Response schema ──────────────────────────────────────────────────────────

class PricingRecommendation(BaseModel):
    sentiment_score:   float = Field(..., ge=-1.0, le=1.0,
        description="Overall sentiment delta. Positive = bullish, negative = bearish.")
    price_multiplier:  float = Field(..., ge=0.50, le=2.00,
        description="Absolute target price multiplier (1.0 = basePrice, 1.15 = 15% premium).")
    adjustment_reason: str   = Field(..., max_length=300,
        description="One-sentence plain-English justification.")
    confidence:        float = Field(..., ge=0.0, le=1.0,
        description="Model confidence in this assessment.")

    @field_validator("price_multiplier")
    @classmethod
    def clamp_multiplier(cls, v: float) -> float:
        return max(0.50, min(2.00, v))


# ── Prompt ───────────────────────────────────────────────────────────────────

SYSTEM_PROMPT = """\
You are a pricing intelligence engine for an e-commerce platform.
You receive external signals (social media trends, competitor prices, reviews, news)
and must translate them into concrete, calibrated pricing recommendations.

Rules:
- price_multiplier is an ABSOLUTE value (1.0 = base price, 1.15 = 15% above base).
- Be conservative: typical adjustments are ±0.05 to ±0.20.
- Only extreme, high-confidence signals justify ±0.20 or more.
- sentiment_score is a delta in [-1.0, 1.0]: how much this event shifts demand sentiment.
- Always respond with valid JSON matching the schema exactly — no markdown, no prose.
"""

USER_PROMPT_TEMPLATE = """\
Analyze the following e-commerce signal and return a JSON pricing recommendation.

Event type: {event_type}
Signal text: {raw_text}
Source: {source}
Magnitude hint (if provided): {magnitude}

Required JSON format:
{{
  "sentiment_score":   <float in [-1.0, 1.0]>,
  "price_multiplier":  <float in [0.50, 2.00]>,
  "adjustment_reason": "<one sentence>",
  "confidence":        <float in [0.0, 1.0]>
}}
"""


def build_prompt(event: dict) -> str:
    return USER_PROMPT_TEMPLATE.format(
        event_type=event.get("eventType", "UNKNOWN"),
        raw_text=event.get("rawText", ""),
        source=event.get("source", "unknown"),
        magnitude=event.get("magnitude") or "not provided",
    )


# ── LLM backends ─────────────────────────────────────────────────────────────

def _call_openai(prompt: str) -> Optional[PricingRecommendation]:
    from openai import OpenAI
    client = OpenAI(api_key=config.OPENAI_API_KEY)

    resp = client.chat.completions.create(
        model=config.OPENAI_MODEL,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user",   "content": prompt},
        ],
        temperature=0.2,
        max_tokens=256,
    )
    raw = resp.choices[0].message.content
    return PricingRecommendation(**json.loads(raw))


def _call_ollama(prompt: str) -> Optional[PricingRecommendation]:
    import requests
    payload = {
        "model": config.OLLAMA_MODEL,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user",   "content": prompt},
        ],
        "stream": False,
        "format": "json",
        "options": {"temperature": 0.2},
    }
    resp = requests.post(f"{config.OLLAMA_BASE_URL}/api/chat", json=payload, timeout=60)
    resp.raise_for_status()
    raw = resp.json()["message"]["content"]
    return PricingRecommendation(**json.loads(raw))


# ── Public interface ─────────────────────────────────────────────────────────

def analyze(event: dict) -> Optional[PricingRecommendation]:
    """
    Calls the configured LLM and returns a PricingRecommendation.
    Returns None on any failure so the caller can decide whether to skip or retry.
    """
    prompt = build_prompt(event)
    try:
        if config.USE_OPENAI:
            log.debug("Calling OpenAI %s for event %s", config.OPENAI_MODEL, event.get("eventId"))
            return _call_openai(prompt)
        else:
            log.debug("Calling Ollama %s for event %s", config.OLLAMA_MODEL, event.get("eventId"))
            return _call_ollama(prompt)
    except Exception as exc:
        log.error("LLM call failed for event %s: %s", event.get("eventId"), exc)
        return None
