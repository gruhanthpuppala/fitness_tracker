"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";

interface DashboardSummary {
  today: {
    weight: number;
    calories: number;
    protein: number;
    carbs: number | null;
    fats: number | null;
    fibre: number;
    steps: number;
    water: number;
    sleep: number;
    workout: boolean;
    protein_hit: boolean;
    calories_ok: boolean;
  } | null;
  targets: {
    calorie_target: number;
    protein_target: number;
    goal_weight: number;
    carbs_target: number | null;
    fats_target: number | null;
    fibre_target: number | null;
    water_target: number | null;
    sleep_target: number | null;
    steps_target: number | null;
  } | null;
  has_logged_today: boolean;
}

interface WeightTrend {
  date: string;
  weight: number;
}

interface Streaks {
  protein_streak: number;
  calorie_streak: number;
  workout_streak: number;
}

interface Alert {
  type: "warning" | "info" | "error";
  message: string;
}

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

interface MonthlyMetricsData {
  month: string;
  avg_weight: number | null;
  bmi: number | null;
  bmi_category: string;
  weight_change: number | null;
  consistency_score: number;
  days_logged: number;
  protein_hit_days: number;
  workout_days: number;
  total_days_in_month: number;
}

export function useDashboard() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [trends, setTrends] = useState<WeightTrend[]>([]);
  const [streaks, setStreaks] = useState<Streaks | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [weeklyReview, setWeeklyReview] = useState<WeeklyReviewData | null>(null);
  const [monthlyMetrics, setMonthlyMetrics] = useState<MonthlyMetricsData[]>([]);
  const [loading, setLoading] = useState(true);
  const [trendDays, setTrendDays] = useState(7);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [summaryRes, trendsRes, streaksRes, alertsRes, weeklyRes, monthlyRes] = await Promise.all([
        api.get("/dashboard/summary/"),
        api.get(`/dashboard/trends/?days=${trendDays}`),
        api.get("/dashboard/streaks/"),
        api.get("/dashboard/alerts/"),
        api.get("/dashboard/weekly-review/"),
        api.get("/dashboard/monthly/"),
      ]);

      setSummary(summaryRes.data.data || summaryRes.data);
      setTrends(trendsRes.data.data || trendsRes.data);
      setStreaks(streaksRes.data.data || streaksRes.data);
      setAlerts(alertsRes.data.data || alertsRes.data);
      setWeeklyReview(weeklyRes.data.data || weeklyRes.data);
      const monthly = monthlyRes.data.data || monthlyRes.data;
      setMonthlyMetrics(Array.isArray(monthly) ? monthly : []);
    } catch {
      // Ignore errors
    } finally {
      setLoading(false);
    }
  }, [trendDays]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Derive current month BMI data from monthly metrics
  const currentMonthMetrics = monthlyMetrics.length > 0 ? monthlyMetrics[0] : null;

  return {
    summary,
    trends,
    streaks,
    alerts,
    weeklyReview,
    monthlyMetrics,
    currentMonthMetrics,
    loading,
    trendDays,
    setTrendDays,
    refresh: fetchAll,
  };
}
