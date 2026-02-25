"use client";

import { motion } from "framer-motion";
import Card from "@/components/ui/Card";

interface WeeklyReviewData {
  period: { start: string; end: string };
  days_logged: number;
  avg_calories?: number;
  avg_protein?: number;
  workouts_done?: number;
  workout_types_used?: string[];
  weight_change?: number | null;
  consistency_score?: number;
  protein_hit_days?: number;
  message?: string;
}

interface WeeklyReviewProps {
  data: WeeklyReviewData | null;
}

const WORKOUT_TYPE_LABELS: Record<string, string> = {
  weight_training: "Weight Training",
  cardio: "Cardio",
  bodyweight_training: "Bodyweight",
};

export default function WeeklyReview({ data }: WeeklyReviewProps) {
  if (!data) return null;

  if (data.days_logged === 0) {
    return (
      <Card className="p-4">
        <h2 className="text-sm font-medium text-text-secondary mb-2">Weekly Review</h2>
        <p className="text-sm text-text-secondary">{data.message || "No data for the past week."}</p>
      </Card>
    );
  }

  const weightChangeText =
    data.weight_change != null
      ? `${data.weight_change > 0 ? "+" : ""}${data.weight_change} kg`
      : "—";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-text-secondary">Weekly Review</h2>
          <span className="text-xs text-text-secondary">
            {data.period.start} — {data.period.end}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-text-secondary">Days Logged</span>
            <p className="font-semibold text-text-primary">{data.days_logged} / 7</p>
          </div>
          <div>
            <span className="text-text-secondary">Avg Calories</span>
            <p className="font-semibold text-text-primary">{data.avg_calories ?? "—"} kcal</p>
          </div>
          <div>
            <span className="text-text-secondary">Avg Protein</span>
            <p className="font-semibold text-text-primary">{data.avg_protein ?? "—"}g</p>
          </div>
          <div>
            <span className="text-text-secondary">Workouts</span>
            <p className="font-semibold text-text-primary">{data.workouts_done ?? 0}</p>
          </div>
          <div>
            <span className="text-text-secondary">Weight Change</span>
            <p className={`font-semibold ${
              data.weight_change != null && data.weight_change < 0
                ? "text-status-success"
                : data.weight_change != null && data.weight_change > 0
                ? "text-status-warning"
                : "text-text-primary"
            }`}>
              {weightChangeText}
            </p>
          </div>
          <div>
            <span className="text-text-secondary">Protein Hit Days</span>
            <p className="font-semibold text-text-primary">{data.protein_hit_days ?? 0} / {data.days_logged}</p>
          </div>
        </div>

        {/* Workout types used */}
        {data.workout_types_used && data.workout_types_used.length > 0 && (
          <div className="mt-3 pt-3 border-t border-border">
            <span className="text-xs text-text-secondary">Workout Types: </span>
            <span className="text-xs text-text-primary">
              {data.workout_types_used.map((t) => WORKOUT_TYPE_LABELS[t] || t).join(", ")}
            </span>
          </div>
        )}

        {/* Consistency score */}
        {data.consistency_score != null && (
          <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
            <span className="text-xs text-text-secondary">Consistency Score</span>
            <span className={`text-lg font-bold ${
              data.consistency_score >= 70
                ? "text-status-success"
                : data.consistency_score >= 40
                ? "text-status-warning"
                : "text-status-error"
            }`}>
              {data.consistency_score}%
            </span>
          </div>
        )}
      </Card>
    </motion.div>
  );
}
