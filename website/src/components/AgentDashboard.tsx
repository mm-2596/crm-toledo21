"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogOut } from "lucide-react";
import { PropertyCard } from "./PropertyCard";
import { formatCurrency, statusLabels } from "@/lib/format";
import type { PublicProperty } from "@/lib/types";

export function AgentDashboard({
  agent,
  properties,
}: {
  agent: { id: string; name: string; email: string };
  properties: PublicProperty[];
}) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/agent-session", { method: "DELETE" });
    router.refresh();
  }

  const totalValue = properties.reduce((sum, p) => sum + p.price, 0);
  const active = properties.filter((p) => p.status === "DISPONIBLE").length;

  return (
    <div className="mx-auto max-w-7xl px-6 pb-14 pt-28">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-ink sm:text-4xl">Hola, {agent.name}</h1>
          <p className="mt-1 text-sm text-ink-soft">{agent.email}</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm text-ink-soft hover:text-ink"
        >
          <LogOut size={15} /> Cerrar sesión
        </button>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Stat label="Propiedades" value={String(properties.length)} />
        <Stat label="Disponibles" value={String(active)} />
        <Stat label="Valor total en cartera" value={formatCurrency(totalValue)} />
      </div>

      <div className="mt-12">
        <h2 className="font-display text-xl text-ink">Tus propiedades</h2>
        {properties.length === 0 ? (
          <p className="mt-4 text-sm text-ink-soft">Todavía no tienes propiedades asignadas.</p>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {properties.map((p, i) => (
              <div key={p.id}>
                <PropertyCard property={p} index={i} />
                <p className="mt-2 text-xs font-medium text-gold">{statusLabels[p.status]}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="mt-12 text-sm text-ink-soft">
        Para gestionar tus propiedades, contactos y pipeline completo, entra en el{" "}
        <Link href="https://crmtoledo21.neuraltech.pro" className="text-ink underline underline-offset-4">
          CRM Toledo21
        </Link>
        .
      </p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-line bg-paper-dim p-6">
      <p className="text-xs text-ink-soft">{label}</p>
      <p className="mt-1 font-display text-2xl text-ink">{value}</p>
    </div>
  );
}
