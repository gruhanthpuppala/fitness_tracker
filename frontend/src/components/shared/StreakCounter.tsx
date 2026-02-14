"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface StreakCounterProps {
  label: string;
  value: number;
}

export default function StreakCounter({ label, value }: StreakCounterProps) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (value === 0) {
      setDisplayValue(0);
      return;
    }

    let current = 0;
    const step = Math.max(1, Math.floor(value / 20));
    const interval = setInterval(() => {
      current += step;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(interval);
      } else {
        setDisplayValue(current);
      }
    }, 30);

    return () => clearInterval(interval);
  }, [value]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center"
    >
      <div className="text-3xl font-bold text-accent-primary">{displayValue}</div>
      <div className="text-xs text-text-secondary mt-1">{label}</div>
    </motion.div>
  );
}
