"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";

interface DashboardSummary {
  today: {
    weight: number;
    calories: number;
    protein: number;
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

export function useDashboard() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [trends, setTrends] = useState<WeightTrend[]>([]);
  const [streaks, setStreaks] = useState<Streaks | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [trendDays, setTrendDays] = useState(7);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [summaryRes, trendsRes, streaksRes, alertsRes] = await Promise.all([
        api.get("/dashboard/summary/"),
        api.get(`/dashboard/trends/?days=${trendDays}`),
        api.get("/dashboard/streaks/"),
        api.get("/dashboard/alerts/"),
      ]);

      setSummary(summaryRes.data.data || summaryRes.data);
      setTrends(trendsRes.data.data || trendsRes.data);
      setStreaks(streaksRes.data.data || streaksRes.data);
      setAlerts(alertsRes.data.data || alertsRes.data);
    } catch {
      // Ignore errors
    } finally {
      setLoading(false);
    }
  }, [trendDays]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return { summary, trends, streaks, alerts, loading, trendDays, setTrendDays, refresh: fetchAll };
}
