'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const LAYERS = [
  { name: 'Idempotency Check',  desc: 'Duplicate event detection via unique adjustmentEventId' },
  { name: 'Cooldown Guard',     desc: '5s rate limit between price updates per product' },
  { name: 'Delta Cap',          desc: 'Single event moves multiplier at most ±0.25' },
  { name: 'Bounds Guard',       desc: 'Multiplier clamped to [0.50, 2.00] of base price' },
  { name: 'Optimistic Lock',    desc: '@Version field — retries up to 3× on conflict' },
];

interface Props {
  lastTriggerTime: number | null;
}

export default function SafetyLayerVisualizer({ lastTriggerTime }: Props) {
  const [activeLayer, setActiveLayer] = useState<number>(-1);

  useEffect(() => {
    if (lastTriggerTime === null) return;
    setActiveLayer(-1);
    const timeouts: ReturnType<typeof setTimeout>[] = [];
    LAYERS.forEach((_, i) => {
      timeouts.push(setTimeout(() => setActiveLayer(i), i * 320 + 100));
    });
    return () => timeouts.forEach(clearTimeout);
  }, [lastTriggerTime]);

  return (
    <div className="glass-card p-4 space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>
        Safety Layers
      </p>
      {LAYERS.map((layer, i) => {
        const active = i <= activeLayer;
        return (
          <div key={layer.name} className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <AnimatePresence mode="wait">
                {active ? (
                  <motion.div
                    key="check"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center"
                  >
                    <span className="text-green-400 text-xs">✓</span>
                  </motion.div>
                ) : (
                  <motion.div
                    key="dot"
                    className="w-5 h-5 rounded-full border border-white/10"
                    style={{ background: 'rgba(255,255,255,0.03)' }}
                  />
                )}
              </AnimatePresence>
            </div>
            <div>
              <p className={`text-xs font-medium transition-colors duration-300 ${active ? 'text-green-400' : ''}`}
                 style={!active ? { color: 'var(--text-muted)' } : {}}>
                {layer.name}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)', opacity: 0.7 }}>
                {layer.desc}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
