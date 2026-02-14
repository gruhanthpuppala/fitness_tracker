import { motion } from "framer-motion";
import Card from "@/components/ui/Card";

interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  subtitle?: string;
}

export default function MetricCard({ label, value, unit, subtitle }: MetricCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="p-4">
        <p className="text-sm text-text-secondary">{label}</p>
        <p className="text-2xl font-bold text-text-primary mt-1">
          {value}
          {unit && <span className="text-sm text-text-secondary ml-1">{unit}</span>}
        </p>
        {subtitle && <p className="text-xs text-text-muted mt-1">{subtitle}</p>}
      </Card>
    </motion.div>
  );
}
