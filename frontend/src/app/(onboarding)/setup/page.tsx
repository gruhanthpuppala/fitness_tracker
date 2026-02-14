"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { profileSchema, targetSchema } from "@/lib/validators";
import { computeBmi, getBmiCategory } from "@/lib/utils";
import api from "@/lib/api";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";
import ProgressBar from "@/components/ui/ProgressBar";

const steps = ["Profile", "Targets", "Review"];

export default function SetupPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Profile fields
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [weight, setWeight] = useState("");
  const [sittingHours, setSittingHours] = useState("");
  const [dietType, setDietType] = useState("");

  // Target fields
  const [calorieTarget, setCalorieTarget] = useState("");
  const [proteinTarget, setProteinTarget] = useState("");
  const [goalWeight, setGoalWeight] = useState("");

  // Review data
  const [bmi, setBmi] = useState<number | null>(null);
  const [bmiCategory, setBmiCategory] = useState("");

  const handleProfileNext = async () => {
    setErrors({});
    const result = profileSchema.safeParse({
      name,
      age: Number(age),
      gender,
      height_cm: Number(heightCm),
      weight: Number(weight),
      avg_sitting_hours: Number(sittingHours),
      diet_type: dietType,
    });

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        fieldErrors[issue.path[0] as string] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    try {
      await api.post("/onboarding/profile/", {
        name,
        age: Number(age),
        gender,
        height_cm: Number(heightCm),
        avg_sitting_hours: Number(sittingHours),
        diet_type: dietType,
      });
      setStep(1);
    } catch {
      setErrors({ _form: "Failed to save profile. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const handleTargetsNext = async () => {
    setErrors({});
    const result = targetSchema.safeParse({
      calorie_target: Number(calorieTarget),
      protein_target: Number(proteinTarget),
      goal_weight: Number(goalWeight),
    });

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        fieldErrors[issue.path[0] as string] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/onboarding/targets/", {
        calorie_target: Number(calorieTarget),
        protein_target: Number(proteinTarget),
        goal_weight: Number(goalWeight),
        weight: Number(weight),
      });
      const data = res.data.data || res.data;
      setBmi(data.bmi);
      setBmiCategory(data.bmi_category);
      setStep(2);
    } catch {
      setErrors({ _form: "Failed to save targets. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = () => {
    router.push("/dashboard");
  };

  const slideVariants = {
    enter: (direction: number) => ({ x: direction > 0 ? 300 : -300, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (direction: number) => ({ x: direction > 0 ? -300 : 300, opacity: 0 }),
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-text-secondary mb-2">
            {steps.map((s, i) => (
              <span key={s} className={i <= step ? "text-accent-primary font-medium" : ""}>
                {s}
              </span>
            ))}
          </div>
          <ProgressBar value={step + 1} max={3} showValue={false} />
        </div>

        <AnimatePresence mode="wait" custom={1}>
          {step === 0 && (
            <motion.div
              key="profile"
              custom={1}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.15, ease: "easeOut" }}
            >
              <Card className="p-6">
                <h2 className="text-xl font-semibold text-text-primary mb-4">Profile Setup</h2>
                {errors._form && (
                  <div className="bg-status-error/10 text-status-error text-sm rounded-input px-3 py-2 mb-4">
                    {errors._form}
                  </div>
                )}
                <div className="space-y-4">
                  <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} error={errors.name} autoFocus />
                  <Input label="Age" type="number" value={age} onChange={(e) => setAge(e.target.value)} error={errors.age} />
                  <div>
                    <label className="block text-sm text-text-secondary mb-1.5">Gender</label>
                    <select value={gender} onChange={(e) => setGender(e.target.value)} className="input-field w-full">
                      <option value="">Select gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                    {errors.gender && <p className="mt-1 text-sm text-status-error">{errors.gender}</p>}
                  </div>
                  <Input label="Height (cm)" type="number" value={heightCm} onChange={(e) => setHeightCm(e.target.value)} error={errors.height_cm} />
                  <Input label="Current Weight (kg)" type="number" value={weight} onChange={(e) => setWeight(e.target.value)} error={errors.weight} />
                  <Input label="Avg Sitting Hours/Day" type="number" value={sittingHours} onChange={(e) => setSittingHours(e.target.value)} error={errors.avg_sitting_hours} />
                  <div>
                    <label className="block text-sm text-text-secondary mb-1.5">Diet Type</label>
                    <select value={dietType} onChange={(e) => setDietType(e.target.value)} className="input-field w-full">
                      <option value="">Select diet</option>
                      <option value="Vegetarian">Vegetarian</option>
                      <option value="Non-Vegetarian">Non-Vegetarian</option>
                    </select>
                    {errors.diet_type && <p className="mt-1 text-sm text-status-error">{errors.diet_type}</p>}
                  </div>
                  <Button onClick={handleProfileNext} className="w-full" loading={loading}>
                    Next
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div
              key="targets"
              custom={1}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.15, ease: "easeOut" }}
            >
              <Card className="p-6">
                <h2 className="text-xl font-semibold text-text-primary mb-4">Set Your Targets</h2>
                {errors._form && (
                  <div className="bg-status-error/10 text-status-error text-sm rounded-input px-3 py-2 mb-4">
                    {errors._form}
                  </div>
                )}
                <div className="space-y-4">
                  <Input label="Daily Calorie Target (kcal)" type="number" value={calorieTarget} onChange={(e) => setCalorieTarget(e.target.value)} error={errors.calorie_target} autoFocus />
                  <Input label="Daily Protein Target (g)" type="number" value={proteinTarget} onChange={(e) => setProteinTarget(e.target.value)} error={errors.protein_target} />
                  <Input label="Goal Weight (kg)" type="number" value={goalWeight} onChange={(e) => setGoalWeight(e.target.value)} error={errors.goal_weight} />
                  <div className="flex gap-3">
                    <Button variant="secondary" onClick={() => setStep(0)} className="flex-1">
                      Back
                    </Button>
                    <Button onClick={handleTargetsNext} className="flex-1" loading={loading}>
                      Next
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="review"
              custom={1}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.15, ease: "easeOut" }}
            >
              <Card className="p-6">
                <h2 className="text-xl font-semibold text-text-primary mb-4">Review & Confirm</h2>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between"><span className="text-text-secondary">Name</span><span>{name}</span></div>
                  <div className="flex justify-between"><span className="text-text-secondary">Age</span><span>{age}</span></div>
                  <div className="flex justify-between"><span className="text-text-secondary">Gender</span><span>{gender}</span></div>
                  <div className="flex justify-between"><span className="text-text-secondary">Height</span><span>{heightCm} cm</span></div>
                  <div className="flex justify-between"><span className="text-text-secondary">Weight</span><span>{weight} kg</span></div>
                  <div className="flex justify-between"><span className="text-text-secondary">Diet</span><span>{dietType}</span></div>
                  <div className="border-t border-border my-3" />
                  <div className="flex justify-between"><span className="text-text-secondary">Calorie Target</span><span>{calorieTarget} kcal</span></div>
                  <div className="flex justify-between"><span className="text-text-secondary">Protein Target</span><span>{proteinTarget} g</span></div>
                  <div className="flex justify-between"><span className="text-text-secondary">Goal Weight</span><span>{goalWeight} kg</span></div>
                  <div className="border-t border-border my-3" />
                  <div className="flex justify-between font-medium">
                    <span className="text-text-secondary">BMI</span>
                    <span>{bmi}</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span className="text-text-secondary">Category</span>
                    <span>{bmiCategory}</span>
                  </div>
                </div>
                <Button onClick={handleFinish} className="w-full mt-6">
                  Start Tracking
                </Button>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
