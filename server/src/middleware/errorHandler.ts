import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof ZodError) {
    return res.status(400).json({ error: "Datos invalidos", details: err.issues });
  }

  if (err instanceof Error && "status" in err && typeof err.status === "number") {
    return res.status(err.status).json({ error: err.message });
  }

  console.error(err);
  const message = err instanceof Error ? err.message : "Error interno del servidor";
  res.status(500).json({ error: message });
}

export function notFound(_req: Request, res: Response) {
  res.status(404).json({ error: "Recurso no encontrado" });
}
