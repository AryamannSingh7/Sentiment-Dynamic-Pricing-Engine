'use client';
import { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  reverse?: boolean;
  duration?: string;
  pauseOnHover?: boolean;
  className?: string;
}

/**
 * Marquee — a seamless horizontal auto-scroller (21st.dev / magicui pattern),
 * used here as the live market ticker. Renders the children twice so the loop
 * has no visible seam; the second copy is hidden from assistive tech.
 */
export default function Marquee({
  children,
  reverse = false,
  duration = '42s',
  pauseOnHover = true,
  className = '',
}: Props) {
  const track = reverse ? 'animate-marquee-reverse' : 'animate-marquee';
  return (
    <div className={`group flex w-full overflow-hidden ${className}`}>
      {[0, 1].map((i) => (
        <div
          key={i}
          aria-hidden={i === 1}
          className={`flex shrink-0 items-center gap-8 pr-8 ${track} ${
            pauseOnHover ? 'group-hover:[animation-play-state:paused]' : ''
          }`}
          style={{ ['--duration' as string]: duration, ['--gap' as string]: '2rem' }}
        >
          {children}
        </div>
      ))}
    </div>
  );
}
