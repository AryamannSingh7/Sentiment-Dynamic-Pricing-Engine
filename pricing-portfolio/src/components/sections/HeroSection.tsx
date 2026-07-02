'use client';
import { motion } from 'framer-motion';
import Marquee from '@/components/ui/Marquee';
import ShinyBadge from '@/components/ui/ShinyBadge';
import AccentText from '@/components/ui/AccentText';

/* Ticker signals — the market events the engine actually watches */
const TICKER = [
  { sym: 'SOCIAL_TREND',   move: +8.0, unit: '%' },
  { sym: 'COMPETITOR_DROP', move: -12.0, unit: '%' },
  { sym: 'REVIEW_SURGE',   move: +12.0, unit: '%' },
  { sym: 'NEWS_POSITIVE',  move: +15.0, unit: '%' },
  { sym: 'PRICE_SURGE',    move: +10.0, unit: '%' },
  { sym: 'NEWS_NEGATIVE',  move: -15.0, unit: '%' },
  { sym: 'SOCIAL_TREND',   move: -8.0, unit: '%' },
  { sym: 'REVIEW_SURGE',   move: -10.0, unit: '%' },
];

const STACK = ['Java 17', 'Spring Boot', 'Apache Kafka', 'MongoDB', 'Python LLM', 'Docker'];

function TickerRow() {
  return (
    <Marquee duration="46s" className="py-2.5">
      {TICKER.map((t, i) => {
        const up = t.move >= 0;
        return (
          <span key={i} className="inline-flex items-center gap-2 font-mono text-xs">
            <span style={{ color: 'var(--muted)' }}>{t.sym}</span>
            <span style={{ color: up ? 'var(--up)' : 'var(--down)' }}>
              {up ? '▲' : '▼'} {up ? '+' : ''}{t.move.toFixed(1)}{t.unit}
            </span>
            <span style={{ color: 'var(--line-strong)' }}>·</span>
          </span>
        );
      })}
    </Marquee>
  );
}

/* The hero showpiece: a live pricing instrument */
function InstrumentPanel() {
  const base = 199.99;
  const current = 229.99;
  const multiplier = 1.15;
  const delta = current - base;
  const gaugePct = ((multiplier - 0.5) / 1.5) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="panel p-6 w-full max-w-md"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="kicker">SKU · WH-24-ANC</p>
          <p className="text-sm font-semibold mt-1" style={{ color: 'var(--ink)' }}>
            Wireless Headphones
          </p>
        </div>
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-mono font-medium"
          style={{ background: 'var(--up-soft)', color: 'var(--up)' }}
        >
          <span className="live-dot h-1.5 w-1.5 rounded-full" style={{ background: 'var(--up)' }} />
          LIVE
        </span>
      </div>

      <div className="mt-5 flex items-end gap-3">
        <span className="font-mono text-4xl font-semibold tracking-tight" style={{ color: 'var(--ink)' }}>
          ${current.toFixed(2)}
        </span>
        <span className="font-mono text-sm mb-1" style={{ color: 'var(--up)' }}>
          ▲ +{delta.toFixed(2)}
        </span>
      </div>
      <p className="kicker mt-1">base ${base.toFixed(2)} · applied via kafka pipeline</p>

      {/* Bounded multiplier gauge — the domain's core invariant */}
      <div className="mt-6">
        <div className="flex justify-between font-mono text-xs mb-2">
          <span style={{ color: 'var(--muted)' }}>MULTIPLIER</span>
          <span style={{ color: 'var(--up)' }}>×{multiplier.toFixed(3)}</span>
        </div>
        <div className="relative h-2 rounded-full" style={{ background: 'var(--surface-2)', border: '1px solid var(--line)' }}>
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{ background: 'var(--up)' }}
            initial={{ width: '33%' }}
            animate={{ width: `${gaugePct}%` }}
            transition={{ delay: 0.5, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          />
          {/* neutral 1.00× tick */}
          <span className="absolute top-1/2 h-3 w-px -translate-y-1/2" style={{ left: '33.33%', background: 'var(--line-strong)' }} />
        </div>
        <div className="flex justify-between font-mono text-[10px] mt-1.5" style={{ color: 'var(--muted)' }}>
          <span>0.50×</span>
          <span>1.00×</span>
          <span>2.00×</span>
        </div>
      </div>

      {/* Mini safety-layer trace */}
      <div className="mt-6 grid grid-cols-5 gap-1.5">
        {['idem', 'cool', 'delta', 'bounds', 'lock'].map((l, i) => (
          <div key={l} className="flex flex-col items-center gap-1.5">
            <motion.span
              className="h-1.5 w-full rounded-full"
              style={{ background: 'var(--up)' }}
              initial={{ opacity: 0.15 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 + i * 0.12, duration: 0.3 }}
            />
            <span className="font-mono text-[9px]" style={{ color: 'var(--muted)' }}>{l}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

export default function HeroSection() {
  return (
    <section className="relative px-6 pt-32 pb-16 overflow-hidden">
      <div className="max-w-7xl mx-auto w-full">
        <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-14 items-center">
          {/* Left — the statement */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <ShinyBadge>Live engine · Render + MongoDB Atlas</ShinyBadge>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08, duration: 0.6 }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.05] mt-6"
              style={{ color: 'var(--ink)' }}
            >
              Prices that read
              <br />
              the market in <AccentText>real time</AccentText>.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="mt-6 text-base md:text-lg leading-relaxed max-w-xl"
              style={{ color: 'var(--ink-soft)' }}
            >
              An event-driven pricing engine. Market signals flow through Kafka into a
              Python LLM worker, and Spring Boot applies the result to MongoDB — with{' '}
              <strong style={{ color: 'var(--ink)' }}>five safety layers</strong> standing between
              any signal and a price change.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="mt-8 flex flex-col sm:flex-row gap-3"
            >
              <a
                href="#demo"
                className="px-6 py-3 rounded-xl text-sm font-semibold transition-transform duration-150 hover:-translate-y-0.5"
                style={{ background: 'var(--ink)', color: 'var(--surface)' }}
              >
                Open the live demo →
              </a>
              <a
                href="https://github.com/AryamannSingh7/Sentiment-Dynamic-Pricing-Engine"
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 rounded-xl text-sm font-semibold border transition-colors duration-150"
                style={{ borderColor: 'var(--line-strong)', background: 'var(--surface)', color: 'var(--ink)' }}
              >
                View source
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.42, duration: 0.5 }}
              className="mt-8 flex flex-wrap gap-x-4 gap-y-2"
            >
              {STACK.map((t) => (
                <span key={t} className="font-mono text-xs" style={{ color: 'var(--muted)' }}>
                  {t}
                </span>
              ))}
            </motion.div>
          </div>

          {/* Right — the instrument */}
          <div className="flex justify-center lg:justify-end">
            <InstrumentPanel />
          </div>
        </div>
      </div>

      {/* Signature: the market ticker */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.6 }}
        className="mt-16 border-y"
        style={{ borderColor: 'var(--line)', background: 'var(--surface)' }}
      >
        <div className="max-w-7xl mx-auto flex items-center">
          <span className="kicker shrink-0 pl-6 pr-4 py-2.5 border-r" style={{ borderColor: 'var(--line)' }}>
            Signals
          </span>
          <div className="overflow-hidden">
            <TickerRow />
          </div>
        </div>
      </motion.div>
    </section>
  );
}
