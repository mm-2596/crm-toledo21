import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Mail, Phone, Star, Building2 } from "lucide-react";
import { getAgent } from "@/lib/api";
import { AgentAvatar } from "@/components/AgentAvatar";
import { AgentReviewForm } from "@/components/AgentReviewForm";
import { PropertyCard } from "@/components/PropertyCard";
import { formatDate } from "@/lib/format";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const agent = await getAgent(id).catch(() => null);
  if (!agent) return { title: "Agente no encontrado" };

  return {
    title: agent.name,
    description: agent.bio || `Conoce a ${agent.name}, agente de Toledo21, y sus propiedades en cartera.`,
  };
}

export default async function AgentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const agent = await getAgent(id).catch(() => null);
  if (!agent) notFound();

  return (
    <div className="mx-auto max-w-6xl px-6 pb-16 pt-28">
      <div className="flex flex-col items-center gap-4 rounded-3xl border border-line bg-paper-dim p-8 text-center sm:p-12">
        <AgentAvatar name={agent.name} photoUrl={agent.photoUrl} size={120} className="ring-4 ring-paper" />
        <h1 className="font-display text-3xl text-ink sm:text-4xl">{agent.name}</h1>
        <p className="text-sm font-medium uppercase tracking-wider text-gold">
          {agent.jobTitle || "Agente inmobiliario"}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-ink-soft">
          <span className="flex items-center gap-1.5">
            <Building2 size={15} /> {agent.properties.length} propiedades en cartera
          </span>
          {agent.averageRating != null ? (
            <span className="flex items-center gap-1.5">
              <Star size={15} className="fill-gold text-gold" /> {agent.averageRating.toFixed(1)} · {agent.reviews.length}{" "}
              reseñas
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-ink-soft/60">
              <Star size={15} /> Todavía sin reseñas
            </span>
          )}
        </div>

        {agent.bio && <p className="max-w-2xl text-sm leading-relaxed text-ink-soft sm:text-base">{agent.bio}</p>}

        <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
          <a
            href={`mailto:${agent.email}`}
            className="flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-xs font-medium text-paper transition-transform hover:scale-105"
          >
            <Mail size={14} /> {agent.email}
          </a>
          {agent.phone && (
            <a
              href={`tel:${agent.phone}`}
              className="flex items-center gap-2 rounded-full bg-paper px-4 py-2 text-xs font-medium text-ink shadow-sm transition-transform hover:scale-105"
            >
              <Phone size={14} /> {agent.phone}
            </a>
          )}
        </div>
      </div>

      {agent.properties.length > 0 && (
        <div className="mt-16">
          <h2 className="font-display text-2xl text-ink">Propiedades a su cargo</h2>
          <div className="mt-8 grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {agent.properties.map((p, i) => (
              <PropertyCard key={p.id} property={p} index={i} />
            ))}
          </div>
        </div>
      )}

      <div className="mt-16 grid grid-cols-1 gap-10 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="font-display text-2xl text-ink">Reseñas de clientes</h2>
          {agent.reviews.length === 0 ? (
            <p className="mt-4 text-sm text-ink-soft">
              Todavía no hay reseñas publicadas sobre {agent.name}. ¡Sé la primera persona en dejar una!
            </p>
          ) : (
            <div className="mt-6 flex flex-col gap-4">
              {agent.reviews.map((review) => (
                <div key={review.id} className="rounded-2xl border border-line bg-paper p-5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-ink">{review.authorName}</p>
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star
                          key={n}
                          size={14}
                          className={n <= review.rating ? "fill-gold text-gold" : "text-line"}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-ink-soft">{review.comment}</p>
                  <p className="mt-2 text-xs text-ink-soft/60">{formatDate(review.createdAt)}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <AgentReviewForm agentId={agent.id} agentName={agent.name} />
        </div>
      </div>
    </div>
  );
}
