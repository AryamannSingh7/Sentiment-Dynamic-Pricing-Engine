'use client';
import { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import ProductPanel from '@/components/demo/ProductPanel';
import PriceHistoryChart from '@/components/demo/PriceHistoryChart';
import EventTriggerPanel from '@/components/demo/EventTriggerPanel';
import AuditLogTable from '@/components/demo/AuditLogTable';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import GradientText from '@/components/ui/GradientText';
import { useProducts } from '@/hooks/useProducts';
import { useAuditLog } from '@/hooks/useAuditLog';
import { useDemoTrigger } from '@/hooks/useDemoTrigger';
import type { EventType, Product } from '@/lib/types';

interface Props {
  id?: string;
}

export default function LiveDemoSection({ id }: Props) {
  const { products, loading: productsLoading, error: productsError, updateProduct } = useProducts();
  const [selectedId, setSelectedId]   = useState<string>('');
  const [lastTriggerTime, setLastTriggerTime] = useState<number | null>(null);

  const effectiveId = selectedId || products[0]?.productId || '';
  const { logs, loading: logsLoading, refresh: refreshLogs } = useAuditLog(effectiveId);

  const handleSuccess = useCallback((updated: Product) => {
    const prev = products.find(p => p.productId === updated.productId);
    updateProduct(updated);
    refreshLogs();
    setLastTriggerTime(Date.now());

    if (prev) {
      const prevPrice = Number(prev.currentPrice).toFixed(2);
      const newPrice  = Number(updated.currentPrice).toFixed(2);
      const delta     = Number(updated.currentPrice) - Number(prev.currentPrice);
      const sign      = delta >= 0 ? '+' : '';
      toast.success(`$${prevPrice} → $${newPrice} (${sign}${delta.toFixed(2)})`, {
        icon: delta >= 0 ? '📈' : '📉',
        duration: 3000,
      });
    }
  }, [products, updateProduct, refreshLogs]);

  const { trigger, loading, cooldown, activeEventType } = useDemoTrigger(handleSuccess);

  const handleTrigger = useCallback((eventType: EventType) => {
    trigger(effectiveId, eventType);
  }, [trigger, effectiveId]);

  const selectedProduct = products.find(p => p.productId === effectiveId) ?? products[0];

  return (
    <section id={id} className="py-24 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Heading */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-3">
            <GradientText>Live Demo</GradientText>
          </h2>
          <p className="text-base" style={{ color: 'var(--text-muted)', maxWidth: 520, margin: '0 auto' }}>
            Click any market event to trigger a real price adjustment through the full pricing engine.
            All 5 safety layers fire on every request.
          </p>
        </div>

        {/* Loading / error states */}
        {productsLoading && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <LoadingSkeleton className="h-48" />
              <LoadingSkeleton className="h-48" />
              <LoadingSkeleton className="h-48" />
            </div>
            <p className="text-center text-sm" style={{ color: 'var(--text-muted)' }}>
              Connecting to pricing engine… (first load may take ~10s)
            </p>
          </div>
        )}

        {productsError && !productsLoading && (
          <div className="glass-card p-8 text-center max-w-md mx-auto">
            <p className="text-red-400 text-sm mb-2">Failed to connect to pricing engine</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{productsError}</p>
          </div>
        )}

        {/* Main demo grid */}
        {!productsLoading && products.length > 0 && (
          <div className="space-y-4">
            {/* Three-column top row */}
            <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_280px] gap-4">
              {/* Left — product panel */}
              <ProductPanel
                products={products}
                selectedId={effectiveId}
                onSelect={setSelectedId}
              />

              {/* Center — chart */}
              <div className="space-y-4">
                <PriceHistoryChart
                  logs={logs}
                  basePrice={Number(selectedProduct?.basePrice ?? 0)}
                />
                {logsLoading && <LoadingSkeleton className="h-4 w-32" />}
              </div>

              {/* Right — event triggers */}
              <EventTriggerPanel
                onTrigger={handleTrigger}
                loading={loading}
                cooldown={cooldown}
                activeEventType={activeEventType}
                lastTriggerTime={lastTriggerTime}
              />
            </div>

            {/* Full-width bottom — audit log */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-2 px-1" style={{ color: 'var(--text-muted)' }}>
                Audit Trail
              </p>
              <AuditLogTable logs={logs} />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
