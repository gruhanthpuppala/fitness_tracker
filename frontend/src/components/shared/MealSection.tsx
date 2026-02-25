"use client";

import { useState } from "react";
import type { Food, FoodEntry, MealType } from "@/types/log";
import api from "@/lib/api";
import FoodSearch from "./FoodSearch";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

interface MealSectionProps {
  mealType: MealType;
  date: string;
  entries: FoodEntry[];
  onEntriesChange: () => void;
  disabled?: boolean;
}

const MEAL_LABELS: Record<MealType, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  snack: "Snack",
  dinner: "Dinner",
};

export default function MealSection({ mealType, date, entries, onEntriesChange, disabled }: MealSectionProps) {
  const [expanded, setExpanded] = useState(entries.length > 0);
  const [adding, setAdding] = useState(false);
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [quantity, setQuantity] = useState("100");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const mealCalories = entries.reduce((sum, e) => sum + e.calories, 0);
  const mealProtein = entries.reduce((sum, e) => sum + Number(e.protein), 0);

  const handleAddEntry = async () => {
    if (!selectedFood || !quantity) return;
    setSaving(true);
    try {
      await api.post(`/logs/${date}/meals/`, {
        food: selectedFood.id,
        meal_type: mealType,
        quantity_grams: Number(quantity),
      });
      setSelectedFood(null);
      setQuantity("100");
      setAdding(false);
      onEntriesChange();
    } catch {
      // handled by parent
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (entryId: string) => {
    setDeletingId(entryId);
    try {
      await api.delete(`/logs/${date}/meals/${entryId}/`);
      onEntriesChange();
    } catch {
      // handled by parent
    } finally {
      setDeletingId(null);
    }
  };

  const preview = selectedFood && quantity ? {
    calories: Math.round(selectedFood.calories_per_100g * Number(quantity) / 100),
    protein: (Number(selectedFood.protein_per_100g) * Number(quantity) / 100).toFixed(1),
    carbs: (Number(selectedFood.carbs_per_100g) * Number(quantity) / 100).toFixed(1),
    fats: (Number(selectedFood.fats_per_100g) * Number(quantity) / 100).toFixed(1),
  } : null;

  return (
    <div className="border border-border rounded-card">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-bg-elevated transition-colors rounded-card"
      >
        <div className="flex items-center gap-3">
          <span className="font-medium text-text-primary">{MEAL_LABELS[mealType]}</span>
          {entries.length > 0 && (
            <span className="text-xs text-text-secondary">
              {entries.length} item{entries.length !== 1 ? "s" : ""} &middot; {mealCalories} kcal
            </span>
          )}
        </div>
        <svg
          className={`w-4 h-4 text-text-secondary transition-transform ${expanded ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          {/* Existing entries */}
          {entries.map((entry) => (
            <div key={entry.id} className="flex items-center justify-between py-2 border-b border-border last:border-b-0">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-text-primary truncate">{entry.food_name}</div>
                <div className="text-xs text-text-secondary">
                  {entry.quantity_grams}g &middot; {entry.calories} kcal &middot; P {entry.protein}g
                </div>
              </div>
              {!disabled && (
                <button
                  type="button"
                  onClick={() => handleDelete(entry.id)}
                  disabled={deletingId === entry.id}
                  className="ml-2 text-text-secondary hover:text-status-error transition-colors p-1 disabled:opacity-50"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ))}

          {/* Meal totals */}
          {entries.length > 1 && (
            <div className="text-xs text-text-secondary pt-1 border-t border-border">
              Total: {mealCalories} kcal &middot; P {mealProtein.toFixed(1)}g
            </div>
          )}

          {/* Add food flow */}
          {!disabled && !adding && (
            <Button type="button" variant="ghost" size="sm" onClick={() => setAdding(true)}>
              + Add food
            </Button>
          )}

          {!disabled && adding && (
            <div className="space-y-3 pt-2">
              <FoodSearch onSelect={setSelectedFood} />

              {selectedFood && (
                <div className="bg-bg-elevated rounded-input px-3 py-2">
                  <div className="text-sm font-medium text-text-primary">{selectedFood.name}</div>
                  <div className="flex items-end gap-3 mt-2">
                    <div className="w-28">
                      <Input
                        label="Grams"
                        type="number"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                      />
                    </div>
                    {preview && (
                      <div className="text-xs text-text-secondary pb-2">
                        {preview.calories} kcal &middot; P {preview.protein}g &middot; C {preview.carbs}g &middot; F {preview.fats}g
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button type="button" variant="secondary" size="sm" onClick={() => { setAdding(false); setSelectedFood(null); }}>
                  Cancel
                </Button>
                {selectedFood && (
                  <Button type="button" size="sm" onClick={handleAddEntry} loading={saving}>
                    Add
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
