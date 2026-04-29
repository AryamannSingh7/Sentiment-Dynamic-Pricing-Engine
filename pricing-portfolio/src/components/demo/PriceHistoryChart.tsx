'use client';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ReferenceLine,
} from 'recharts';
import type { AuditLog } from '@/lib/types';

interface ChartPoint {
  index:      number;
  time:       string;
  price:      number;
  event:      string;
  confidence: number;
  direction:  'up' | 'down' | 'flat';
}

interface Props {
  logs:      AuditLog[];
  basePrice: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload as ChartPoint;
  if (!d) return null;

  const isUp = d.direction === 'up';

  return (
    <div
      style={{
        background:  'rgba(10,10,20,0.95)',
        border:      '1px solid rgba(255,255,255,0.12)',
        borderRadius: 12,
        padding:     '10px 14px',
        minWidth:    190,
        boxShadow:   '0 8px 32px rgba(0,0,0,0.4)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <p style={{ color: '#f1f5f9', fontWeight: 700, fontSize: 16, marginBottom: 4 }}>
        ${d.price.toFixed(2)}
        <span style={{ fontSize: 11, fontWeight: 500, marginLeft: 8, color: isUp ? '#22c55e' : '#ef4444' }}>
          {isUp ? '▲' : '▼'} {d.direction !== 'flat' ? '' : '—'}
        </span>
      </p>
      <p style={{ color: '#94a3b8', fontSize: 11, marginBottom: 2 }}>{d.time}</p>
      <p style={{ color: '#cbd5e1', fontSize: 11, marginBottom: 4, lineHeight: 1.4 }}>{d.event}</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ color: '#64748b', fontSize: 10 }}>Confidence</span>
        <span
          style={{
            fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 6,
            background: d.confidence >= 0.85 ? 'rgba(34,197,94,0.15)' : d.confidence >= 0.70 ? 'rgba(234,179,8,0.15)' : 'rgba(239,68,68,0.15)',
            color:      d.confidence >= 0.85 ? '#22c55e' : d.confidence >= 0.70 ? '#eab308' : '#ef4444',
          }}
        >
          {Math.round(d.confidence * 100)}%
        </span>
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomDot(props: any) {
  const { cx, cy, payload } = props;
  const isUp = payload.direction === 'up';
  const color = isUp ? '#22c55e' : '#ef4444';
  return (
    <g>
      <circle cx={cx} cy={cy} r={5} fill={color} fillOpacity={0.25} />
      <circle cx={cx} cy={cy} r={3} fill={color} stroke="#0a0a0f" strokeWidth={1.5} />
    </g>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomActiveDot(props: any) {
  const { cx, cy, payload } = props;
  const isUp = payload.direction === 'up';
  const color = isUp ? '#22c55e' : '#ef4444';
  return (
    <g>
      <circle cx={cx} cy={cy} r={10} fill={color} fillOpacity={0.15} />
      <circle cx={cx} cy={cy} r={6}  fill={color} fillOpacity={0.35} />
      <circle cx={cx} cy={cy} r={3}  fill={color} stroke="#fff" strokeWidth={1.5} />
    </g>
  );
}

export default function PriceHistoryChart({ logs, basePrice }: Props) {
  const data: ChartPoint[] = [...logs].reverse().map((log, i, arr) => {
    const prevPrice = i === 0 ? Number(log.previousPrice) : arr[i - 1] ? Number(arr[i - 1].newPrice) : basePrice;
    const cur       = Number(log.newPrice);
    return {
      index:      i,
      time:       new Date(log.appliedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      price:      cur,
      event:      log.adjustmentReason,
      confidence: log.confidence,
      direction:  cur > prevPrice ? 'up' : cur < prevPrice ? 'down' : 'flat',
    };
  });

  if (data.length === 0) {
    return (
      <div className="glass-card h-64 flex flex-col items-center justify-center gap-2" style={{ color: 'var(--text-muted)' }}>
        <span className="text-3xl">📈</span>
        <p className="text-sm">Trigger an event to see the price chart</p>
      </div>
    );
  }

  const prices    = data.map(d => d.price);
  const minPrice  = Math.min(...prices, basePrice) * 0.965;
  const maxPrice  = Math.max(...prices, basePrice) * 1.035;

  return (
    <div className="glass-card p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
          Price History
        </p>
        <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-400 inline-block" /> Up
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-400 inline-block" /> Down
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 4 }}>
          <defs>
            <linearGradient id="areaGradBlue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#3b82f6" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity={0}    />
            </linearGradient>
            <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%"   stopColor="#3b82f6" />
              <stop offset="50%"  stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#ec4899" />
            </linearGradient>
          </defs>

          <CartesianGrid
            stroke="rgba(255,255,255,0.05)"
            strokeDasharray="4 4"
            vertical={false}
          />

          <XAxis
            dataKey="time"
            tick={{ fill: 'var(--text-muted)', fontSize: 9 }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />

          <YAxis
            domain={[minPrice, maxPrice]}
            tick={{ fill: 'var(--text-muted)', fontSize: 9 }}
            tickFormatter={(v) => `$${v.toFixed(0)}`}
            tickLine={false}
            axisLine={false}
            width={52}
          />

          <Tooltip
            content={<CustomTooltip />}
            cursor={{ stroke: 'rgba(255,255,255,0.12)', strokeWidth: 1, strokeDasharray: '4 4' }}
          />

          <ReferenceLine
            y={basePrice}
            stroke="rgba(255,255,255,0.18)"
            strokeDasharray="5 4"
            label={{
              value:    `Base $${basePrice.toFixed(0)}`,
              fill:     'rgba(255,255,255,0.35)',
              fontSize: 9,
              position: 'insideTopRight',
            }}
          />

          <Area
            type="monotone"
            dataKey="price"
            stroke="url(#lineGrad)"
            strokeWidth={2.5}
            fill="url(#areaGradBlue)"
            dot={<CustomDot />}
            activeDot={<CustomActiveDot />}
            isAnimationActive
            animationDuration={600}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
