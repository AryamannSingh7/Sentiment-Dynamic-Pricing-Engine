import os

KAFKA_BOOTSTRAP          = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")
CONSUMER_GROUP           = "ai-sentiment-group"
RAW_TOPIC                = "raw-sentiment-events"
ADJUSTMENT_TOPIC         = "price-adjustment-events"
POLL_INTERVAL_MS         = int(os.getenv("AI_CONSUMER_POLL_INTERVAL_MS", "1000"))

OPENAI_API_KEY           = os.getenv("OPENAI_API_KEY", "")
OPENAI_MODEL             = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

OLLAMA_BASE_URL          = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL             = os.getenv("OLLAMA_MODEL", "llama3")

# Use OpenAI if key is present, otherwise fall back to Ollama
USE_OPENAI = bool(OPENAI_API_KEY)
