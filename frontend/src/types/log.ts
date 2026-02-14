export interface DailyLog {
  id: string;
  date: string;
  weight: number;
  calories: number;
  protein: number;
  carbs: number | null;
  fats: number | null;
  steps: number;
  water: number;
  sleep: number;
  workout: boolean;
  cardio: boolean;
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
  cardio: boolean;
  carbs?: number | null;
  fats?: number | null;
  fruit?: boolean;
}
