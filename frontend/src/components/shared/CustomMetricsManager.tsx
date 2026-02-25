"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import type { CustomMetricDefinition, CustomMetricEntry } from "@/types/log";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

interface CustomMetricsManagerProps {
  date: string;
  hasLog: boolean;
  disabled?: boolean;
}

export default function CustomMetricsManager({ date, hasLog, disabled }: CustomMetricsManagerProps) {
  const [definitions, setDefinitions] = useState<CustomMetricDefinition[]>([]);
  const [entries, setEntries] = useState<CustomMetricEntry[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newUnit, setNewUnit] = useState("");
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Per-definition value inputs: { definitionId: inputValue }
  const [entryValues, setEntryValues] = useState<Record<string, string>>({});
  const [savingEntry, setSavingEntry] = useState<string | null>(null);

  const loadDefinitions = useCallback(async () => {
    try {
      const res = await api.get("/logs/custom-metrics/");
      const defs = res.data.data?.results || res.data.results || res.data.data || res.data || [];
      setDefinitions(Array.isArray(defs) ? defs : []);
    } catch {
      setDefinitions([]);
    }
  }, []);

  const loadEntries = useCallback(async () => {
    if (!hasLog) {
      setEntries([]);
      return;
    }
    try {
      const res = await api.get(`/logs/${date}/custom-entries/`);
      const items = res.data.data?.results || res.data.results || res.data.data || res.data || [];
      setEntries(Array.isArray(items) ? items : []);
    } catch {
      setEntries([]);
    }
  }, [date, hasLog]);

  useEffect(() => {
    loadDefinitions();
  }, [loadDefinitions]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  // Sync entry values from loaded entries
  useEffect(() => {
    const values: Record<string, string> = {};
    entries.forEach((e) => {
      values[e.definition] = String(e.value);
    });
    setEntryValues(values);
  }, [entries]);

  const handleCreateDefinition = async () => {
    if (!newName.trim() || !newUnit.trim()) return;
    setCreating(true);
    try {
      await api.post("/logs/custom-metrics/", { name: newName.trim(), unit: newUnit.trim() });
      setNewName("");
      setNewUnit("");
      setShowCreate(false);
      loadDefinitions();
    } catch {
      // ignore
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteDefinition = async (id: string) => {
    setDeletingId(id);
    try {
      await api.delete(`/logs/custom-metrics/${id}/`);
      loadDefinitions();
      loadEntries();
    } catch {
      // ignore
    } finally {
      setDeletingId(null);
    }
  };

  const handleSaveEntry = async (definitionId: string) => {
    const val = entryValues[definitionId];
    if (!val || isNaN(Number(val))) return;
    setSavingEntry(definitionId);
    try {
      await api.post(`/logs/${date}/custom-entries/`, {
        definition: definitionId,
        value: Number(val),
      });
      loadEntries();
    } catch {
      // ignore
    } finally {
      setSavingEntry(null);
    }
  };

  const getEntryForDefinition = (defId: string) =>
    entries.find((e) => e.definition === defId);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text-primary">Custom Metrics</h2>
        {!disabled && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowCreate(!showCreate)}
          >
            {showCreate ? "Cancel" : "+ New metric"}
          </Button>
        )}
      </div>

      {/* Create new definition */}
      {showCreate && !disabled && (
        <div className="flex items-end gap-2 p-3 border border-border rounded-card bg-bg-elevated">
          <div className="flex-1">
            <Input
              label="Metric name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Caffeine"
            />
          </div>
          <div className="w-28">
            <Input
              label="Unit"
              value={newUnit}
              onChange={(e) => setNewUnit(e.target.value)}
              placeholder="e.g. mg"
            />
          </div>
          <Button type="button" size="sm" onClick={handleCreateDefinition} loading={creating}>
            Add
          </Button>
        </div>
      )}

      {/* Definitions list with daily value inputs */}
      {definitions.length === 0 && !showCreate && (
        <p className="text-sm text-text-secondary">
          No custom metrics defined yet. Create one to start tracking.
        </p>
      )}

      {definitions.map((def) => {
        const existing = getEntryForDefinition(def.id);
        return (
          <div
            key={def.id}
            className="flex items-center gap-3 p-3 border border-border rounded-card"
          >
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-text-primary truncate">
                {def.name}
                <span className="text-text-secondary font-normal ml-1">({def.unit})</span>
              </div>
              {existing && (
                <div className="text-xs text-text-secondary mt-0.5">
                  Logged: {existing.value} {def.unit}
                </div>
              )}
            </div>

            {/* Value input — only if a daily log exists */}
            {hasLog && !disabled && (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="any"
                  value={entryValues[def.id] || ""}
                  onChange={(e) =>
                    setEntryValues((prev) => ({ ...prev, [def.id]: e.target.value }))
                  }
                  placeholder="Value"
                  className="input-field w-20 text-sm"
                />
                <Button
                  type="button"
                  size="sm"
                  variant={existing ? "secondary" : "primary"}
                  onClick={() => handleSaveEntry(def.id)}
                  loading={savingEntry === def.id}
                  disabled={!entryValues[def.id]}
                >
                  {existing ? "Update" : "Log"}
                </Button>
              </div>
            )}

            {/* Delete definition */}
            {!disabled && (
              <button
                type="button"
                onClick={() => handleDeleteDefinition(def.id)}
                disabled={deletingId === def.id}
                className="text-text-secondary hover:text-status-error transition-colors p-1 disabled:opacity-50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
