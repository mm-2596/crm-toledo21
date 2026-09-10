import { Router } from "express";
import { asyncHandler } from "../lib/asyncHandler.js";

export const integrationsRouter = Router();

/**
 * Integracion con Houzez/WordPress (fase 2). De momento solo expone el
 * estado de configuracion; la sincronizacion real (traer propiedades/leads
 * via la REST API de WordPress) se implementa cuando se defina el flujo
 * exacto con el sitio de Toledo21.
 */
integrationsRouter.get("/houzez/status", (_req, res) => {
  const configured = Boolean(process.env.HOUZEZ_SITE_URL && process.env.HOUZEZ_API_KEY);
  res.json({ configured, siteUrl: process.env.HOUZEZ_SITE_URL || null });
});

integrationsRouter.post(
  "/houzez/sync-properties",
  asyncHandler(async (_req, res) => {
    if (!process.env.HOUZEZ_SITE_URL || !process.env.HOUZEZ_API_KEY) {
      return res.status(501).json({
        error: "Integracion con Houzez no configurada. Define HOUZEZ_SITE_URL y HOUZEZ_API_KEY en .env.",
      });
    }
    res.status(501).json({ error: "Sincronizacion aun no implementada." });
  }),
);
