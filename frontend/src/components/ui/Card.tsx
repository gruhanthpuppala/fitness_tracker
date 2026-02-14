import { HTMLAttributes } from "react";
import { classNames } from "@/lib/utils";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  elevated?: boolean;
}

export default function Card({ className, elevated, children, ...props }: CardProps) {
  return (
    <div
      className={classNames(
        "rounded-card border border-border p-4",
        elevated ? "bg-bg-elevated" : "bg-bg-surface",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
