'use client';
import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { PRODUCT_IDS } from '@/lib/constants';
import type { Product } from '@/lib/types';

const KNOWN_IDS = new Set(Object.values(PRODUCT_IDS));

export function useProducts() {
  const [products, setProducts]   = useState<Product[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [apiReady, setApiReady]   = useState(false);

  const fetchProducts = useCallback(async () => {
    try {
      const data = await api.getProducts();
      // Only show the 3 seeded demo products — filters out any leftover local test data
      const filtered = data.filter(
        p => p.status === 'ACTIVE' && KNOWN_IDS.has(p.productId)
      );
      setProducts(filtered);
      setApiReady(true);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    api.healthCheck().catch(() => {});
    fetchProducts();
  }, [fetchProducts]);

  const updateProduct = useCallback((updated: Product) => {
    setProducts(prev => prev.map(p => p.productId === updated.productId ? updated : p));
  }, []);

  return { products, loading, error, apiReady, updateProduct, refetch: fetchProducts };
}
