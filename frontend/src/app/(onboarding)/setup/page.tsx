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

  // Required target fields
  const [calorieTarget, setCalorieTarget] = useState("");
  const [proteinTarget, setProteinTarget] = useState("");
  const [goalWeight, setGoalWeight] = useState("");

  // Optional target fields
  const [carbsTarget, setCarbsTarget] = useState("");
  const [fatsTarget, setFatsTarget] = useState("");
  const [fibreTarget, setFibreTarget] = useState("");
  const [waterTarget, setWaterTarget] = useState("");
  const [sleepTarget, setSleepTarget] = useState("");
  const [stepsTarget, setStepsTarget] = useState("");
  const [showOptionalTargets, setShowOptionalTargets] = useState(false);

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
      carbs_target: carbsTarget ? Number(carbsTarget) : null,
      fats_target: fatsTarget ? Number(fatsTarget) : null,
      fibre_target: fibreTarget ? Number(fibreTarget) : null,
      water_target: waterTarget ? Number(waterTarget) : null,
      sleep_target: sleepTarget ? Number(sleepTarget) : null,
      steps_target: stepsTarget ? Number(stepsTarget) : null,
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
      const payload: Record<string, unknown> = {
        calorie_target: Number(calorieTarget),
        protein_target: Number(proteinTarget),
        goal_weight: Number(goalWeight),
        weight: Number(weight),
      };
      if (carbsTarget) payload.carbs_target = Number(carbsTarget);
      if (fatsTarget) payload.fats_target = Number(fatsTarget);
      if (fibreTarget) payload.fibre_target = Number(fibreTarget);
      if (waterTarget) payload.water_target = Number(waterTarget);
      if (sleepTarget) payload.sleep_target = Number(sleepTarget);
      if (stepsTarget) payload.steps_target = Number(stepsTarget);

      const res = await api.post("/onboarding/targets/", payload);
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

  const optionalTargetRows = [
    { label: "Carbs Target", value: carbsTarget, unit: "g" },
    { label: "Fats Target", value: fatsTarget, unit: "g" },
    { label: "Fibre Target", value: fibreTarget, unit: "g" },
    { label: "Water Target", value: waterTarget, unit: "L" },
    { label: "Sleep Target", value: sleepTarget, unit: "hrs" },
    { label: "Steps Target", value: stepsTarget, unit: "" },
  ].filter((r) => r.value);

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
                      <option value="Vegan">Vegan</option>
                      <option value="Eggetarian">Eggetarian</option>
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

                  <button
                    type="button"
                    onClick={() => setShowOptionalTargets(!showOptionalTargets)}
                    className="text-sm text-text-secondary hover:text-text-primary transition-colors"
                  >
                    {showOptionalTargets ? "Hide optional targets" : "Set optional targets (carbs, fats, fibre, water, sleep, steps)"}
                  </button>

                  {showOptionalTargets && (
                    <div className="space-y-4 pl-2 border-l-2 border-border">
                      <Input label="Carbs Target (g)" type="number" value={carbsTarget} onChange={(e) => setCarbsTarget(e.target.value)} />
                      <Input label="Fats Target (g)" type="number" value={fatsTarget} onChange={(e) => setFatsTarget(e.target.value)} />
                      <Input label="Fibre Target (g)" type="number" value={fibreTarget} onChange={(e) => setFibreTarget(e.target.value)} />
                      <Input label="Water Target (L)" type="number" step="0.1" value={waterTarget} onChange={(e) => setWaterTarget(e.target.value)} />
                      <Input label="Sleep Target (hrs)" type="number" step="0.5" value={sleepTarget} onChange={(e) => setSleepTarget(e.target.value)} />
                      <Input label="Steps Target" type="number" value={stepsTarget} onChange={(e) => setStepsTarget(e.target.value)} />
                    </div>
                  )}

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
                  {optionalTargetRows.length > 0 && (
                    <>
                      <div className="border-t border-border my-3" />
                      {optionalTargetRows.map((r) => (
                        <div key={r.label} className="flex justify-between">
                          <span className="text-text-secondary">{r.label}</span>
                          <span>{r.value}{r.unit ? ` ${r.unit}` : ""}</span>
                        </div>
                      ))}
                    </>
                  )}
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
