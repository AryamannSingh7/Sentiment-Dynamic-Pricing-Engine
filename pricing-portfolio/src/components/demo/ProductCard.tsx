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
      className={`glass-card p-4 cursor-pointer transition-all duration-200 ${
        isSelected
          ? 'ring-2 ring-blue-500/60 bg-blue-500/10'
          : 'hover:border-white/20'
      }`}
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
          <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
            ${Number(product.currentPrice).toFixed(2)}
          </p>
          <p className={`text-xs font-medium ${isUp ? 'text-green-400' : 'text-red-400'}`}>
            {isUp ? '+' : ''}{priceDelta.toFixed(2)}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
