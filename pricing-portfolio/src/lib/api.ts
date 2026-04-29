import { RAIL_URL } from './constants';
import type { AuditLog, Product } from './types';

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${RAIL_URL}${path}`, options);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  healthCheck:  ()                              => apiFetch<unknown>('/actuator/health'),
  getProducts:  ()                              => apiFetch<Product[]>('/api/products'),
  getProduct:   (id: string)                    => apiFetch<Product>(`/api/products/${id}`),
  getAuditLog:  (id: string)                    => apiFetch<AuditLog[]>(`/api/products/${id}/audit`),
  triggerDemo:  (id: string, eventType: string) => apiFetch<Product>(`/api/products/${id}/demo/trigger`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ eventType }),
  }),
};
