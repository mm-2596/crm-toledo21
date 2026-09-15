"use server";

import { submitAgentReview } from "@/lib/api";

export async function sendAgentReview(formData: FormData) {
  const agentId = String(formData.get("agentId") || "").trim();
  const authorName = String(formData.get("authorName") || "").trim();
  const rating = Number(formData.get("rating") || 0);
  const comment = String(formData.get("comment") || "").trim();

  if (!authorName) return { ok: false, error: "Tu nombre es obligatorio" };
  if (!rating || rating < 1 || rating > 5) return { ok: false, error: "Selecciona una valoración" };
  if (!comment) return { ok: false, error: "Cuéntanos brevemente tu experiencia" };

  try {
    await submitAgentReview(agentId, { authorName, rating, comment });
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo enviar tu reseña. Inténtalo de nuevo." };
  }
}
