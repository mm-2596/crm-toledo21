"use server";

import { submitLead } from "@/lib/api";

export async function sendLead(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const message = String(formData.get("message") || "").trim();
  const propertyId = String(formData.get("propertyId") || "").trim();
  const marketingConsent = formData.get("marketingConsent") === "on" || formData.get("marketingConsent") === "true";

  if (!name) return { ok: false, error: "El nombre es obligatorio" };

  try {
    await submitLead({
      name,
      email: email || undefined,
      phone: phone || undefined,
      message: message || undefined,
      propertyId: propertyId || undefined,
      marketingConsent,
    });
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo enviar tu mensaje. Inténtalo de nuevo." };
  }
}
