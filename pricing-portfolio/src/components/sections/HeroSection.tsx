'use client';
import { motion } from 'framer-motion';
import TypewriterText from '@/components/ui/TypewriterText';
import GradientText from '@/components/ui/GradientText';

const PHRASES = [
  'Real-time AI pricing',
  'Event-driven architecture',
  'Sub-second price updates',
  '5-layer safety pipeline',
];

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-4 overflow-hidden" style={{ paddingTop: 72 }}>

      {/* Decorative orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #3b82f6, transparent)', filter: 'blur(60px)' }} />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #8b5cf6, transparent)', filter: 'blur(60px)' }} />
      </div>

      {/* Floating price card */}
      <motion.div
        animate={{ y: [0, -12, 0] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
        className="glass-card px-5 py-3 mb-8 flex items-center gap-3"
      >
        <span className="live-dot w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
        <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>LIVE</span>
        <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
          Dynamic Pricing Engine
        </span>
        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-medium">
          Railway + Atlas
        </span>
      </motion.div>

      {/* Heading */}
      <motion.h1
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.6 }}
        className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6 max-w-4xl"
      >
        <GradientText>Sentiment-Aware</GradientText>
        <br />
        <span style={{ color: 'var(--text-primary)' }}>Dynamic Pricing Engine</span>
      </motion.h1>

      {/* Typewriter subtitle */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.5 }}
        className="text-lg md:text-xl mb-10 h-8"
        style={{ color: 'var(--text-muted)' }}
      >
        <TypewriterText phrases={PHRASES} />
      </motion.div>

      {/* Stack badges */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.5 }}
        className="flex flex-wrap justify-center gap-2 mb-10"
      >
        {['Java 17', 'Spring Boot', 'Apache Kafka', 'MongoDB', 'Python LLM', 'Docker'].map(tag => (
          <span
            key={tag}
            className="text-xs px-3 py-1 rounded-full border font-medium"
            style={{
              borderColor: 'var(--border-card)',
              background:  'var(--bg-card)',
              color:       'var(--text-muted)',
            }}
          >
            {tag}
          </span>
        ))}
      </motion.div>

      {/* CTAs */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45, duration: 0.5 }}
        className="flex flex-col sm:flex-row gap-4"
      >
        <a
          href="#demo"
          className="px-8 py-3 rounded-xl text-sm font-semibold text-white transition-all duration-200
            bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500
            hover:shadow-lg hover:shadow-blue-500/25"
        >
          Try the Demo →
        </a>
        <a
          href="https://github.com/AryamannSingh7/Sentiment-Dynamic-Pricing-Engine"
          target="_blank"
          rel="noopener noreferrer"
          className="px-8 py-3 rounded-xl text-sm font-semibold transition-all duration-200 border"
          style={{
            borderColor: 'var(--border-card)',
            background:  'var(--bg-card)',
            color:       'var(--text-primary)',
          }}
        >
          View on GitHub
        </a>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M5 8l5 5 5-5" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </motion.div>
    </section>
  );
}
