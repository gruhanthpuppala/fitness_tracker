"use client";

import { useAuth } from "@/hooks/useAuth";

export default function Header() {
  const { user } = useAuth();

  return (
    <header className="md:hidden flex items-center justify-between px-4 py-3 bg-bg-surface border-b border-border">
      <h1 className="text-lg font-bold text-accent-primary">Fitness Tracker</h1>
      {user && (
        <span className="text-sm text-text-secondary">{user.name || user.email}</span>
      )}
    </header>
  );
}
