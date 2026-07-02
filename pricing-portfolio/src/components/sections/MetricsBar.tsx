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

  const numberCls = 'font-mono text-xl font-semibold';
  const metrics = [
    {
      label: 'Total Adjustments',
      value: <AnimatedNumber value={totalAdjustments} className={numberCls} />,
    },
    {
      label: 'Avg Multiplier',
      value: (
        <AnimatedNumber
          value={avgMultiplier}
          format={(n) => `×${n.toFixed(3)}`}
          className={numberCls}
        />
      ),
    },
    {
      label: 'Avg Confidence',
      value: (
        <AnimatedNumber
          value={avgConfidence * 100}
          format={(n) => `${Math.round(n)}%`}
          className={numberCls}
        />
      ),
    },
    {
      label: 'Top Signal',
      value: <span className="font-mono text-sm font-semibold truncate max-w-[140px] block" style={{ color: 'var(--ink)' }}>{topSignal}</span>,
    },
  ];

  return (
    <div
      className="sticky top-[68px] z-40 border-b"
      style={{
        background:     'color-mix(in srgb, var(--surface) 85%, transparent)',
        backdropFilter: 'blur(16px) saturate(140%)',
        borderColor:    'var(--line)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 py-3 grid grid-cols-2 md:grid-cols-4 gap-4">
        {metrics.map((m, i) => (
          <div
            key={m.label}
            className={`flex flex-col items-center text-center ${i > 0 ? 'md:border-l' : ''}`}
            style={{ color: 'var(--ink)', borderColor: 'var(--line)' }}
          >
            {m.value}
            <p className="kicker mt-1">{m.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
