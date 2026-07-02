import { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  className?: string;
}

/**
 * ShinyBadge — a bordered pill with an animated shine sweep across the label
 * (21st.dev / magicui "animated shiny text" pattern), tuned to the ink palette.
 */
export default function ShinyBadge({ children, className = '' }: Props) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-mono ${className}`}
      style={{ borderColor: 'var(--line)', background: 'var(--surface)', boxShadow: 'var(--shadow-card)' }}
    >
      <span
        className="live-dot h-1.5 w-1.5 rounded-full"
        style={{ background: 'var(--up)' }}
      />
      <span className="shiny-text tracking-wide">{children}</span>
    </span>
  );
}
