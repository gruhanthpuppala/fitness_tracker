export interface User {
  id: string;
  email: string;
  name: string;
  age: number | null;
  gender: string;
  height_cm: number | null;
  diet_type: string;
  avg_sitting_hours: number | null;
  auth_provider: string;
  is_email_verified: boolean;
  is_onboarded: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserTarget {
  id: string;
  calorie_target: number;
  protein_target: number;
  goal_weight: number;
  carbs_target: number | null;
  fats_target: number | null;
  fibre_target: number | null;
  water_target: number | null;
  sleep_target: number | null;
  steps_target: number | null;
  created_at: string;
  updated_at: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  password_confirm: string;
}

export interface OnboardingProfile {
  name: string;
  age: number;
  gender: "Male" | "Female" | "Other";
  height_cm: number;
  weight: number;
  avg_sitting_hours: number;
  diet_type: "Vegetarian" | "Non-Vegetarian" | "Vegan" | "Eggetarian";
}

export interface OnboardingTargets {
  calorie_target: number;
  protein_target: number;
  goal_weight: number;
  carbs_target?: number | null;
  fats_target?: number | null;
  fibre_target?: number | null;
  water_target?: number | null;
  sleep_target?: number | null;
  steps_target?: number | null;
}
