"use client";

import { useState, useTransition } from "react";
import { Star } from "lucide-react";
import { sendAgentReview } from "@/app/equipo/[id]/actions";

export function AgentReviewForm({ agentId, agentName }: { agentId: string; agentName: string }) {
  const [isPending, startTransition] = useTransition();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [result, setResult] = useState<{ ok: boolean; error?: string } | null>(null);

  function handleSubmit(formData: FormData) {
    formData.set("rating", String(rating));
    startTransition(async () => {
      const res = await sendAgentReview(formData);
      setResult(res);
    });
  }

  if (result?.ok) {
    return (
      <div className="rounded-2xl border border-gold/30 bg-gold-soft p-6 text-sm text-ink">
        ¡Gracias por tu reseña sobre <strong>{agentName}</strong>! La revisamos y se publicará en breve.
      </div>
    );
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-3 rounded-2xl border border-line bg-paper p-6">
      <h3 className="font-display text-lg text-ink">Deja tu opinión sobre {agentName}</h3>
      <input type="hidden" name="agentId" value={agentId} />

      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            onMouseEnter={() => setHoverRating(n)}
            onMouseLeave={() => setHoverRating(0)}
            aria-label={`${n} estrellas`}
            className="p-0.5"
          >
            <Star
              size={22}
              className={n <= (hoverRating || rating) ? "fill-gold text-gold" : "text-line"}
            />
          </button>
        ))}
      </div>

      <input
        name="authorName"
        required
        placeholder="Tu nombre"
        className="rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink placeholder:text-ink-soft/60"
      />
      <textarea
        name="comment"
        required
        rows={3}
        placeholder="Cuéntanos qué tal tu experiencia…"
        className="resize-none rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink placeholder:text-ink-soft/60"
      />

      {result?.error && <p className="text-xs text-red-600">{result.error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="mt-1 rounded-lg bg-ink px-5 py-2.5 text-sm font-medium text-paper transition-transform hover:scale-[1.02] disabled:opacity-60"
      >
        {isPending ? "Enviando…" : "Enviar reseña"}
      </button>
    </form>
  );
}
