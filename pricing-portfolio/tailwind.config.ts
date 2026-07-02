import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        paper:    "var(--paper)",
        surface:  "var(--surface)",
        ink:      "var(--ink)",
        "ink-soft": "var(--ink-soft)",
        muted:    "var(--muted)",
        line:     "var(--line)",
        accent:   "var(--accent)",
        up:       "var(--up)",
        down:     "var(--down)",
        warn:     "var(--warn)",
      },
      fontFamily: {
        sans:    ["var(--font-oxanium)", "Oxanium", "sans-serif"],
        serif:   ["var(--font-merriweather)", "Merriweather", "serif"],
        display: ["var(--font-merriweather)", "Merriweather", "serif"],
        mono:    ["var(--font-fira)", "Fira Code", "monospace"],
      },
      boxShadow: {
        card: "var(--shadow-card)",
        lift: "var(--shadow-lift)",
      },
    },
  },
  plugins: [],
};
export default config;
