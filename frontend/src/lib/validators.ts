import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z
  .object({
    email: z.string().email("Invalid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/\d/, "Password must contain at least 1 number")
      .regex(/[!@#$%^&*(),.?":{}|<>]/, "Password must contain at least 1 special character"),
    password_confirm: z.string(),
  })
  .refine((data) => data.password === data.password_confirm, {
    message: "Passwords do not match",
    path: ["password_confirm"],
  });

export const profileSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  age: z.number().int().min(1, "Age must be at least 1").max(120, "Age must be at most 120"),
  gender: z.enum(["Male", "Female", "Other"], { required_error: "Gender is required" }),
  height_cm: z.number().min(0.1, "Height must be greater than 0"),
  weight: z.number().min(0.1, "Weight must be greater than 0"),
  avg_sitting_hours: z.number().min(0, "Must be 0 or more"),
  diet_type: z.enum(["Vegetarian", "Non-Vegetarian"], { required_error: "Diet type is required" }),
});

export const targetSchema = z.object({
  calorie_target: z.number().int().min(1, "Calorie target must be at least 1"),
  protein_target: z.number().int().min(1, "Protein target must be at least 1"),
  goal_weight: z.number().min(0.1, "Goal weight must be greater than 0"),
});

export const dailyLogSchema = z.object({
  weight: z.number().min(0.1, "Weight is required"),
  calories: z.number().int().min(0, "Calories must be 0 or more"),
  protein: z.number().int().min(0, "Protein must be 0 or more"),
  steps: z.number().int().min(0, "Steps must be 0 or more"),
  water: z.number().min(0, "Water must be 0 or more"),
  sleep: z.number().min(0, "Sleep must be 0 or more").max(24, "Sleep cannot exceed 24 hours"),
  workout: z.boolean(),
  cardio: z.boolean(),
  carbs: z.number().int().min(0).nullable().optional(),
  fats: z.number().int().min(0).nullable().optional(),
  fruit: z.boolean().optional(),
});

export const measurementSchema = z.object({
  neck: z.number().min(0.1).nullable().optional(),
  chest: z.number().min(0.1).nullable().optional(),
  shoulders: z.number().min(0.1).nullable().optional(),
  bicep: z.number().min(0.1).nullable().optional(),
  forearm: z.number().min(0.1).nullable().optional(),
  waist: z.number().min(0.1).nullable().optional(),
  hips: z.number().min(0.1).nullable().optional(),
  thigh: z.number().min(0.1).nullable().optional(),
});

export const passwordChangeSchema = z
  .object({
    current_password: z.string().min(1, "Current password is required"),
    new_password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/\d/, "Password must contain at least 1 number")
      .regex(/[!@#$%^&*(),.?":{}|<>]/, "Password must contain at least 1 special character"),
    new_password_confirm: z.string(),
  })
  .refine((data) => data.new_password === data.new_password_confirm, {
    message: "Passwords do not match",
    path: ["new_password_confirm"],
  });

export const passwordResetSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ProfileFormData = z.infer<typeof profileSchema>;
export type TargetFormData = z.infer<typeof targetSchema>;
export type DailyLogFormData = z.infer<typeof dailyLogSchema>;
export type MeasurementFormData = z.infer<typeof measurementSchema>;
export type PasswordChangeFormData = z.infer<typeof passwordChangeSchema>;
