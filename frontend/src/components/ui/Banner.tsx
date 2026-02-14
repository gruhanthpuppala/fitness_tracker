import { classNames } from "@/lib/utils";

interface BannerProps {
  children: React.ReactNode;
  variant?: "info" | "warning" | "error" | "success";
  onDismiss?: () => void;
}

export default function Banner({ children, variant = "info", onDismiss }: BannerProps) {
  const variants = {
    info: "bg-status-info/10 border-status-info/30 text-status-info",
    warning: "bg-status-warning/10 border-status-warning/30 text-status-warning",
    error: "bg-status-error/10 border-status-error/30 text-status-error",
    success: "bg-status-success/10 border-status-success/30 text-status-success",
  };

  return (
    <div className={classNames("rounded-card border px-4 py-3 text-sm flex items-center justify-between", variants[variant])}>
      <span>{children}</span>
      {onDismiss && (
        <button onClick={onDismiss} className="ml-3 hover:opacity-70" aria-label="Dismiss">
          &times;
        </button>
      )}
    </div>
  );
}
