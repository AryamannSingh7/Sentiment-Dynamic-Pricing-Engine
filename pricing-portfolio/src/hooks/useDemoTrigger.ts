'use client';
import { useState, useCallback, useRef } from 'react';
import { api } from '@/lib/api';
import type { EventType, Product } from '@/lib/types';

const COOLDOWN_SEC = 5;

interface UseDemoTriggerResult {
  trigger:         (productId: string, eventType: EventType) => Promise<void>;
  loading:         boolean;
  cooldown:        number;
  activeEventType: EventType | null;
  error:           string | null;
}

export function useDemoTrigger(onSuccess: (product: Product) => void): UseDemoTriggerResult {
  const [loading, setLoading]               = useState(false);
  const [cooldown, setCooldown]             = useState(0);
  const [activeEventType, setActiveEvent]   = useState<EventType | null>(null);
  const [error, setError]                   = useState<string | null>(null);
  const tickRef                             = useRef<ReturnType<typeof setInterval> | null>(null);

  const startCooldown = useCallback(() => {
    setCooldown(COOLDOWN_SEC);
    if (tickRef.current) clearInterval(tickRef.current);
    tickRef.current = setInterval(() => {
      setCooldown(prev => {
        if (prev <= 1) {
          clearInterval(tickRef.current!);
          tickRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const trigger = useCallback(async (productId: string, eventType: EventType) => {
    if (loading || cooldown > 0) return;
    setLoading(true);
    setActiveEvent(eventType);
    setError(null);
    try {
      const updated = await api.triggerDemo(productId, eventType);
      onSuccess(updated);
      startCooldown();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Trigger failed');
    } finally {
      setLoading(false);
      setActiveEvent(null);
    }
  }, [loading, cooldown, onSuccess, startCooldown]);

  return { trigger, loading, cooldown, activeEventType, error };
}
