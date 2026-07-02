'use client';
import { motion } from 'framer-motion';
import type { Product } from '@/lib/types';

interface Props {
  product: Product;
  isSelected: boolean;
  onClick: () => void;
}

const CATEGORY_ICONS: Record<string, string> = {
  Audio:      '🎧',
  GPU:        '🖥️',
  Peripherals:'⌨️',
};

export default function ProductCard({ product, isSelected, onClick }: Props) {
  const icon = CATEGORY_ICONS[product.category] ?? '📦';
  const priceDelta = product.currentPrice - product.basePrice;
  const isUp = priceDelta >= 0;

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="panel p-4 cursor-pointer"
      style={
        isSelected
          ? { borderColor: 'var(--accent)', boxShadow: '0 0 0 1px var(--accent), var(--shadow-card)' }
          : undefined
      }
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl">{icon}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
            {product.name}
          </p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{product.category}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="font-mono text-sm font-semibold" style={{ color: 'var(--ink)' }}>
            ${Number(product.currentPrice).toFixed(2)}
          </p>
          <p className="font-mono text-xs font-medium" style={{ color: isUp ? 'var(--up)' : 'var(--down)' }}>
            {isUp ? '+' : ''}{priceDelta.toFixed(2)}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
