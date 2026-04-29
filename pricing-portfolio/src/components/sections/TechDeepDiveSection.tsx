'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GradientText from '@/components/ui/GradientText';

const TABS = [
  {
    id:      'java',
    label:   '☕ Java + Spring Boot',
    content: [
      {
        q: 'Why Java 17 + Spring Boot 3.2?',
        a: 'Spring Boot gives production-grade REST endpoints, Kafka integration, and MongoDB support with zero boilerplate. The @Version-based optimistic locking in Spring Data MongoDB is a first-class feature that prevents price corruption under concurrent writes — something that would require custom logic in most frameworks.',
      },
      {
        q: 'How does optimistic locking work here?',
        a: 'The Product entity has a @Version field (Long). On every save(), MongoDB checks that the stored version matches what we read. If another thread updated the product between our read and write, the version mismatches and Spring throws OptimisticLockingFailureException. ProductService retries up to 3× — re-reading the latest state each time.',
      },
      {
        q: 'Why not use a transaction?',
        a: "MongoDB multi-document transactions require a replica set and add significant latency. Since the product write and audit log write are idempotent by design (the audit log's unique index on adjustmentEventId prevents duplicates), at-least-once delivery with retry is safer and faster than distributed transactions.",
      },
    ],
  },
  {
    id:      'kafka',
    label:   '🔀 Apache Kafka',
    content: [
      {
        q: 'Why Kafka instead of a simple queue?',
        a: "Kafka's log-based storage means events are durable and replayable — if the pricing service is down, events buffer and replay from offset. SQS/RabbitMQ would drop events. Kafka also partitions by productId, guaranteeing that events for the same product are processed in order.",
      },
      {
        q: 'What is AckMode.MANUAL and why use it?',
        a: "AckMode.MANUAL means the Kafka offset is only committed after the DB write and audit log write both succeed. If the app crashes mid-processing, the event is redelivered. Auto-commit would advance the offset before the write completes, causing silent data loss on crash.",
      },
      {
        q: 'How many partitions and why 3?',
        a: "3 partitions allow up to 3 parallel consumer instances without rebalancing costs. With 3 products in the demo, each product's events land on its own partition (keyed by productId), achieving perfect parallelism. Scaling to more products just means adding partitions.",
      },
    ],
  },
  {
    id:      'mongo',
    label:   '🍃 MongoDB',
    content: [
      {
        q: 'Why MongoDB instead of PostgreSQL?',
        a: "The product schema evolves as features are added (tags, metadata, sentiment fields). MongoDB's schema-less documents mean zero migration pain. The price_audit_log collection is append-only with a unique index on adjustmentEventId — this is idiomatic MongoDB and performs extremely well for write-heavy audit tables.",
      },
      {
        q: 'What indexes are in place?',
        a: 'products: unique index on productId (lookup by business key), index on status (getProducts() filter), index on category (category filter). price_audit_log: unique index on adjustmentEventId (idempotency), index on productId (getAuditLog() query). All created automatically via auto-index-creation: true.',
      },
      {
        q: 'Why auto-index-creation in prod?',
        a: "For a portfolio project this is fine. In a real production system you'd disable auto-index-creation and manage indexes via migrations (Mongock/Liquibase) so index builds don't block collection scans on hot collections during deploys.",
      },
    ],
  },
  {
    id:      'llm',
    label:   '🤖 Python + LLM',
    content: [
      {
        q: 'Why Python for the AI consumer?',
        a: "The LLM ecosystem — OpenAI SDK, Ollama client, Pydantic validation — is first-class in Python. Java LLM libraries are catching up but Python is the industry standard for AI/ML integration. Separating the AI consumer as its own service also means it can be scaled, replaced, or upgraded independently.",
      },
      {
        q: 'How does the LLM produce structured output?',
        a: "The system prompt instructs the model to respond only with valid JSON matching the PricingRecommendation schema (sentiment_score, price_multiplier, adjustment_reason, confidence). The response is parsed and validated by Pydantic. If parsing fails, the event is retried. In prod, structured output APIs (OpenAI response_format) enforce JSON at the API level.",
      },
      {
        q: 'Why Ollama for local testing?',
        a: "OpenRouter's free tier limits to 8 req/min — too slow for pipeline testing. Ollama runs llama3.2:1b locally at ~60 tokens/s, making the full pipeline runnable offline. The OPENAI_API_KEY env var switches between backends transparently: set it for OpenAI/OpenRouter, leave it blank for Ollama.",
      },
    ],
  },
];

export default function TechDeepDiveSection({ id }: { id?: string }) {
  const [activeTab, setActiveTab] = useState('java');
  const active = TABS.find(t => t.id === activeTab)!;

  return (
    <section id={id} className="py-24 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-3">
            Tech <GradientText>Deep Dive</GradientText>
          </h2>
          <p style={{ color: 'var(--text-muted)' }} className="text-sm">
            The why behind every technology choice
          </p>
        </div>

        {/* Tab bar */}
        <div className="flex flex-wrap gap-2 mb-8 justify-center">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-medium border transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-blue-500/20 border-blue-500/40 text-blue-400'
                  : 'border-white/10 hover:border-white/20'
              }`}
              style={activeTab !== tab.id ? { color: 'var(--text-muted)' } : {}}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
            className="space-y-4"
          >
            {active.content.map(item => (
              <div key={item.q} className="glass-card p-5">
                <p className="text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                  {item.q}
                </p>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  {item.a}
                </p>
              </div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
