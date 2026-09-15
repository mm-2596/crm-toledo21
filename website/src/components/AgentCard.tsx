"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Star, Building2 } from "lucide-react";
import { AgentAvatar } from "./AgentAvatar";
import type { PublicAgentSummary } from "@/lib/types";

export function AgentCard({ agent, index = 0 }: { agent: PublicAgentSummary; index?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ type: "spring", bounce: 0, duration: 0.45, delay: Math.min(index * 0.08, 0.3) }}
      whileHover={{ y: -6 }}
      className="group overflow-hidden rounded-2xl border border-line bg-paper shadow-sm transition-shadow hover:shadow-xl hover:shadow-black/5"
    >
      <Link href={`/equipo/${agent.id}`} className="flex flex-col items-center px-6 pb-6 pt-8 text-center">
        <AgentAvatar
          name={agent.name}
          photoUrl={agent.photoUrl}
          size={88}
          className="ring-4 ring-paper-dim transition-transform duration-500 group-hover:scale-105"
        />
        <h3 className="mt-4 font-display text-lg text-ink">{agent.name}</h3>
        <p className="mt-0.5 text-xs font-medium uppercase tracking-wider text-gold">
          {agent.jobTitle || "Agente inmobiliario"}
        </p>

        <div className="mt-4 flex items-center gap-4 text-xs text-ink-soft">
          <span className="flex items-center gap-1">
            <Building2 size={13} /> {agent.propertiesCount} en cartera
          </span>
          {agent.averageRating != null ? (
            <span className="flex items-center gap-1">
              <Star size={13} className="fill-gold text-gold" /> {agent.averageRating.toFixed(1)} ({agent.reviewsCount})
            </span>
          ) : (
            <span className="flex items-center gap-1 text-ink-soft/60">
              <Star size={13} /> Sin reseñas aún
            </span>
          )}
        </div>

        {agent.bio && <p className="mt-4 line-clamp-2 text-sm text-ink-soft">{agent.bio}</p>}

        <span className="mt-5 rounded-full bg-ink px-4 py-2 text-xs font-medium text-paper transition-transform group-hover:scale-105">
          Ver ficha
        </span>
      </Link>
    </motion.div>
  );
}
