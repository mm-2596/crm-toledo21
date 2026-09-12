"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";

const STORAGE_KEY = "toledo21-compare";
const MAX_COMPARE = 4;

interface CompareContextValue {
  ids: string[];
  isComparing: (id: string) => boolean;
  toggle: (id: string) => void;
  remove: (id: string) => void;
  clear: () => void;
  atLimit: boolean;
}

const CompareContext = createContext<CompareContextValue | null>(null);

export function CompareProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Leer localStorage debe esperar al montaje en cliente (no existe en el
    // render de servidor), así que este setState post-hidratación es
    // intencional: evita un desajuste de hidratación en vez de causarlo.
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (stored) setIds(JSON.parse(stored));
    } catch {
      // localStorage puede fallar en modo privado; se ignora y se sigue sin comparador persistente.
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    } catch {
      // idem
    }
  }, [ids, hydrated]);

  function toggle(id: string) {
    setIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= MAX_COMPARE) return prev;
      return [...prev, id];
    });
  }

  function remove(id: string) {
    setIds((prev) => prev.filter((x) => x !== id));
  }

  function clear() {
    setIds([]);
  }

  return (
    <CompareContext.Provider
      value={{ ids, isComparing: (id) => ids.includes(id), toggle, remove, clear, atLimit: ids.length >= MAX_COMPARE }}
    >
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error("useCompare debe usarse dentro de CompareProvider");
  return ctx;
}
