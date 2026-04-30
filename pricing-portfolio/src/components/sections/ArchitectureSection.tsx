'use client';
import { useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import GradientText from '@/components/ui/GradientText';

const TECH_CARDS = [
  { icon: '☕', name: 'Java 17 + Spring Boot 3.2', color: '#f97316', desc: 'REST API, Kafka consumer, optimistic locking' },
  { icon: '🍃', name: 'MongoDB Atlas',              color: '#22c55e', desc: 'Flexible document model, immutable audit log' },
  { icon: '🔀', name: 'Apache Kafka',               color: '#3b82f6', desc: 'Durable event streaming, at-least-once delivery' },
  { icon: '🐍', name: 'Python 3.11',                color: '#facc15', desc: 'Confluent-Kafka consumer, LLM integration' },
  { icon: '🤖', name: 'Groq / Ollama',              color: '#8b5cf6', desc: 'Groq in production, Ollama locally, llama-3.1-8b' },
  { icon: '🐳', name: 'Docker Compose',             color: '#06b6d4', desc: '6-container local stack, multi-stage builds' },
  { icon: '🎯', name: 'Render',                     color: '#ec4899', desc: 'Spring Boot + Python workers, free web services' },
  { icon: '▲',  name: 'Vercel',                     color: '#f1f5f9', desc: 'Next.js frontend, global CDN, instant deploys' },
];

function TechCard({ tech, index, inView }: { tech: typeof TECH_CARDS[0]; index: number; inView: boolean }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState('');

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x    = e.clientX - rect.left;
    const y    = e.clientY - rect.top;
    const rx   = ((y - rect.height / 2) / rect.height) * -12;
    const ry   = ((x - rect.width  / 2) / rect.width)  *  12;
    setTransform(`perspective(600px) rotateX(${rx}deg) rotateY(${ry}deg) scale(1.03)`);
  };

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: index * 0.07, duration: 0.45 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setTransform('')}
      className="glass-card p-4 cursor-default transition-shadow duration-200 hover:shadow-lg"
      style={{ transform, transition: transform ? 'transform 0.1s ease' : 'transform 0.4s ease', willChange: 'transform' }}
    >
      <div className="flex items-center gap-3 mb-2">
        <span className="text-2xl">{tech.icon}</span>
        <span className="text-xs font-bold" style={{ color: tech.color }}>{tech.name}</span>
      </div>
      <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>{tech.desc}</p>
    </motion.div>
  );
}

export default function ArchitectureSection({ id }: { id?: string }) {
  const ref    = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section id={id} ref={ref} className="py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Left — text */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Architecture <GradientText>Overview</GradientText>
            </h2>
            <div className="space-y-4 text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              <p>
                The engine follows an <strong style={{ color: 'var(--text-primary)' }}>event-driven microservices</strong> pattern.
                Market signals enter as Kafka events, flow through an AI sentiment scorer,
                and are applied to product prices by Spring Boot with full concurrency safety.
              </p>
              <p>
                Every price change is processed through <strong style={{ color: 'var(--text-primary)' }}>5 safety layers</strong>:
                idempotency check, rate-limit cooldown, delta cap, bounds guard, and optimistic
                locking with retries — guaranteeing correctness under concurrent load.
              </p>
              <p>
                The <strong style={{ color: 'var(--text-primary)' }}>immutable audit log</strong> in MongoDB
                records every adjustment with its source event ID, AI confidence score,
                reason, and timestamp — giving full traceability from signal to price.
              </p>
              <p>
                In production, events flow through <strong style={{ color: 'var(--text-primary)' }}>Redpanda</strong> (managed Kafka)
                into the AI consumer running on Render, which calls Groq to compute price
                adjustments. A demo trigger endpoint lets you fire events instantly from the UI.
              </p>
            </div>
          </motion.div>

          {/* Right — tech cards grid */}
          <div className="grid grid-cols-2 gap-3">
            {TECH_CARDS.map((tech, i) => (
              <TechCard key={tech.name} tech={tech} index={i} inView={inView} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
