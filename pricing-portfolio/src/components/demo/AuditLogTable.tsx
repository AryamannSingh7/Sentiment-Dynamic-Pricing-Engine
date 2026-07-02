'use client';
import { motion } from 'framer-motion';
import type { AuditLog } from '@/lib/types';

interface Props {
  logs: AuditLog[];
}

function ConfidenceBadge({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const style = value >= 0.85 ? { background: 'var(--up-soft)',   color: 'var(--up)' }
              : value >= 0.70 ? { background: 'rgba(183,121,31,0.14)', color: 'var(--warn)' }
              :                 { background: 'var(--down-soft)', color: 'var(--down)' };
  return (
    <span className="px-1.5 py-0.5 rounded font-mono text-xs font-medium" style={style}>
      {pct}%
    </span>
  );
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60)  return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60)  return `${m}m ago`;
  const h = Math.floor(m / 60);
  return `${h}h ago`;
}

export default function AuditLogTable({ logs }: Props) {
  if (logs.length === 0) {
    return (
      <div className="panel p-6 text-center" style={{ color: 'var(--text-muted)' }}>
        No price adjustments yet — trigger an event above to see the audit trail.
      </div>
    );
  }

  return (
    <div className="panel overflow-hidden">
      <div className="overflow-auto" style={{ maxHeight: '280px' }}>
        <table className="w-full text-xs">
          <thead className="sticky top-0" style={{ background: 'var(--surface-2)' }}>
            <tr className="kicker" style={{ borderBottom: '1px solid var(--line)' }}>
              <th className="text-left p-3 font-medium">Time</th>
              <th className="text-left p-3 font-medium">Event</th>
              <th className="text-right p-3 font-medium">Prev $</th>
              <th className="text-right p-3 font-medium">New $</th>
              <th className="text-right p-3 font-medium">Δ</th>
              <th className="text-right p-3 font-medium">Mult.</th>
              <th className="text-right p-3 font-medium">Confidence</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log, i) => {
              const delta = Number(log.newPrice) - Number(log.previousPrice);
              const isUp  = delta >= 0;
              return (
                <motion.tr
                  key={log.auditId}
                  initial={i === 0 ? { opacity: 0, y: -8 } : false}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="border-t"
                  style={{
                    borderColor: 'var(--line)',
                    background: i === 0 ? 'var(--accent-soft)' : 'transparent',
                  }}
                >
                  <td className="p-3 whitespace-nowrap font-mono" style={{ color: 'var(--text-muted)' }}>
                    {relativeTime(log.appliedAt)}
                  </td>
                  <td className="p-3 max-w-[160px]">
                    <span
                      className="truncate block"
                      title={log.adjustmentReason}
                      style={{ color: 'var(--ink)' }}
                    >
                      {log.adjustmentReason}
                    </span>
                  </td>
                  <td className="p-3 text-right font-mono" style={{ color: 'var(--text-muted)' }}>
                    ${Number(log.previousPrice).toFixed(2)}
                  </td>
                  <td className="p-3 text-right font-mono font-medium" style={{ color: 'var(--ink)' }}>
                    ${Number(log.newPrice).toFixed(2)}
                  </td>
                  <td className="p-3 text-right font-mono font-semibold" style={{ color: isUp ? 'var(--up)' : 'var(--down)' }}>
                    {isUp ? '+' : ''}{delta.toFixed(2)}
                  </td>
                  <td className="p-3 text-right font-mono" style={{ color: 'var(--text-muted)' }}>
                    ×{Number(log.newMultiplier).toFixed(3)}
                  </td>
                  <td className="p-3 text-right">
                    <ConfidenceBadge value={log.confidence} />
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
