'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import GradientText from '@/components/ui/GradientText';

const NAV_LINKS = [
  { label: 'Demo',         href: '#demo'         },
  { label: 'Pipeline',     href: '#pipeline'     },
  { label: 'Architecture', href: '#architecture' },
  { label: 'Tech Stack',   href: '#tech'         },
  { label: 'Video',        href: '#video'        },
];

const NAVBAR_HEIGHT  = 72;  // px — matches nav height
const SCROLL_DURATION = 900; // ms — feel free to tune

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
  const [dark, setDark]         = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive]     = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('theme');
    const isDark = stored !== 'light';
    setDark(isDark);
    document.documentElement.classList.toggle('light', !isDark);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('light', !next);
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
        background:     scrolled ? 'rgba(10,10,15,0.88)' : 'transparent',
        backdropFilter: scrolled ? 'blur(24px)' : 'none',
        borderBottom:   scrolled ? '1px solid var(--border-card)' : '1px solid transparent',
      }}
    >
      <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
        {/* Logo */}
        <a href="#" className="text-base font-bold tracking-tight select-none">
          <GradientText>Pricing Engine</GradientText>
        </a>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map(l => {
            const isActive = active === l.href;
            return (
              <motion.a
                key={l.href}
                href={l.href}
                onClick={(e) => handleNav(e, l.href)}
                whileTap={{ scale: 0.92 }}
                whileHover={{ scale: 1.04 }}
                className={`
                  relative px-4 py-2 rounded-lg text-sm font-medium
                  transition-colors duration-150 select-none
                  ${isActive ? 'text-blue-400' : 'hover:text-blue-400'}
                `}
                style={{ color: isActive ? undefined : 'var(--text-muted)' }}
              >
                {l.label}
                {isActive && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-lg bg-blue-500/10"
                    style={{ zIndex: -1 }}
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  />
                )}
              </motion.a>
            );
          })}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Theme toggle */}
          <motion.button
            onClick={toggleTheme}
            whileTap={{ scale: 0.88, rotate: 20 }}
            whileHover={{ scale: 1.08 }}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors duration-150 hover:bg-white/10"
            title="Toggle theme"
          >
            <span className="text-base">{dark ? '☀️' : '🌙'}</span>
          </motion.button>

          {/* GitHub */}
          <motion.a
            href="https://github.com/AryamannSingh7/Sentiment-Dynamic-Pricing-Engine"
            target="_blank"
            rel="noopener noreferrer"
            whileTap={{ scale: 0.93 }}
            whileHover={{ scale: 1.04 }}
            className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all duration-150 hover:border-blue-500/40 hover:bg-blue-500/10"
            style={{ borderColor: 'var(--border-card)', color: 'var(--text-muted)' }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
            </svg>
            GitHub
          </motion.a>

          {/* Mobile hamburger placeholder — links hidden on mobile, just show GitHub icon */}
          <motion.a
            href="https://github.com/AryamannSingh7/Sentiment-Dynamic-Pricing-Engine"
            target="_blank"
            rel="noopener noreferrer"
            whileTap={{ scale: 0.9 }}
            className="flex sm:hidden w-9 h-9 items-center justify-center rounded-xl hover:bg-white/10 transition-colors"
            style={{ color: 'var(--text-muted)' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
            </svg>
          </motion.a>
        </div>
      </div>
    </nav>
  );
}
