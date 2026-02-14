"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { motion } from "framer-motion";
import { useDashboard } from "@/hooks/useDashboard";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Banner from "@/components/ui/Banner";
import { SkeletonCard } from "@/components/ui/Skeleton";
import MetricCard from "@/components/shared/MetricCard";
import StreakCounter from "@/components/shared/StreakCounter";
import AlertBanner from "@/components/shared/AlertBanner";
import CalorieProgressBar from "@/components/charts/CalorieProgressBar";

const WeightTrendChart = dynamic(() => import("@/components/charts/WeightTrendChart"), {
  ssr: false,
  loading: () => <div className="h-60 animate-pulse bg-bg-elevated rounded-card" />,
});

export default function DashboardPage() {
  const { summary, trends, streaks, alerts, loading, trendDays, setTrendDays } = useDashboard();

  if (loading) {
    return (
      <div className="space-y-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>

      {/* Log today CTA */}
      {summary && !summary.has_logged_today && (
        <Banner variant="info">
          You haven&apos;t logged today.{" "}
          <Link href="/log" className="text-accent-primary font-medium hover:text-accent-primary-hover">
            Log now
          </Link>
        </Banner>
      )}

      {/* Alerts */}
      <AlertBanner alerts={alerts} />

      {/* Today's metrics */}
      <div className="grid grid-cols-2 gap-3">
        <MetricCard
          label="Weight"
          value={summary?.today?.weight ?? "—"}
          unit="kg"
        />
        <MetricCard
          label="Steps"
          value={summary?.today?.steps ?? "—"}
        />
      </div>

      {/* Calories & Protein vs targets */}
      {summary?.today && summary?.targets && (
        <Card className="p-4 space-y-4">
          <CalorieProgressBar
            current={summary.today.calories}
            target={summary.targets.calorie_target}
            label="Calories"
          />
          <CalorieProgressBar
            current={summary.today.protein}
            target={summary.targets.protein_target}
            label="Protein"
          />
        </Card>
      )}

      {/* Streaks */}
      {streaks && (
        <Card className="p-4">
          <h2 className="text-sm font-medium text-text-secondary mb-3">Current Streaks</h2>
          <div className="grid grid-cols-3 gap-4">
            <StreakCounter label="Protein Hit" value={streaks.protein_streak} />
            <StreakCounter label="Calories OK" value={streaks.calorie_streak} />
            <StreakCounter label="Workouts" value={streaks.workout_streak} />
          </div>
        </Card>
      )}

      {/* Weight trend chart */}
      <Card className="p-4">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-sm font-medium text-text-secondary">Weight Trend</h2>
          <div className="flex gap-1">
            {[7, 14, 30].map((d) => (
              <button
                key={d}
                onClick={() => setTrendDays(d)}
                className={`px-2 py-1 text-xs rounded-pill transition-colors ${
                  trendDays === d
                    ? "bg-accent-primary text-bg-primary"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                {d}d
              </button>
            ))}
          </div>
        </div>
        <WeightTrendChart data={trends} />
      </Card>
    </motion.div>
  );
}
