'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const NAV_LINKS = [
  { label: 'Demo',         href: '#demo'         },
  { label: 'Pipeline',     href: '#pipeline'     },
  { label: 'Architecture', href: '#architecture' },
  { label: 'Tech',         href: '#tech'         },
  { label: 'Video',        href: '#video'        },
];

const NAVBAR_HEIGHT   = 68;   // px
const SCROLL_DURATION = 900;  // ms

function easeInOutQuart(t: number): number {
  return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;
}

function smoothScrollTo(id: string) {
  const el = document.querySelector(id);
  if (!el) return;
  const targetY  = el.getBoundingClientRect().top + window.scrollY - NAVBAR_HEIGHT - 8;
  const startY   = window.scrollY;
  const distance = targetY - startY;
  if (Math.abs(distance) < 2) return;

  const startTime = performance.now();
  function step(now: number) {
    const elapsed  = now - startTime;
    const progress = Math.min(elapsed / SCROLL_DURATION, 1);
    window.scrollTo(0, startY + distance * easeInOutQuart(progress));
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

export default function Navbar() {
  const [dark, setDark]         = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive]     = useState('');

  useEffect(() => {
    const isDark = localStorage.getItem('theme') === 'dark';
    setDark(isDark);
    document.documentElement.classList.toggle('dark', isDark);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  };

  const handleNav = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setActive(href);
    smoothScrollTo(href);
  };

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        height:         `${NAVBAR_HEIGHT}px`,
        background:     scrolled ? 'color-mix(in srgb, var(--surface) 82%, transparent)' : 'transparent',
        backdropFilter: scrolled ? 'blur(16px) saturate(140%)' : 'none',
        borderBottom:   `1px solid ${scrolled ? 'var(--line)' : 'transparent'}`,
      }}
    >
      <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
        {/* Wordmark */}
        <a href="#" className="flex items-center gap-2 select-none">
          <span
            className="grid place-items-center h-7 w-7 rounded-md font-mono text-sm font-bold"
            style={{ background: 'var(--ink)', color: 'var(--surface)' }}
          >
            ₽
          </span>
          <span className="font-display text-sm font-semibold tracking-tight" style={{ color: 'var(--ink)' }}>
            Pricing<span style={{ color: 'var(--accent)' }}>Desk</span>
          </span>
        </a>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((l) => {
            const isActive = active === l.href;
            return (
              <a
                key={l.href}
                href={l.href}
                onClick={(e) => handleNav(e, l.href)}
                className="relative px-3.5 py-2 rounded-lg font-mono text-xs tracking-wide transition-colors duration-150"
                style={{ color: isActive ? 'var(--accent)' : 'var(--muted)' }}
              >
                {l.label}
                {isActive && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-lg"
                    style={{ background: 'var(--accent-soft)', zIndex: -1 }}
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  />
                )}
              </a>
            );
          })}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="w-9 h-9 rounded-lg grid place-items-center transition-colors duration-150 border"
            style={{ borderColor: 'var(--line)', color: 'var(--ink-soft)' }}
            title="Toggle theme"
            aria-label="Toggle color theme"
          >
            <span className="text-sm">{dark ? '☀' : '☾'}</span>
          </button>

          <a
            href="https://github.com/AryamannSingh7/Sentiment-Dynamic-Pricing-Engine"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium border transition-colors duration-150"
            style={{ borderColor: 'var(--line-strong)', color: 'var(--ink)', background: 'var(--surface)' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
            </svg>
            GitHub
          </a>

          <a
            href="https://github.com/AryamannSingh7/Sentiment-Dynamic-Pricing-Engine"
            target="_blank"
            rel="noopener noreferrer"
            className="flex sm:hidden w-9 h-9 items-center justify-center rounded-lg border"
            style={{ borderColor: 'var(--line)', color: 'var(--ink-soft)' }}
            aria-label="GitHub repository"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
            </svg>
          </a>
        </div>
      </div>
    </nav>
  );
}
