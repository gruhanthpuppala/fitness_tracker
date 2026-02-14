"use client";

import { useState } from "react";
import { formatDate } from "@/lib/utils";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import type { BodyMeasurement } from "@/types/measurement";

interface MeasurementFormProps {
  onSubmit: (data: Partial<BodyMeasurement>) => Promise<void>;
  loading: boolean;
}

const fields = [
  { key: "neck", label: "Neck (cm)" },
  { key: "chest", label: "Chest (cm)" },
  { key: "shoulders", label: "Shoulders (cm)" },
  { key: "bicep", label: "Bicep (cm)" },
  { key: "forearm", label: "Forearm (cm)" },
  { key: "waist", label: "Waist (cm)" },
  { key: "hips", label: "Hips (cm)" },
  { key: "thigh", label: "Thigh (cm)" },
] as const;

export default function MeasurementForm({ onSubmit, loading }: MeasurementFormProps) {
  const [values, setValues] = useState<Record<string, string>>({});

  const handleChange = (key: string, val: string) => {
    setValues((prev) => ({ ...prev, [key]: val }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data: Record<string, unknown> = { date: formatDate(new Date()) };
    fields.forEach(({ key }) => {
      if (values[key]) {
        data[key] = Number(values[key]);
      }
    });
    await onSubmit(data as Partial<BodyMeasurement>);
    setValues({});
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {fields.map(({ key, label }) => (
          <Input
            key={key}
            label={label}
            type="number"
            step="0.1"
            value={values[key] || ""}
            onChange={(e) => handleChange(key, e.target.value)}
          />
        ))}
      </div>
      <Button type="submit" className="w-full" loading={loading}>
        Save Measurement
      </Button>
    </form>
  );
}
