"use client";

import { motion } from "framer-motion";

interface MacroCircleProps {
  label: string;
  current: number;
  target: number;
  unit?: string;
  color?: string;
}

export default function MacroCircle({
  label,
  current,
  target,
  unit = "g",
  color = "var(--color-accent-primary)",
}: MacroCircleProps) {
  const size = 90;
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percentage = target > 0 ? Math.min((current / target) * 100, 100) : 0;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          {/* Background track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--color-bg-elevated)"
            strokeWidth={strokeWidth}
          />
          {/* Progress arc */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-sm font-bold text-text-primary leading-none">
            {current}
          </span>
          <span className="text-[10px] text-text-secondary leading-none mt-0.5">
            / {target}{unit}
          </span>
        </div>
      </div>
      <span className="text-xs text-text-secondary mt-1.5">{label}</span>
    </div>
  );
}
