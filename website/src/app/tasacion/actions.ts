"use server";

import { submitValuationRequest, type ValuationRequest } from "@/lib/api";

export async function requestValuation(data: ValuationRequest) {
  if (!data.name.trim()) return { ok: false as const, error: "El nombre es obligatorio" };
  try {
    const res = await submitValuationRequest(data);
    return { ok: true as const, estimate: res.estimate };
  } catch {
    return { ok: false as const, error: "No se pudo enviar tu solicitud. Inténtalo de nuevo." };
  }
}
