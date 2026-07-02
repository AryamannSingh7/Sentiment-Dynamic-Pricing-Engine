'use client';
import { motion, AnimatePresence } from 'framer-motion';
import ProductCard from './ProductCard';
import type { Product } from '@/lib/types';

interface Props {
  products:   Product[];
  selectedId: string;
  onSelect:   (id: string) => void;
}

function relativeTime(iso: string | null) {
  if (!iso) return 'Never';
  const diff = Date.now() - new Date(iso).getTime();
  const s    = Math.floor(diff / 1000);
  if (s < 5)  return 'Just now';
  if (s < 60) return `${s}s ago`;
  return `${Math.floor(s / 60)}m ago`;
}

export default function ProductPanel({ products, selectedId, onSelect }: Props) {
  const selected = products.find(p => p.productId === selectedId) ?? products[0];

  if (!selected) return null;

  const priceDelta      = Number(selected.currentPrice) - Number(selected.basePrice);
  const isUp            = priceDelta >= 0;
  const multiplierPct   = ((Number(selected.priceMultiplier) - 0.5) / 1.5) * 100;

  return (
    <div className="flex flex-col gap-4">
      {/* Product list */}
      <div className="space-y-2">
        {products.map(p => (
          <ProductCard
            key={p.productId}
            product={p}
            isSelected={p.productId === selectedId}
            onClick={() => onSelect(p.productId)}
          />
        ))}
      </div>

      {/* Selected product details */}
      <div className="panel p-5 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Current Price
            </p>
            <AnimatePresence mode="wait">
              <motion.p
                key={selected.currentPrice}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="font-mono text-3xl font-semibold mt-1"
                style={{ color: 'var(--ink)' }}
              >
                ${Number(selected.currentPrice).toFixed(2)}
              </motion.p>
            </AnimatePresence>
            <p className="font-mono text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              base ${Number(selected.basePrice).toFixed(2)}
              <span className="ml-2 font-medium" style={{ color: isUp ? 'var(--up)' : 'var(--down)' }}>
                {isUp ? '▲' : '▼'} {Math.abs(priceDelta).toFixed(2)}
              </span>
            </p>
          </div>
          <span
            className="px-2 py-1 rounded-full text-xs font-mono font-medium"
            style={{ background: 'var(--up-soft)', color: 'var(--up)' }}
          >
            ACTIVE
          </span>
        </div>

        {/* Multiplier gauge */}
        <div>
          <div className="flex justify-between font-mono text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
            <span>MULTIPLIER</span>
            <span style={{ color: Number(selected.priceMultiplier) >= 1 ? 'var(--up)' : 'var(--down)' }}>
              ×{Number(selected.priceMultiplier).toFixed(3)}
            </span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--surface-2)', border: '1px solid var(--line)' }}>
            <motion.div
              className="h-full rounded-full"
              style={{ background: Number(selected.priceMultiplier) >= 1 ? 'var(--up)' : 'var(--down)' }}
              animate={{ width: `${Math.max(4, Math.min(100, multiplierPct))}%` }}
              transition={{ type: 'spring', damping: 20 }}
            />
          </div>
          <div className="flex justify-between font-mono text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>
            <span>0.50×</span>
            <span>1.00×</span>
            <span>2.00×</span>
          </div>
        </div>

        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Last updated: {relativeTime(selected.lastPriceUpdate)}
        </p>
      </div>
    </div>
  );
}
