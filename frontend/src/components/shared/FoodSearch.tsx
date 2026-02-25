"use client";

import { useState, useEffect, useRef } from "react";
import api from "@/lib/api";
import type { Food } from "@/types/log";

interface FoodSearchProps {
  onSelect: (food: Food) => void;
}

export default function FoodSearch({ onSelect }: FoodSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Food[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.get("/foods/", { params: { search: query } });
        const foods = res.data.data?.results || res.data.results || res.data.data || res.data || [];
        setResults(Array.isArray(foods) ? foods : []);
        setOpen(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(debounceRef.current);
  }, [query]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (food: Food) => {
    onSelect(food);
    setQuery("");
    setResults([]);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
        placeholder="Search foods..."
        className="input-field w-full"
      />
      {loading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <svg className="animate-spin h-4 w-4 text-text-secondary" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      )}
      {open && results.length > 0 && (
        <div className="absolute z-20 mt-1 w-full max-h-60 overflow-y-auto rounded-card border border-border bg-bg-surface shadow-lg">
          {results.map((food) => (
            <button
              key={food.id}
              type="button"
              onClick={() => handleSelect(food)}
              className="w-full text-left px-3 py-2 hover:bg-bg-elevated transition-colors border-b border-border last:border-b-0"
            >
              <div className="font-medium text-sm text-text-primary">{food.name}</div>
              <div className="text-xs text-text-secondary">
                {food.calories_per_100g} kcal &middot; P {food.protein_per_100g}g &middot; C {food.carbs_per_100g}g &middot; F {food.fats_per_100g}g per 100g
              </div>
            </button>
          ))}
        </div>
      )}
      {open && query.length >= 2 && !loading && results.length === 0 && (
        <div className="absolute z-20 mt-1 w-full rounded-card border border-border bg-bg-surface shadow-lg px-3 py-3 text-sm text-text-secondary">
          No foods found
        </div>
      )}
    </div>
  );
}
