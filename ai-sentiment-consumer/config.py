import os

KAFKA_BOOTSTRAP          = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")
CONSUMER_GROUP           = "ai-sentiment-group"
RAW_TOPIC                = "raw-sentiment-events"
ADJUSTMENT_TOPIC         = "price-adjustment-events"
POLL_INTERVAL_MS         = int(os.getenv("AI_CONSUMER_POLL_INTERVAL_MS", "1000"))

# SASL credentials — set for cloud Kafka (Redpanda), leave empty for local
KAFKA_SASL_USERNAME      = os.getenv("KAFKA_SASL_USERNAME", "")
KAFKA_SASL_PASSWORD      = os.getenv("KAFKA_SASL_PASSWORD", "")
USE_SASL                 = bool(KAFKA_SASL_USERNAME)

# Groq — takes priority when GROQ_API_KEY is set (deployed mode)
GROQ_API_KEY             = os.getenv("GROQ_API_KEY", "")
GROQ_BASE_URL            = "https://api.groq.com/openai/v1"
GROQ_MODEL               = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")

# OpenAI — used when OPENAI_API_KEY is set and GROQ_API_KEY is not
OPENAI_API_KEY           = os.getenv("OPENAI_API_KEY", "")
OPENAI_BASE_URL          = os.getenv("OPENAI_BASE_URL", "")   # empty = standard OpenAI
OPENAI_MODEL             = os.getenv("OPENAI_MODEL", "meta-llama/llama-3.2-3b-instruct:free")

# Ollama — local fallback when neither Groq nor OpenAI key is set
OLLAMA_BASE_URL          = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL             = os.getenv("OLLAMA_MODEL", "llama3")

# Priority: Groq > OpenAI > Ollama
USE_GROQ   = bool(GROQ_API_KEY)
USE_OPENAI = bool(OPENAI_API_KEY) and not USE_GROQ

# Set MOCK_LLM=true to skip real LLM calls (useful for pipeline testing)
MOCK_LLM = os.getenv("MOCK_LLM", "false").lower() == "true"
