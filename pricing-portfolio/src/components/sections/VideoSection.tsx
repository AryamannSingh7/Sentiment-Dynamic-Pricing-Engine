import GradientText from '@/components/ui/GradientText';

export default function VideoSection({ id }: { id?: string }) {
  return (
    <section id={id} className="py-24 px-4">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          See It In <GradientText>Action</GradientText>
        </h2>
        <p className="text-sm mb-10" style={{ color: 'var(--text-muted)' }}>
          A 2-minute walkthrough of the full end-to-end pipeline
        </p>

        {/* Replace src with your YouTube/Loom embed URL */}
        <div
          className="glass-card overflow-hidden mx-auto"
          style={{ maxWidth: 720, aspectRatio: '16/9', position: 'relative' }}
        >
          {/* Placeholder until video is recorded */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
            <span className="text-6xl">🎬</span>
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Demo video coming soon</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Replace this placeholder in VideoSection.tsx with your YouTube/Loom embed
            </p>
          </div>

          {/*
            Once recorded, replace the div above with:
            <iframe
              src="https://www.youtube.com/embed/YOUR_VIDEO_ID"
              title="Sentiment Dynamic Pricing Engine Demo"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 w-full h-full border-0"
            />
          */}
        </div>
      </div>
    </section>
  );
}
