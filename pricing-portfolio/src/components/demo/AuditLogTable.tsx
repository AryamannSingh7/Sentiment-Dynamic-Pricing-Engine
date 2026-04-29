'use client';
import { motion } from 'framer-motion';
import type { AuditLog } from '@/lib/types';

interface Props {
  logs: AuditLog[];
}

function ConfidenceBadge({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color = value >= 0.85 ? 'bg-green-500/20 text-green-400'
              : value >= 0.70 ? 'bg-yellow-500/20 text-yellow-400'
              :                 'bg-red-500/20 text-red-400';
  return (
    <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${color}`}>
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
      <div className="glass-card p-6 text-center" style={{ color: 'var(--text-muted)' }}>
        No price adjustments yet — trigger an event above to see the audit trail.
      </div>
    );
  }

  return (
    <div className="glass-card overflow-hidden">
      <div className="overflow-auto" style={{ maxHeight: '280px' }}>
        <table className="w-full text-xs">
          <thead className="sticky top-0" style={{ background: 'rgba(10,10,15,0.9)' }}>
            <tr style={{ color: 'var(--text-muted)' }}>
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
                    borderColor: 'var(--border-card)',
                    background: i === 0 ? 'rgba(59,130,246,0.04)' : 'transparent',
                  }}
                >
                  <td className="p-3 whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
                    {relativeTime(log.appliedAt)}
                  </td>
                  <td className="p-3 max-w-[160px]">
                    <span
                      className="truncate block"
                      title={log.adjustmentReason}
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {log.adjustmentReason}
                    </span>
                  </td>
                  <td className="p-3 text-right" style={{ color: 'var(--text-muted)' }}>
                    ${Number(log.previousPrice).toFixed(2)}
                  </td>
                  <td className="p-3 text-right font-medium" style={{ color: 'var(--text-primary)' }}>
                    ${Number(log.newPrice).toFixed(2)}
                  </td>
                  <td className={`p-3 text-right font-semibold ${isUp ? 'text-green-400' : 'text-red-400'}`}>
                    {isUp ? '+' : ''}{delta.toFixed(2)}
                  </td>
                  <td className="p-3 text-right" style={{ color: 'var(--text-muted)' }}>
                    x{Number(log.newMultiplier).toFixed(3)}
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
