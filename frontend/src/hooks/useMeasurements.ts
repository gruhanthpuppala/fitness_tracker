"use client";

import { useState, useCallback } from "react";
import api from "@/lib/api";
import type { BodyMeasurement } from "@/types/measurement";

export function useMeasurements() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getMeasurements = useCallback(async (): Promise<BodyMeasurement[]> => {
    try {
      const res = await api.get("/measurements/", { params: { page_size: 100 } });
      return res.data.data?.results || res.data.results || [];
    } catch {
      return [];
    }
  }, []);

  const getLatest = useCallback(async (): Promise<BodyMeasurement | null> => {
    try {
      const res = await api.get("/measurements/latest/");
      return res.data.data || res.data;
    } catch {
      return null;
    }
  }, []);

  const createMeasurement = useCallback(
    async (data: Partial<BodyMeasurement>): Promise<{ measurement: BodyMeasurement; warning?: string }> => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.post("/measurements/", data);
        const responseData = res.data.data || res.data;
        const warning = res.data.warning;
        return { measurement: responseData, warning };
      } catch (err: unknown) {
        setError("Failed to save measurement.");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { loading, error, getMeasurements, getLatest, createMeasurement };
}
