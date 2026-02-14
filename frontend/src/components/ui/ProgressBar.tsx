"use client";

import { motion } from "framer-motion";
import { classNames } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  max: number;
  label?: string;
  showValue?: boolean;
  variant?: "default" | "success" | "warning" | "error";
  className?: string;
}

export default function ProgressBar({
  value,
  max,
  label,
  showValue = true,
  variant = "default",
  className,
}: ProgressBarProps) {
  const percentage = Math.min((value / max) * 100, 100);

  const barColors = {
    default: "bg-accent-primary",
    success: "bg-status-success",
    warning: "bg-status-warning",
    error: "bg-status-error",
  };

  return (
    <div className={classNames("w-full", className)}>
      {(label || showValue) && (
        <div className="flex justify-between items-center mb-1.5">
          {label && <span className="text-sm text-text-secondary">{label}</span>}
          {showValue && (
            <span className="text-sm text-text-secondary">
              {value} / {max}
            </span>
          )}
        </div>
      )}
      <div className="h-2 bg-bg-elevated rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={classNames("h-full rounded-full", barColors[variant])}
        />
      </div>
    </div>
  );
}
