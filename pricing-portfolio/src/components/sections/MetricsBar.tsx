'use client';
import AnimatedNumber from '@/components/ui/AnimatedNumber';
import type { AuditLog, Product } from '@/lib/types';

interface Props {
  products:  Product[];
  auditLogs: AuditLog[];
}

export default function MetricsBar({ products, auditLogs }: Props) {
  const totalAdjustments = auditLogs.length;

  const avgMultiplier = products.length
    ? products.reduce((s, p) => s + Number(p.priceMultiplier), 0) / products.length
    : 1;

  const recentLogs    = auditLogs.slice(0, 10);
  const avgConfidence = recentLogs.length
    ? recentLogs.reduce((s, l) => s + l.confidence, 0) / recentLogs.length
    : 0;

  const topSignal = (() => {
    if (!auditLogs.length) return '—';
    const counts: Record<string, number> = {};
    auditLogs.slice(0, 20).forEach(l => {
      const key = l.adjustmentReason.split(' ').slice(0, 2).join(' ');
      counts[key] = (counts[key] ?? 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—';
  })();

  const metrics = [
    {
      label: 'Total Adjustments',
      value: <AnimatedNumber value={totalAdjustments} className="text-xl font-bold" />,
    },
    {
      label: 'Avg Multiplier',
      value: (
        <AnimatedNumber
          value={avgMultiplier}
          format={(n) => `×${n.toFixed(3)}`}
          className="text-xl font-bold"
        />
      ),
    },
    {
      label: 'Avg Confidence',
      value: (
        <AnimatedNumber
          value={avgConfidence * 100}
          format={(n) => `${Math.round(n)}%`}
          className="text-xl font-bold"
        />
      ),
    },
    {
      label: 'Top Signal',
      value: <span className="text-sm font-semibold truncate max-w-[140px] block" style={{ color: 'var(--text-primary)' }}>{topSignal}</span>,
    },
  ];

  return (
    <div
      className="sticky top-0 z-40 border-b"
      style={{
        background:   'rgba(10,10,15,0.85)',
        backdropFilter: 'blur(20px)',
        borderColor:  'var(--border-card)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 py-3 grid grid-cols-2 md:grid-cols-4 gap-4">
        {metrics.map(m => (
          <div key={m.label} className="flex flex-col items-center text-center">
            {m.value}
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{m.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
