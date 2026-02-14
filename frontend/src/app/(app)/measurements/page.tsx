"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useMeasurements } from "@/hooks/useMeasurements";
import { useToast } from "@/components/ui/Toast";
import MeasurementForm from "@/components/forms/MeasurementForm";
import Card from "@/components/ui/Card";
import Banner from "@/components/ui/Banner";
import type { BodyMeasurement } from "@/types/measurement";

const MEASUREMENT_FIELDS = ["neck", "chest", "shoulders", "bicep", "forearm", "waist", "hips", "thigh"] as const;

export default function MeasurementsPage() {
  const { getMeasurements, createMeasurement, loading } = useMeasurements();
  const { showToast } = useToast();
  const [measurements, setMeasurements] = useState<BodyMeasurement[]>([]);
  const [warning, setWarning] = useState<string | null>(null);

  const loadMeasurements = useCallback(async () => {
    const data = await getMeasurements();
    setMeasurements(data);
  }, [getMeasurements]);

  useEffect(() => {
    loadMeasurements();
  }, [loadMeasurements]);

  const handleSubmit = async (data: Partial<BodyMeasurement>) => {
    try {
      const result = await createMeasurement(data);
      if (result.warning) {
        setWarning(result.warning);
      }
      showToast("Measurement saved!");
      loadMeasurements();
    } catch {
      showToast("Failed to save measurement.", "error");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      <h1 className="text-2xl font-bold text-text-primary">Body Measurements</h1>

      {warning && <Banner variant="warning">{warning}</Banner>}

      {/* Check if 30+ days since last measurement */}
      {measurements.length > 0 && (() => {
        const lastDate = new Date(measurements[0].date);
        const daysSince = Math.floor((Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
        if (daysSince >= 30) {
          return <Banner variant="info">It&apos;s been {daysSince} days since your last measurement.</Banner>;
        }
        return null;
      })()}

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-text-primary mb-4">New Measurement</h2>
        <MeasurementForm onSubmit={handleSubmit} loading={loading} />
      </Card>

      {/* History */}
      {measurements.length > 0 && (
        <Card className="p-4">
          <h2 className="text-lg font-semibold text-text-primary mb-4">History</h2>
          <div className="space-y-4">
            {measurements.map((m, idx) => {
              const prev = measurements[idx + 1];
              return (
                <div key={m.id} className="border-b border-border pb-3 last:border-0">
                  <p className="text-sm font-medium text-text-primary mb-2">{m.date}</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                    {MEASUREMENT_FIELDS.map((field) => {
                      const val = m[field];
                      const prevVal = prev?.[field];
                      if (val == null) return null;
                      const diff = prevVal != null ? (Number(val) - Number(prevVal)).toFixed(1) : null;
                      return (
                        <div key={field} className="flex justify-between">
                          <span className="text-text-secondary capitalize">{field}</span>
                          <span>
                            {val} cm
                            {diff && Number(diff) !== 0 && (
                              <span className={Number(diff) > 0 ? "text-status-error ml-1" : "text-status-success ml-1"}>
                                ({Number(diff) > 0 ? "+" : ""}{diff})
                              </span>
                            )}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </motion.div>
  );
}
