'use client';

/**
 * A quiet engineering grid, masked to fade toward the edges. Replaces the
 * old floating-orb / mouse-spotlight atmosphere — the page should read like a
 * spec sheet, not a screensaver.
 */
export default function BackgroundGrid() {
  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }} aria-hidden>
      <div className="absolute inset-0 bg-grid opacity-70" />
    </div>
  );
}
