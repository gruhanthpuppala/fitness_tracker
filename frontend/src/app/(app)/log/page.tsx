"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useDailyLog } from "@/hooks/useDailyLog";
import { useToast } from "@/components/ui/Toast";
import { formatDate } from "@/lib/utils";
import DateScroller from "@/components/shared/DateScroller";
import DailyLogForm from "@/components/forms/DailyLogForm";
import type { DailyLog, DailyLogFormData } from "@/types/log";
import api from "@/lib/api";

export default function LogPage() {
  const [selectedDate, setSelectedDate] = useState(formatDate(new Date()));
  const [currentLog, setCurrentLog] = useState<DailyLog | null>(null);
  const [yesterdayLog, setYesterdayLog] = useState<DailyLog | null>(null);
  const [loggedDates, setLoggedDates] = useState<Set<string>>(new Set());
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

  useEffect(() => {
    loadLog(selectedDate);
    loadYesterday();
    loadLoggedDates();
  }, [selectedDate, loadLog, loadYesterday, loadLoggedDates]);

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
    </motion.div>
  );
}
