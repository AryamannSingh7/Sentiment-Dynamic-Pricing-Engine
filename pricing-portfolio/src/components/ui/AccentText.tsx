import { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  className?: string;
}

/**
 * The emphasized word in a heading — rendered in the single brand accent
 * (amber in light, orange in dark), consistent with interactive accents.
 */
export default function AccentText({ children, className = '' }: Props) {
  return (
    <span className={className} style={{ color: 'var(--accent)' }}>
      {children}
    </span>
  );
}
