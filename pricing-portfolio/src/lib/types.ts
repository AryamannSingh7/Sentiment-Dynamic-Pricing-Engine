export interface Product {
  id: string;
  productId: string;
  name: string;
  description: string;
  category: string;
  basePrice: number;
  currentPrice: number;
  priceMultiplier: number;
  sentimentScore: number;
  inventory: number;
  status: string;
  lastPriceUpdate: string | null;
  version: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  auditId: string;
  productId: string;
  previousPrice: number;
  newPrice: number;
  previousMultiplier: number;
  newMultiplier: number;
  sentimentScore: number;
  adjustmentReason: string;
  confidence: number;
  sourceEventId: string;
  adjustmentEventId: string;
  appliedAt: string;
}

export type EventType =
  | 'COMPETITOR_PRICE_DROP'
  | 'COMPETITOR_PRICE_SURGE'
  | 'SOCIAL_TREND_POSITIVE'
  | 'SOCIAL_TREND_NEGATIVE'
  | 'REVIEW_SURGE_POSITIVE'
  | 'REVIEW_SURGE_NEGATIVE'
  | 'NEWS_POSITIVE'
  | 'NEWS_NEGATIVE';
