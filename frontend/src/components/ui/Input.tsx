"use client";

import { InputHTMLAttributes, forwardRef } from "react";
import { classNames } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm text-text-secondary mb-1.5">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={classNames(
            "input-field w-full",
            error && "border-status-error focus:border-status-error focus:ring-status-error",
            className
          )}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-status-error">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
export default Input;
