"use client";

import { useState, useCallback } from "react";
import api from "@/lib/api";
import type { DailyLog, DailyLogFormData } from "@/types/log";

export function useDailyLog() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getLog = useCallback(async (date: string): Promise<DailyLog | null> => {
    try {
      const res = await api.get(`/logs/${date}/`);
      return res.data.data || res.data;
    } catch {
      return null;
    }
  }, []);

  const getTodayLog = useCallback(async (): Promise<DailyLog | null> => {
    try {
      const res = await api.get("/logs/today/");
      return res.data.data || res.data;
    } catch {
      return null;
    }
  }, []);

  const createLog = useCallback(async (date: string, data: DailyLogFormData): Promise<DailyLog> => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post("/logs/", { ...data, date });
      return res.data.data || res.data;
    } catch (err: unknown) {
      const e = err as { response?: { data?: { errors?: Record<string, string[]> } } };
      const msg = e.response?.data?.errors
        ? Object.values(e.response.data.errors).flat().join(", ")
        : "Failed to save log.";
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateLog = useCallback(async (date: string, data: DailyLogFormData): Promise<DailyLog> => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.put(`/logs/${date}/`, { ...data, date });
      return res.data.data || res.data;
    } catch (err: unknown) {
      const e = err as { response?: { data?: { errors?: Record<string, string[]> } } };
      const msg = e.response?.data?.errors
        ? Object.values(e.response.data.errors).flat().join(", ")
        : "Failed to update log.";
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteLog = useCallback(async (date: string): Promise<void> => {
    setLoading(true);
    try {
      await api.delete(`/logs/${date}/`);
    } catch (err: unknown) {
      setError("Failed to delete log.");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getYesterdayLog = useCallback(async (): Promise<DailyLog | null> => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().split("T")[0];
    return getLog(dateStr);
  }, [getLog]);

  return {
    loading,
    error,
    getLog,
    getTodayLog,
    createLog,
    updateLog,
    deleteLog,
    getYesterdayLog,
  };
}
