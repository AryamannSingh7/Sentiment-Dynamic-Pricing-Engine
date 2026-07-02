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
          stroke="var(--line)"
          strokeWidth="4"
        />
        {/* Progress */}
        <circle
          cx="36" cy="36" r={r}
          fill="none"
          stroke="var(--accent)"
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
          fill="var(--ink)"
          fontSize="14"
          fontWeight="600"
          fontFamily="var(--font-mono), monospace"
        >
          {seconds}s
        </text>
      </svg>
      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>cooldown</span>
    </div>
  );
}
