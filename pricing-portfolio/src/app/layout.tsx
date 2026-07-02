import type { Metadata } from 'next';
import { Oxanium, Merriweather, Fira_Code } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import './globals.css';

const oxanium = Oxanium({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-oxanium',
});
const merriweather = Merriweather({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-merriweather',
});
const firaCode = Fira_Code({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-fira',
});

export const metadata: Metadata = {
  title: 'Sentiment-Aware Dynamic Pricing Engine | Aryamann Singh',
  description:
    'Real-time AI-powered dynamic pricing engine built with Java Spring Boot, Apache Kafka, MongoDB Atlas, and a Python LLM worker. Live interactive demo.',
  openGraph: {
    title: 'Sentiment-Aware Dynamic Pricing Engine',
    description:
      'Live demo of event-driven dynamic pricing with 5 safety layers — Spring Boot · Kafka · MongoDB · Python LLM.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${oxanium.variable} ${merriweather.variable} ${firaCode.variable}`}
    >
      <head>
        {/* Set the theme class before first paint to avoid a light→dark flash
            for returning dark-mode visitors. Kept dependency-free and inline. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{if(localStorage.getItem('theme')==='dark'){document.documentElement.classList.add('dark');}}catch(e){}})();",
          }}
        />
      </head>
      <body className="antialiased">
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: 'var(--surface)',
              color:      'var(--ink)',
              border:     '1px solid var(--line)',
              boxShadow:  'var(--shadow-lift)',
              fontSize:   '13px',
              fontFamily: 'var(--font-mono), monospace',
            },
          }}
        />
      </body>
    </html>
  );
}
