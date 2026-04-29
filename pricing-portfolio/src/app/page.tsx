'use client';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import HeroSection from '@/components/sections/HeroSection';
import MetricsBar from '@/components/sections/MetricsBar';
import LiveDemoSection from '@/components/sections/LiveDemoSection';
import PipelineSection from '@/components/sections/PipelineSection';
import ArchitectureSection from '@/components/sections/ArchitectureSection';
import TechDeepDiveSection from '@/components/sections/TechDeepDiveSection';
import VideoSection from '@/components/sections/VideoSection';
import InteractiveBackground from '@/components/ui/InteractiveBackground';
import { useProducts } from '@/hooks/useProducts';
import { useAuditLog } from '@/hooks/useAuditLog';

function AppShell() {
  const { products }        = useProducts();
  const firstId             = products[0]?.productId ?? '';
  const { logs: auditLogs } = useAuditLog(firstId);

  return (
    <>
      <InteractiveBackground />
      <main className="relative min-h-screen" style={{ zIndex: 1 }}>
        <Navbar />
        <HeroSection />
        <MetricsBar products={products} auditLogs={auditLogs} />
        <LiveDemoSection id="demo" />
        <PipelineSection id="pipeline" />
        <ArchitectureSection id="architecture" />
        <TechDeepDiveSection id="tech" />
        <VideoSection id="video" />
        <Footer />
      </main>
    </>
  );
}

export default function Home() {
  return <AppShell />;
}
