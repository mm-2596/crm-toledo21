import { Star } from "lucide-react";
import { GOOGLE_PROFILE_URL, GOOGLE_RATING, GOOGLE_RATING_LABEL, GOOGLE_REVIEW_COUNT } from "@/lib/reviews";

function GoogleG({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#4285F4" d="M45.1 24.5c0-1.6-.1-3.1-.4-4.6H24v9.1h11.9c-.5 2.8-2.1 5.1-4.4 6.7v5.6h7.1c4.2-3.9 6.5-9.6 6.5-16.8z" />
      <path fill="#34A853" d="M24 46c5.9 0 10.9-2 14.5-5.3l-7.1-5.6c-2 1.3-4.5 2.1-7.4 2.1-5.7 0-10.5-3.8-12.2-9H4.5v5.7C8.1 41.1 15.4 46 24 46z" />
      <path fill="#FBBC05" d="M11.8 28.2c-.4-1.3-.7-2.7-.7-4.2s.2-2.9.7-4.2v-5.7H4.5C3 17 2 20.4 2 24s1 7 4.5 9.9z" />
      <path fill="#EA4335" d="M24 10.8c3.2 0 6.1 1.1 8.4 3.3l6.3-6.3C34.9 4.2 29.9 2 24 2 15.4 2 8.1 6.9 4.5 14.1l7.3 5.7c1.7-5.2 6.5-9 12.2-9z" />
    </svg>
  );
}

// Sello con la nota y el número de reseñas de Google; enlaza a la ficha de la empresa.
export function GoogleRatingBadge({ className = "" }: { className?: string }) {
  return (
    <a
      href={GOOGLE_PROFILE_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${GOOGLE_RATING_LABEL} de 5 en Google, ${GOOGLE_REVIEW_COUNT} reseñas. Ver en Google`}
      className={`inline-flex items-center gap-2 text-sm text-ink-soft transition-colors hover:text-ink ${className}`}
    >
      <GoogleG />
      <span className="flex gap-0.5" aria-hidden="true">
        {Array.from({ length: 5 }, (_, s) => (
          <Star key={s} size={13} className={s < Math.round(GOOGLE_RATING) ? "fill-gold text-gold" : "fill-gold/30 text-gold/30"} />
        ))}
      </span>
      <span>
        <strong className="font-medium text-ink">{GOOGLE_RATING_LABEL}</strong> en Google · {GOOGLE_REVIEW_COUNT} reseñas
      </span>
    </a>
  );
}
