import { classNames } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "error" | "info";
}

export default function Badge({ children, variant = "default" }: BadgeProps) {
  const variants = {
    default: "bg-bg-elevated text-text-secondary",
    success: "bg-status-success/20 text-status-success",
    warning: "bg-status-warning/20 text-status-warning",
    error: "bg-status-error/20 text-status-error",
    info: "bg-status-info/20 text-status-info",
  };

  return (
    <span
      className={classNames(
        "inline-flex items-center px-2.5 py-0.5 rounded-pill text-xs font-medium",
        variants[variant]
      )}
    >
      {children}
    </span>
  );
}
