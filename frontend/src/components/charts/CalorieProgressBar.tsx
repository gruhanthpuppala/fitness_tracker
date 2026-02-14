"use client";

import ProgressBar from "@/components/ui/ProgressBar";

interface CalorieProgressBarProps {
  current: number;
  target: number;
  label: string;
}

export default function CalorieProgressBar({ current, target, label }: CalorieProgressBarProps) {
  const percentage = target > 0 ? (current / target) * 100 : 0;
  const isOnTrack = Math.abs(current - target) <= target * 0.1;

  return (
    <ProgressBar
      value={current}
      max={target}
      label={label}
      variant={isOnTrack ? "success" : percentage > 110 ? "error" : "warning"}
    />
  );
}
