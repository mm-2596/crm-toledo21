import jwt from "jsonwebtoken";
import type { NextFunction, Request, Response } from "express";

function readSecret(): string {
  const value = process.env.JWT_SECRET;
  if (!value) throw new Error("JWT_SECRET no está definido en las variables de entorno");
  return value;
}

const JWT_SECRET: string = readSecret();

export const AUTH_COOKIE = "toledo21_session";

export interface AuthPayload {
  userId: string;
  role: "ADMIN" | "AGENT";
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

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.[AUTH_COOKIE];
  if (!token) return res.status(401).json({ error: "No has iniciado sesión" });

  try {
    req.user = jwt.verify(token, JWT_SECRET) as AuthPayload;
    next();
  } catch {
    res.status(401).json({ error: "Sesión inválida o caducada" });
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.user?.role !== "ADMIN") {
    return res.status(403).json({ error: "Solo un administrador puede hacer esto" });
  }
  next();
}
