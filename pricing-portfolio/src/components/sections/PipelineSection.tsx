'use client';
import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import GradientText from '@/components/ui/GradientText';

const NODES = [
  { icon: '📡', label: 'Market Signal',   desc: 'Social trends, competitor prices, news, reviews' },
  { icon: '⚡', label: 'Event Simulator', desc: 'Produces raw sentiment events to Kafka' },
  { icon: '🔀', label: 'Apache Kafka',    desc: '3-partition topic, ordered per product' },
  { icon: '🤖', label: 'AI / LLM',        desc: 'Python consumer, Ollama llama3.2 inference' },
  { icon: '☕', label: 'Spring Boot',     desc: '5-layer safety pipeline, optimistic locking' },
  { icon: '🍃', label: 'MongoDB Atlas',   desc: 'Products + immutable audit log collection' },
];

export default function PipelineSection({ id }: { id?: string }) {
  const ref    = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section id={id} ref={ref} className="py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold mb-3">
            How It <GradientText>Works</GradientText>
          </h2>
          <p className="text-base" style={{ color: 'var(--text-muted)' }}>
            An end-to-end event-driven pipeline from raw market signals to live price updates
          </p>
        </div>

        {/* Pipeline nodes */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-0">
          {NODES.map((node, i) => (
            <div key={node.label} className="flex flex-col md:flex-row items-center">
              {/* Node card */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: i * 0.12, duration: 0.5 }}
                className="glass-card p-4 flex flex-col items-center text-center w-36 flex-shrink-0 hover:ring-1 hover:ring-blue-500/30 transition-all duration-200"
              >
                <span className="text-3xl mb-2">{node.icon}</span>
                <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{node.label}</p>
                <p className="text-xs mt-1 leading-snug" style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>
                  {node.desc}
                </p>
              </motion.div>

              {/* Arrow between nodes */}
              {i < NODES.length - 1 && (
                <motion.div
                  initial={{ opacity: 0, scaleX: 0 }}
                  animate={inView ? { opacity: 1, scaleX: 1 } : {}}
                  transition={{ delay: i * 0.12 + 0.3, duration: 0.4 }}
                  className="flex items-center justify-center mx-1 flex-shrink-0"
                >
                  {/* Horizontal on md+, vertical on mobile */}
                  <svg
                    className="hidden md:block"
                    width="32" height="16" viewBox="0 0 32 16"
                  >
                    <defs>
                      <linearGradient id={`grad-${i}`} x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#3b82f6" />
                        <stop offset="100%" stopColor="#8b5cf6" />
                      </linearGradient>
                    </defs>
                    <path d="M 2 8 L 24 8" stroke={`url(#grad-${i})`} strokeWidth="1.5" strokeDasharray="4 2" />
                    <path d="M 22 5 L 28 8 L 22 11" fill="none" stroke="#8b5cf6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <svg
                    className="block md:hidden my-1"
                    width="16" height="24" viewBox="0 0 16 24"
                  >
                    <path d="M 8 2 L 8 18" stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="4 2" />
                    <path d="M 5 16 L 8 22 L 11 16" fill="none" stroke="#8b5cf6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </motion.div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
