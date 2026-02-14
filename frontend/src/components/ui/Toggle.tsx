"use client";

import { motion } from "framer-motion";

interface ToggleProps {
  label?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export default function Toggle({ label, checked, onChange, disabled }: ToggleProps) {
  return (
    <label className="flex items-center justify-between cursor-pointer min-h-[44px]">
      {label && <span className="text-sm text-text-secondary">{label}</span>}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-accent-primary focus:ring-offset-2 focus:ring-offset-bg-primary ${
          checked ? "bg-toggle-on" : "bg-toggle-off border border-border"
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <motion.span
          layout
          transition={{ type: "spring", stiffness: 700, damping: 30 }}
          className={`inline-block h-4 w-4 rounded-full bg-text-primary ${
            checked ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </label>
  );
}
