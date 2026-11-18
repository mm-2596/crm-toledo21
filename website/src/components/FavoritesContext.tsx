"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";

const STORAGE_KEY = "toledo21-favorites";

export interface FavoriteInfo {
  title: string;
  reference?: string;
  image?: string | null;
}

interface FavoritesContextValue {
  ids: string[];
  isFavorite: (id: string) => boolean;
  /** Si se pasa la información de la propiedad, al añadirla salta el aviso «Guardada» (ver FavoritePrompt). */
  toggle: (id: string, info?: FavoriteInfo) => void;
  remove: (id: string) => void;
  /** Última propiedad guardada: la usa el pop-up de contacto. */
  lastAdded: (FavoriteInfo & { id: string; at: number }) | null;
  dismissLastAdded: () => void;
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [lastAdded, setLastAdded] = useState<FavoritesContextValue["lastAdded"]>(null);

  useEffect(() => {
    // Igual que el comparador: leer localStorage espera al montaje en
    // cliente, así que este setState post-hidratación es intencional.
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (stored) setIds(JSON.parse(stored));
    } catch {
      // localStorage puede fallar en modo privado; se ignora y se sigue sin favoritos persistentes.
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

  function toggle(id: string, info?: FavoriteInfo) {
    const adding = !ids.includes(id);
    setIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    if (adding && info) setLastAdded({ id, ...info, at: Date.now() });
    else if (!adding) setLastAdded((cur) => (cur?.id === id ? null : cur));
  }

  function remove(id: string) {
    setIds((prev) => prev.filter((x) => x !== id));
  }

  return (
    <FavoritesContext.Provider
      value={{ ids, isFavorite: (id) => ids.includes(id), toggle, remove, lastAdded, dismissLastAdded: () => setLastAdded(null) }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites debe usarse dentro de FavoritesProvider");
  return ctx;
}
