"use client";

import { useState } from "react";
import { profileSchema } from "@/lib/validators";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import type { User } from "@/types/user";

interface ProfileFormProps {
  user: User;
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
  loading: boolean;
}

export default function ProfileForm({ user, onSubmit, loading }: ProfileFormProps) {
  const [name, setName] = useState(user.name);
  const [age, setAge] = useState(String(user.age || ""));
  const [heightCm, setHeightCm] = useState(String(user.height_cm || ""));
  const [sittingHours, setSittingHours] = useState(String(user.avg_sitting_hours || ""));
  const [dietType, setDietType] = useState(user.diet_type);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const data = {
      name,
      age: Number(age),
      gender: user.gender,
      height_cm: Number(heightCm),
      weight: 0, // placeholder, not used in update
      avg_sitting_hours: Number(sittingHours),
      diet_type: dietType,
    };

    await onSubmit({
      name: data.name,
      age: data.age,
      height_cm: data.height_cm,
      avg_sitting_hours: data.avg_sitting_hours,
      diet_type: data.diet_type,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} error={errors.name} />
      <Input label="Age" type="number" value={age} onChange={(e) => setAge(e.target.value)} error={errors.age} />
      <Input label="Height (cm)" type="number" value={heightCm} onChange={(e) => setHeightCm(e.target.value)} />
      <Input label="Avg Sitting Hours" type="number" value={sittingHours} onChange={(e) => setSittingHours(e.target.value)} />
      <div>
        <label className="block text-sm text-text-secondary mb-1.5">Diet Type</label>
        <select value={dietType} onChange={(e) => setDietType(e.target.value)} className="input-field w-full">
          <option value="Vegetarian">Vegetarian</option>
          <option value="Non-Vegetarian">Non-Vegetarian</option>
        </select>
      </div>
      <Button type="submit" className="w-full" loading={loading}>
        Save Profile
      </Button>
    </form>
  );
}
