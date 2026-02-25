"use client";

import { useState } from "react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import type { UserTarget } from "@/types/user";

interface TargetFormProps {
  targets: UserTarget | null;
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
  loading: boolean;
}

export default function TargetForm({ targets, onSubmit, loading }: TargetFormProps) {
  const [calorieTarget, setCalorieTarget] = useState(String(targets?.calorie_target || ""));
  const [proteinTarget, setProteinTarget] = useState(String(targets?.protein_target || ""));
  const [goalWeight, setGoalWeight] = useState(String(targets?.goal_weight || ""));
  const [carbsTarget, setCarbsTarget] = useState(targets?.carbs_target != null ? String(targets.carbs_target) : "");
  const [fatsTarget, setFatsTarget] = useState(targets?.fats_target != null ? String(targets.fats_target) : "");
  const [fibreTarget, setFibreTarget] = useState(targets?.fibre_target != null ? String(targets.fibre_target) : "");
  const [waterTarget, setWaterTarget] = useState(targets?.water_target != null ? String(targets.water_target) : "");
  const [sleepTarget, setSleepTarget] = useState(targets?.sleep_target != null ? String(targets.sleep_target) : "");
  const [stepsTarget, setStepsTarget] = useState(targets?.steps_target != null ? String(targets.steps_target) : "");
  const [showOptional, setShowOptional] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      calorie_target: Number(calorieTarget),
      protein_target: Number(proteinTarget),
      goal_weight: Number(goalWeight),
      carbs_target: carbsTarget ? Number(carbsTarget) : null,
      fats_target: fatsTarget ? Number(fatsTarget) : null,
      fibre_target: fibreTarget ? Number(fibreTarget) : null,
      water_target: waterTarget ? Number(waterTarget) : null,
      sleep_target: sleepTarget ? Number(sleepTarget) : null,
      steps_target: stepsTarget ? Number(stepsTarget) : null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="Daily Calorie Target (kcal)" type="number" value={calorieTarget} onChange={(e) => setCalorieTarget(e.target.value)} />
      <Input label="Daily Protein Target (g)" type="number" value={proteinTarget} onChange={(e) => setProteinTarget(e.target.value)} />
      <Input label="Goal Weight (kg)" type="number" step="0.1" value={goalWeight} onChange={(e) => setGoalWeight(e.target.value)} />

      <button
        type="button"
        onClick={() => setShowOptional(!showOptional)}
        className="text-sm text-text-secondary hover:text-text-primary transition-colors"
      >
        {showOptional ? "Hide optional targets" : "Show optional targets"}
      </button>

      {showOptional && (
        <div className="space-y-4 pl-2 border-l-2 border-border">
          <Input label="Carbs Target (g)" type="number" value={carbsTarget} onChange={(e) => setCarbsTarget(e.target.value)} />
          <Input label="Fats Target (g)" type="number" value={fatsTarget} onChange={(e) => setFatsTarget(e.target.value)} />
          <Input label="Fibre Target (g)" type="number" value={fibreTarget} onChange={(e) => setFibreTarget(e.target.value)} />
          <Input label="Water Target (L)" type="number" step="0.1" value={waterTarget} onChange={(e) => setWaterTarget(e.target.value)} />
          <Input label="Sleep Target (hrs)" type="number" step="0.5" value={sleepTarget} onChange={(e) => setSleepTarget(e.target.value)} />
          <Input label="Steps Target" type="number" value={stepsTarget} onChange={(e) => setStepsTarget(e.target.value)} />
        </div>
      )}

      <Button type="submit" className="w-full" loading={loading}>
        Save Targets
      </Button>
    </form>
  );
}
