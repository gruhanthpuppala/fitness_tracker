"use client";

import { useState, useEffect, useRef } from "react";
import type { DailyLog, DailyLogFormData } from "@/types/log";
import { isWithin7Days } from "@/lib/utils";
import { dailyLogSchema } from "@/lib/validators";
import Input from "@/components/ui/Input";
import Toggle from "@/components/ui/Toggle";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";

interface DailyLogFormProps {
  date: string;
  existingLog: DailyLog | null;
  yesterdayLog: DailyLog | null;
  onSubmit: (data: DailyLogFormData) => Promise<void>;
  loading: boolean;
}

export default function DailyLogForm({ date, existingLog, yesterdayLog, onSubmit, loading }: DailyLogFormProps) {
  const isLocked = !isWithin7Days(date);
  const [showOptional, setShowOptional] = useState(false);

  const [weight, setWeight] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [steps, setSteps] = useState("");
  const [water, setWater] = useState("");
  const [sleep, setSleep] = useState("");
  const [workout, setWorkout] = useState(false);
  const [cardio, setCardio] = useState(false);
  const [carbs, setCarbs] = useState("");
  const [fats, setFats] = useState("");
  const [fruit, setFruit] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const firstEmptyRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (existingLog) {
      setWeight(String(existingLog.weight));
      setCalories(String(existingLog.calories));
      setProtein(String(existingLog.protein));
      setSteps(String(existingLog.steps));
      setWater(String(existingLog.water));
      setSleep(String(existingLog.sleep));
      setWorkout(existingLog.workout);
      setCardio(existingLog.cardio);
      setCarbs(existingLog.carbs != null ? String(existingLog.carbs) : "");
      setFats(existingLog.fats != null ? String(existingLog.fats) : "");
      setFruit(existingLog.fruit);
    } else {
      setWeight("");
      setCalories("");
      setProtein("");
      setSteps("");
      setWater("");
      setSleep("");
      setWorkout(false);
      setCardio(false);
      setCarbs("");
      setFats("");
      setFruit(false);
    }
  }, [existingLog, date]);

  useEffect(() => {
    if (!isLocked && !existingLog) {
      firstEmptyRef.current?.focus();
    }
  }, [isLocked, existingLog, date]);

  const copyYesterday = () => {
    if (!yesterdayLog) return;
    setWeight(String(yesterdayLog.weight));
    setCalories(String(yesterdayLog.calories));
    setProtein(String(yesterdayLog.protein));
    setSteps(String(yesterdayLog.steps));
    setWater(String(yesterdayLog.water));
    setSleep(String(yesterdayLog.sleep));
    setWorkout(yesterdayLog.workout);
    setCardio(yesterdayLog.cardio);
    if (yesterdayLog.carbs != null) setCarbs(String(yesterdayLog.carbs));
    if (yesterdayLog.fats != null) setFats(String(yesterdayLog.fats));
    setFruit(yesterdayLog.fruit);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) return;
    setErrors({});

    const data: DailyLogFormData = {
      weight: Number(weight) || 0,
      calories: Number(calories) || 0,
      protein: Number(protein) || 0,
      steps: Number(steps) || 0,
      water: Number(water) || 0,
      sleep: Number(sleep) || 0,
      workout,
      cardio,
      carbs: carbs ? Number(carbs) : null,
      fats: fats ? Number(fats) : null,
      fruit,
    };

    const result = dailyLogSchema.safeParse(data);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        fieldErrors[issue.path[0] as string] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    await onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {isLocked && (
        <div className="bg-status-warning/10 border border-status-warning/30 text-status-warning text-sm rounded-input px-3 py-2">
          This log is locked (older than 7 days). View only.
        </div>
      )}

      {!isLocked && yesterdayLog && !existingLog && (
        <Button type="button" variant="ghost" size="sm" onClick={copyYesterday}>
          Copy yesterday&apos;s values
        </Button>
      )}

      {/* Required fields */}
      <Input ref={firstEmptyRef} label="Weight (kg)" type="number" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} error={errors.weight} disabled={isLocked} />
      <Input label="Calories (kcal)" type="number" value={calories} onChange={(e) => setCalories(e.target.value)} error={errors.calories} disabled={isLocked} />
      <Input label="Protein (g)" type="number" value={protein} onChange={(e) => setProtein(e.target.value)} error={errors.protein} disabled={isLocked} />
      <Input label="Steps" type="number" value={steps} onChange={(e) => setSteps(e.target.value)} error={errors.steps} disabled={isLocked} />
      <Input label="Water (L)" type="number" step="0.5" value={water} onChange={(e) => setWater(e.target.value)} error={errors.water} disabled={isLocked} />
      <Input label="Sleep (hrs)" type="number" step="0.5" value={sleep} onChange={(e) => setSleep(e.target.value)} error={errors.sleep} disabled={isLocked} />

      <Toggle label="Workout" checked={workout} onChange={setWorkout} disabled={isLocked} />
      <Toggle label="Cardio" checked={cardio} onChange={setCardio} disabled={isLocked} />

      {/* Optional section */}
      <button
        type="button"
        onClick={() => setShowOptional(!showOptional)}
        className="text-sm text-text-secondary hover:text-text-primary transition-colors"
      >
        {showOptional ? "Hide optional fields" : "Show optional fields"}
      </button>

      {showOptional && (
        <div className="space-y-4 pl-2 border-l-2 border-border">
          <Input label="Carbs (g)" type="number" value={carbs} onChange={(e) => setCarbs(e.target.value)} disabled={isLocked} />
          <Input label="Fats (g)" type="number" value={fats} onChange={(e) => setFats(e.target.value)} disabled={isLocked} />
          <Toggle label="Fruit" checked={fruit} onChange={setFruit} disabled={isLocked} />
        </div>
      )}

      {/* Auto-calculated indicators */}
      {existingLog && (
        <div className="flex gap-3">
          <Badge variant={existingLog.protein_hit ? "success" : "error"}>
            Protein {existingLog.protein_hit ? "Hit" : "Missed"}
          </Badge>
          <Badge variant={existingLog.calories_ok ? "success" : "error"}>
            Calories {existingLog.calories_ok ? "OK" : "Off"}
          </Badge>
        </div>
      )}

      {/* Sticky save button */}
      {!isLocked && (
        <div className="sticky bottom-4 pt-4">
          <Button type="submit" className="w-full" size="lg" loading={loading}>
            {existingLog ? "Update Log" : "Save Log"}
          </Button>
        </div>
      )}
    </form>
  );
}
