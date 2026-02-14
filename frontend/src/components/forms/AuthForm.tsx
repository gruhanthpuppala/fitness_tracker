"use client";

import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

interface AuthFormProps {
  fields: { name: string; label: string; type: string; value: string; onChange: (v: string) => void; error?: string }[];
  onSubmit: (e: React.FormEvent) => void;
  submitLabel: string;
  loading: boolean;
  error?: string;
}

export default function AuthForm({ fields, onSubmit, submitLabel, loading, error }: AuthFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error && (
        <div className="bg-status-error/10 border border-status-error/30 text-status-error text-sm rounded-input px-3 py-2">
          {error}
        </div>
      )}
      {fields.map((field) => (
        <Input
          key={field.name}
          label={field.label}
          type={field.type}
          value={field.value}
          onChange={(e) => field.onChange(e.target.value)}
          error={field.error}
        />
      ))}
      <Button type="submit" className="w-full" loading={loading}>
        {submitLabel}
      </Button>
    </form>
  );
}
