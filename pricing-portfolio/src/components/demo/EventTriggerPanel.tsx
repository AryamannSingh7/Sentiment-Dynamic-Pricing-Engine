'use client';
import { motion } from 'framer-motion';
import CooldownTimer from './CooldownTimer';
import SafetyLayerVisualizer from './SafetyLayerVisualizer';
import { ALL_EVENT_TYPES, EVENT_TYPE_META } from '@/lib/constants';
import type { EventType } from '@/lib/types';

interface Props {
  onTrigger:       (eventType: EventType) => void;
  loading:         boolean;
  cooldown:        number;
  activeEventType: EventType | null;
  lastTriggerTime: number | null;
}

export default function EventTriggerPanel({
  onTrigger, loading, cooldown, activeEventType, lastTriggerTime,
}: Props) {
  const disabled = loading || cooldown > 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="glass-card p-4">
        <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>
          Trigger Market Event
        </p>

        <div className="grid grid-cols-2 gap-2">
          {ALL_EVENT_TYPES.map(eventType => {
            const meta       = EVENT_TYPE_META[eventType];
            const isActive   = activeEventType === eventType && loading;
            return (
              <motion.button
                key={eventType}
                whileHover={!disabled ? { scale: 1.03 } : {}}
                whileTap={!disabled ? { scale: 0.97 } : {}}
                onClick={() => !disabled && onTrigger(eventType)}
                disabled={disabled}
                className={`
                  relative flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium
                  transition-all duration-150 text-left
                  ${meta.bgClass}
                  ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
                `}
                style={{ color: 'var(--text-primary)' }}
              >
                {isActive ? (
                  <span className="text-base animate-spin">⟳</span>
                ) : (
                  <span className="text-base">{meta.icon}</span>
                )}
                <span className="leading-tight">{meta.label}</span>
              </motion.button>
            );
          })}
        </div>

        {cooldown > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 flex justify-center"
          >
            <CooldownTimer seconds={cooldown} total={5} />
          </motion.div>
        )}
      </div>

      <SafetyLayerVisualizer lastTriggerTime={lastTriggerTime} />
    </div>
  );
}
