import GradientText from '@/components/ui/GradientText';

export default function Footer() {
  return (
    <footer className="py-16 px-4 border-t" style={{ borderColor: 'var(--border-card)' }}>
      <div className="max-w-4xl mx-auto text-center space-y-6">
        <h3 className="text-2xl font-bold">
          Built by <GradientText>Aryamann Singh</GradientText>
        </h3>
        <p className="text-sm" style={{ color: 'var(--text-muted)', maxWidth: 480, margin: '0 auto' }}>
          Full-stack engineer passionate about distributed systems, AI integration, and clean architecture.
        </p>

        {/* GitHub CTA */}
        <a
          href="https://github.com/AryamannSingh7/Sentiment-Dynamic-Pricing-Engine"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-semibold text-white
            bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500
            transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/25"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
          </svg>
          View Source on GitHub
        </a>

        {/* Social links */}
        <div className="flex justify-center gap-4 pt-2">
          <a
            href="https://github.com/AryamannSingh7"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs transition-colors hover:text-blue-400"
            style={{ color: 'var(--text-muted)' }}
          >
            GitHub
          </a>
          <span style={{ color: 'var(--text-muted)', opacity: 0.3 }}>·</span>
          <a
            href="https://www.linkedin.com/in/aryamann-singh"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs transition-colors hover:text-blue-400"
            style={{ color: 'var(--text-muted)' }}
          >
            LinkedIn
          </a>
          <span style={{ color: 'var(--text-muted)', opacity: 0.3 }}>·</span>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            aryamann.singh21@gmail.com
          </span>
        </div>

        <p className="text-xs pt-4" style={{ color: 'var(--text-muted)', opacity: 0.4 }}>
          Sentiment-Aware Dynamic Pricing Engine · Java · Kafka · MongoDB · Python · LLM
        </p>
      </div>
    </footer>
  );
}
