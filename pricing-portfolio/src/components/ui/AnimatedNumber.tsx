'use client';
import { useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

interface Props {
  value: number;
  format?: (n: number) => string;
  className?: string;
}

export default function AnimatedNumber({
  value,
  format = (n) => n.toFixed(0),
  className = '',
}: Props) {
  const motionVal = useMotionValue(value);
  const spring    = useSpring(motionVal, { damping: 25, stiffness: 120 });
  const display   = useTransform(spring, (v) => format(v));

  useEffect(() => {
    motionVal.set(value);
  }, [value, motionVal]);

  return <motion.span className={className}>{display}</motion.span>;
}
