import jwt from "jsonwebtoken";
import type { NextFunction, Request, Response } from "express";
import { prisma } from "./prisma.js";

function readSecret(): string {
  const value = process.env.JWT_SECRET;
  if (!value) throw new Error("JWT_SECRET no está definido en las variables de entorno");
  return value;
}

const JWT_SECRET: string = readSecret();

export const AUTH_COOKIE = "toledo21_session";

export interface AuthPayload {
  userId: string;
  role: "ADMIN" | "AGENT" | "ADMINISTRACION";
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export function signToken(payload: AuthPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "30d" });
}

/**
 * Acepta la sesion por cookie (uso normal desde el propio CRM en el
 * navegador) o por cabecera "Authorization: Bearer <token>" (uso desde un
 * servicio externo, como el backend de la web publica, actuando en nombre
 * de un agente ya logueado ahi).
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const bearer = req.headers.authorization?.startsWith("Bearer ")
    ? req.headers.authorization.slice(7)
    : undefined;
  const token = req.cookies?.[AUTH_COOKIE] ?? bearer;
  if (!token) return res.status(401).json({ error: "No has iniciado sesión" });

  let payload: AuthPayload;
  try {
    payload = jwt.verify(token, JWT_SECRET) as AuthPayload;
  } catch {
    return res.status(401).json({ error: "Sesión inválida o caducada" });
  }

  // El rol y el estado se leen de la base de datos en cada petición, no del token (que dura 30 días):
  // así un cambio de rol o desactivar a alguien surte efecto al instante.
  try {
    const user = await prisma.user.findUnique({ where: { id: payload.userId }, select: { role: true, active: true } });
    if (!user || !user.active) return res.status(401).json({ error: "Sesión inválida o caducada" });
    req.user = { userId: payload.userId, role: user.role };
    next();
  } catch (error) {
    next(error);
  }
}

/** Para las pantallas de compraventa, de las que Administración queda fuera. */
export function denyAdministracion(req: Request, res: Response, next: NextFunction) {
  if (req.user?.role === "ADMINISTRACION") return res.status(403).json({ error: "Tu perfil solo gestiona alquileres" });
  next();
}

/** Alquileres: administradores y el perfil de Administración. */
export function requireRentals(req: Request, res: Response, next: NextFunction) {
  if (req.user?.role === "AGENT") return res.status(403).json({ error: "Los alquileres los gestiona Administración" });
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.user?.role !== "ADMIN") {
    return res.status(403).json({ error: "Solo un administrador puede hacer esto" });
  }
  next();
}
