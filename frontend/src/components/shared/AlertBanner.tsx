import Banner from "@/components/ui/Banner";

interface AlertBannerProps {
  alerts: { type: "warning" | "info" | "error"; message: string }[];
}

export default function AlertBanner({ alerts }: AlertBannerProps) {
  if (alerts.length === 0) return null;

  return (
    <div className="space-y-2">
      {alerts.map((alert, i) => (
        <Banner key={i} variant={alert.type}>
          {alert.message}
        </Banner>
      ))}
    </div>
  );
}
