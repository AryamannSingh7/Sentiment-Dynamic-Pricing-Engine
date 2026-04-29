import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Sentiment-Aware Dynamic Pricing Engine | Aryamann Singh',
  description:
    'Real-time AI-powered dynamic pricing engine built with Java Spring Boot, Apache Kafka, MongoDB Atlas, and Python LLM. Live interactive demo.',
  openGraph: {
    title: 'Sentiment-Aware Dynamic Pricing Engine',
    description:
      'Live demo of event-driven dynamic pricing with 5 AI safety layers — Spring Boot · Kafka · MongoDB · Python LLM.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <body className={`${inter.variable} antialiased`}>
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#1a1a2e',
              color:      '#f1f5f9',
              border:     '1px solid rgba(255,255,255,0.10)',
              fontSize:   '13px',
            },
          }}
        />
      </body>
    </html>
  );
}
