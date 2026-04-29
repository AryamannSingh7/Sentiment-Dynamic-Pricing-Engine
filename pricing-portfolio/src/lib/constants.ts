import type { EventType } from './types';

export const RAIL_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';

// Fill in the UUIDs printed by seed-demo-data.ps1 after seeding
export const PRODUCT_IDS = {
  headphones: '645f51cd-267c-4e2b-8908-b271b6edc5b4',
  gpu:        '678eefbb-8962-4a3e-83b0-6889eddcbc32',
  keyboard:   '84bbfa5a-b224-4dd4-986b-71beb2d19b16'
} as const;

export const EVENT_TYPE_META: Record<EventType, {
  label: string;
  delta: number;
  color: string;
  bgClass: string;
  icon: string;
}> = {
  COMPETITOR_PRICE_DROP:  { label: 'Competitor Drop',  delta: -0.12, color: '#ef4444', bgClass: 'bg-red-500/10 hover:bg-red-500/20 border-red-500/20',   icon: '📉' },
  COMPETITOR_PRICE_SURGE: { label: 'Competitor Surge', delta:  0.10, color: '#22c55e', bgClass: 'bg-green-500/10 hover:bg-green-500/20 border-green-500/20', icon: '📈' },
  SOCIAL_TREND_POSITIVE:  { label: 'Social Trend +',   delta:  0.08, color: '#22c55e', bgClass: 'bg-green-500/10 hover:bg-green-500/20 border-green-500/20', icon: '🔥' },
  SOCIAL_TREND_NEGATIVE:  { label: 'Social Trend −',   delta: -0.08, color: '#ef4444', bgClass: 'bg-red-500/10 hover:bg-red-500/20 border-red-500/20',   icon: '💧' },
  REVIEW_SURGE_POSITIVE:  { label: 'Review Surge +',   delta:  0.12, color: '#22c55e', bgClass: 'bg-green-500/10 hover:bg-green-500/20 border-green-500/20', icon: '⭐' },
  REVIEW_SURGE_NEGATIVE:  { label: 'Review Surge −',   delta: -0.10, color: '#ef4444', bgClass: 'bg-red-500/10 hover:bg-red-500/20 border-red-500/20',   icon: '💔' },
  NEWS_POSITIVE:          { label: 'Positive News',    delta:  0.15, color: '#3b82f6', bgClass: 'bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/20',  icon: '📰' },
  NEWS_NEGATIVE:          { label: 'Negative News',    delta: -0.15, color: '#f97316', bgClass: 'bg-orange-500/10 hover:bg-orange-500/20 border-orange-500/20', icon: '⚠️' },
};

export const ALL_EVENT_TYPES = Object.keys(EVENT_TYPE_META) as EventType[];
