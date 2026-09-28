"use server";

import { subscribeNewsletter } from "@/lib/api";

export async function subscribeToNewsletter(formData: FormData) {
  const email = String(formData.get("email") || "").trim();
  const consent = formData.get("consent") === "on";

  if (!email) return { ok: false, error: "Escribe tu email" };
  if (!consent) return { ok: false, error: "Tienes que aceptar la política de privacidad" };

  try {
    await subscribeNewsletter({ email, consent: true });
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo completar la suscripción. Inténtalo de nuevo." };
  }
}
