"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";
import { classNames } from "@/lib/utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading, disabled, children, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-accent-primary focus:ring-offset-2 focus:ring-offset-bg-primary disabled:opacity-50 disabled:cursor-not-allowed";

    const variants = {
      primary: "bg-accent-primary text-bg-primary hover:bg-accent-primary-hover",
      secondary: "bg-bg-elevated text-text-primary border border-border hover:bg-bg-surface",
      danger: "bg-status-error text-text-primary hover:opacity-90",
      ghost: "text-text-secondary hover:text-text-primary hover:bg-bg-elevated",
    };

    const sizes = {
      sm: "px-3 py-1.5 text-sm rounded-input min-h-[36px]",
      md: "px-4 py-2.5 text-sm rounded-input min-h-[44px]",
      lg: "px-6 py-3 text-base rounded-input min-h-[48px]",
    };

    return (
      <button
        ref={ref}
        className={classNames(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        ) : null}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
export default Button;
