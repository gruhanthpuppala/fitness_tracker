export type WorkoutType = "weight_training" | "cardio" | "bodyweight_training";

export interface DailyLog {
  id: string;
  date: string;
  weight: number;
  calories: number;
  protein: number;
  carbs: number | null;
  fats: number | null;
  fibre: number;
  steps: number;
  water: number;
  sleep: number;
  workout: boolean;
  workout_type: WorkoutType | null;
  fruit: boolean;
  protein_hit: boolean;
  calories_ok: boolean;
  created_at: string;
  updated_at: string;
}

export interface DailyLogFormData {
  weight: number;
  calories: number;
  protein: number;
  steps: number;
  water: number;
  sleep: number;
  workout: boolean;
  workout_type?: WorkoutType | null;
  carbs?: number | null;
  fats?: number | null;
  fibre?: number;
  fruit?: boolean;
}

export type MealType = "breakfast" | "lunch" | "snack" | "dinner";

export interface FoodEntry {
  id: string;
  food: string;
  food_name: string;
  meal_type: MealType;
  quantity_grams: number;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  fibre: number;
  created_at: string;
}

export interface Food {
  id: string;
  name: string;
  category: string;
  diet_type: string;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fats_per_100g: number;
  fibre_per_100g: number;
  is_custom: boolean;
}

export interface CustomMetricDefinition {
  id: string;
  name: string;
  unit: string;
  is_active: boolean;
  created_at: string;
}

export interface CustomMetricEntry {
  id: string;
  definition: string;
  metric_name: string;
  metric_unit: string;
  value: number;
  created_at: string;
}
