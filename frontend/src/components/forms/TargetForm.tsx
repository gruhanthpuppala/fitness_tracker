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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      calorie_target: Number(calorieTarget),
      protein_target: Number(proteinTarget),
      goal_weight: Number(goalWeight),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="Daily Calorie Target (kcal)" type="number" value={calorieTarget} onChange={(e) => setCalorieTarget(e.target.value)} />
      <Input label="Daily Protein Target (g)" type="number" value={proteinTarget} onChange={(e) => setProteinTarget(e.target.value)} />
      <Input label="Goal Weight (kg)" type="number" step="0.1" value={goalWeight} onChange={(e) => setGoalWeight(e.target.value)} />
      <Button type="submit" className="w-full" loading={loading}>
        Save Targets
      </Button>
    </form>
  );
}
