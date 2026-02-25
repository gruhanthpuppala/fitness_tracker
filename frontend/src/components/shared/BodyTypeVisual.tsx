"use client";

import Image from "next/image";

interface BodyTypeVisualProps {
  gender: string;
  bmiCategory: string;
  bmi: number | null;
}

const CATEGORY_MAP: Record<string, string> = {
  Underweight: "underweight",
  Normal: "normal",
  Overweight: "overweight",
  Obese: "obese",
};

export default function BodyTypeVisual({ gender, bmiCategory, bmi }: BodyTypeVisualProps) {
  const genderKey = gender === "Female" ? "female" : "male";
  const categoryKey = CATEGORY_MAP[bmiCategory] || "normal";
  const src = `/images/body-models/${genderKey}-${categoryKey}.svg`;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-24 h-32">
        <Image
          src={src}
          alt={`${bmiCategory} body type`}
          fill
          className="object-contain"
        />
      </div>
      <div className="text-center mt-2">
        <div className="text-sm font-medium text-text-primary">{bmiCategory}</div>
        {bmi != null && (
          <div className="text-xs text-text-secondary">BMI {bmi}</div>
        )}
      </div>
    </div>
  );
}
