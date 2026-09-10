import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { AUTH_COOKIE, requireAuth, signToken } from "../lib/auth.js";

export const authRouter = Router();

const isProduction = process.env.NODE_ENV === "production";
const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: isProduction,
  maxAge: 30 * 24 * 60 * 60 * 1000,
};

const registerInput = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  inviteCode: z.string().min(1),
});

authRouter.post(
  "/register",
  asyncHandler(async (req, res) => {
    const data = registerInput.parse(req.body);

    if (data.inviteCode !== process.env.TEAM_INVITE_CODE) {
      return res.status(403).json({ error: "Código de invitación incorrecto" });
    }

    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      return res.status(409).json({ error: "Ya existe una cuenta con ese email" });
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const usersCount = await prisma.user.count();
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash,
        role: usersCount === 0 ? "ADMIN" : "AGENT",
      },
    });

    const token = signToken({ userId: user.id, role: user.role });
    res.cookie(AUTH_COOKIE, token, cookieOptions);
    res.status(201).json({ id: user.id, name: user.name, email: user.email, role: user.role });
  }),
);

const loginInput = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

authRouter.post(
  "/login",
  asyncHandler(async (req, res) => {
    const data = loginInput.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user || !user.active) {
      return res.status(401).json({ error: "Email o contraseña incorrectos" });
    }

    const valid = await bcrypt.compare(data.password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: "Email o contraseña incorrectos" });
    }

    const token = signToken({ userId: user.id, role: user.role });
    res.cookie(AUTH_COOKIE, token, cookieOptions);
    res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
  }),
);

authRouter.post("/logout", (_req, res) => {
  res.clearCookie(AUTH_COOKIE);
  res.status(204).send();
});

authRouter.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    if (!user || !user.active) return res.status(401).json({ error: "Sesión inválida" });
    res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
  }),
);
