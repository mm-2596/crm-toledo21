import type { Metadata } from "next";
import { getAgents } from "@/lib/api";
import { AgentCard } from "@/components/AgentCard";

export const metadata: Metadata = {
  title: "Nuestro equipo",
  description:
    "Conoce a los agentes de Toledo21: sus propiedades en cartera y las reseñas reales de clientes a los que ya han ayudado.",
};

export default async function TeamDirectoryPage() {
  const agents = await getAgents().catch(() => []);

  return (
    <div className="mx-auto max-w-7xl px-6 pb-16 pt-28">
      <div className="max-w-2xl">
        <p className="text-xs font-medium uppercase tracking-wider text-gold">Nuestro equipo</p>
        <h1 className="mt-2 font-display text-3xl text-ink sm:text-4xl">Las personas detrás de Toledo21</h1>
        <p className="mt-3 text-sm text-ink-soft sm:text-base">
          Cada propiedad tiene un agente real detrás, disponible para acompañarte de principio a fin. Consulta su
          cartera y lo que opinan quienes ya han trabajado con ellos.
        </p>
      </div>

      {agents.length === 0 ? (
        <div className="mt-12 rounded-2xl border border-dashed border-line p-12 text-center">
          <p className="text-sm text-ink-soft">Todavía no hay agentes publicados. Vuelve pronto.</p>
        </div>
      ) : (
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent, index) => (
            <AgentCard key={agent.id} agent={agent} index={index} />
          ))}
        </div>
      )}
    </div>
  );
}
