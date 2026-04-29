'use client';
import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import type { AuditLog } from '@/lib/types';

export function useAuditLog(productId: string) {
  const [logs, setLogs]       = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!productId || productId.startsWith('PLACEHOLDER')) return;
    try {
      const data = await api.getAuditLog(productId);
      setLogs(data.slice(0, 30));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load audit log');
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    setLoading(true);
    refresh();
  }, [refresh]);

  return { logs, loading, error, refresh };
}
