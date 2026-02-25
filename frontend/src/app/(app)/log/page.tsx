"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useDailyLog } from "@/hooks/useDailyLog";
import { useToast } from "@/components/ui/Toast";
import { formatDate, isWithin7Days } from "@/lib/utils";
import DateScroller from "@/components/shared/DateScroller";
import DailyLogForm from "@/components/forms/DailyLogForm";
import MealSection from "@/components/shared/MealSection";
import CustomMetricsManager from "@/components/shared/CustomMetricsManager";
import type { DailyLog, DailyLogFormData, FoodEntry, MealType } from "@/types/log";
import api from "@/lib/api";

const MEAL_ORDER: MealType[] = ["breakfast", "lunch", "snack", "dinner"];

export default function LogPage() {
  const [selectedDate, setSelectedDate] = useState(formatDate(new Date()));
  const [currentLog, setCurrentLog] = useState<DailyLog | null>(null);
  const [yesterdayLog, setYesterdayLog] = useState<DailyLog | null>(null);
  const [loggedDates, setLoggedDates] = useState<Set<string>>(new Set());
  const [foodEntries, setFoodEntries] = useState<FoodEntry[]>([]);
  const { getLog, createLog, updateLog, loading } = useDailyLog();
  const { showToast } = useToast();

  const loadLog = useCallback(async (date: string) => {
    const log = await getLog(date);
    setCurrentLog(log);
  }, [getLog]);

  const loadYesterday = useCallback(async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const log = await getLog(formatDate(yesterday));
    setYesterdayLog(log);
  }, [getLog]);

  const loadLoggedDates = useCallback(async () => {
    try {
      const fourteenAgo = new Date();
      fourteenAgo.setDate(fourteenAgo.getDate() - 14);
      const res = await api.get("/logs/", {
        params: { date__gte: formatDate(fourteenAgo), page_size: 100 },
      });
      const logs = res.data.data?.results || res.data.results || [];
      setLoggedDates(new Set(logs.map((l: DailyLog) => l.date)));
    } catch {
      // Ignore
    }
  }, []);

  const loadFoodEntries = useCallback(async (date: string) => {
    try {
      const res = await api.get(`/logs/${date}/meals/`);
      const entries = res.data.data?.results || res.data.results || res.data.data || res.data || [];
      setFoodEntries(Array.isArray(entries) ? entries : []);
    } catch {
      setFoodEntries([]);
    }
  }, []);

  useEffect(() => {
    loadLog(selectedDate);
    loadYesterday();
    loadLoggedDates();
    loadFoodEntries(selectedDate);
  }, [selectedDate, loadLog, loadYesterday, loadLoggedDates, loadFoodEntries]);

  const handleSubmit = async (data: DailyLogFormData) => {
    try {
      if (currentLog) {
        const updated = await updateLog(selectedDate, data);
        setCurrentLog(updated);
        showToast("Log updated!");
      } else {
        const created = await createLog(selectedDate, data);
        setCurrentLog(created);
        showToast("Log saved!");
      }
      setLoggedDates((prev) => new Set(prev).add(selectedDate));
    } catch {
      showToast("Failed to save log.", "error");
    }
  };

  const handleFoodEntriesChange = () => {
    loadFoodEntries(selectedDate);
    // Reload the log too since backend recomputes totals
    loadLog(selectedDate);
  };

  const entriesByMeal = (meal: MealType) =>
    foodEntries.filter((e) => e.meal_type === meal);

  const isLocked = !isWithin7Days(selectedDate);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <h1 className="text-2xl font-bold text-text-primary mb-4">Daily Log</h1>

      <DateScroller
        selectedDate={selectedDate}
        onDateSelect={setSelectedDate}
        loggedDates={loggedDates}
      />

      <div className="mt-6">
        <DailyLogForm
          date={selectedDate}
          existingLog={currentLog}
          yesterdayLog={yesterdayLog}
          onSubmit={handleSubmit}
          loading={loading}
        />
      </div>

      {/* Food Logging — only shown when a daily log exists */}
      {currentLog && (
        <div className="mt-8 space-y-4">
          <h2 className="text-lg font-semibold text-text-primary">Meals</h2>
          {MEAL_ORDER.map((meal) => (
            <MealSection
              key={meal}
              mealType={meal}
              date={selectedDate}
              entries={entriesByMeal(meal)}
              onEntriesChange={handleFoodEntriesChange}
              disabled={isLocked}
            />
          ))}
          {foodEntries.length > 0 && (
            <div className="text-sm text-text-secondary px-1">
              Meal totals: {foodEntries.reduce((s, e) => s + e.calories, 0)} kcal &middot;{" "}
              P {foodEntries.reduce((s, e) => s + Number(e.protein), 0).toFixed(1)}g &middot;{" "}
              C {foodEntries.reduce((s, e) => s + Number(e.carbs), 0).toFixed(1)}g &middot;{" "}
              F {foodEntries.reduce((s, e) => s + Number(e.fats), 0).toFixed(1)}g
            </div>
          )}
        </div>
      )}

      {/* Custom Metrics */}
      <div className="mt-8">
        <CustomMetricsManager
          date={selectedDate}
          hasLog={!!currentLog}
          disabled={isLocked}
        />
      </div>
    </motion.div>
  );
}
