'use client';

interface Props {
  seconds: number;
  total?: number;
}

export default function CooldownTimer({ seconds, total = 5 }: Props) {
  const r          = 28;
  const circumference = 2 * Math.PI * r;
  const progress   = seconds / total;
  const dashOffset = circumference * (1 - progress);

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="72" height="72" viewBox="0 0 72 72">
        {/* Track */}
        <circle
          cx="36" cy="36" r={r}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="4"
        />
        {/* Progress */}
        <circle
          cx="36" cy="36" r={r}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          transform="rotate(-90 36 36)"
          style={{ transition: 'stroke-dashoffset 0.9s linear' }}
        />
        {/* Label */}
        <text
          x="36" y="36"
          textAnchor="middle"
          dominantBaseline="central"
          fill="#f1f5f9"
          fontSize="14"
          fontWeight="600"
        >
          {seconds}s
        </text>
      </svg>
      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>cooldown</span>
    </div>
  );
}
