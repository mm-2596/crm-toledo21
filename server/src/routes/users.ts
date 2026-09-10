import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { requireAdmin } from "../lib/auth.js";

export const usersRouter = Router();

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  phone: true,
  active: true,
  createdAt: true,
} as const;

usersRouter.get(
  "/",
  requireAdmin,
  asyncHandler(async (_req, res) => {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "asc" },
      select: userSelect,
    });
    res.json(users);
  }),
);

usersRouter.get(
  "/invite-code",
  requireAdmin,
  asyncHandler(async (_req, res) => {
    res.json({ inviteCode: process.env.TEAM_INVITE_CODE ?? null });
  }),
);

const updateInput = z.object({
  role: z.enum(["ADMIN", "AGENT"]).optional(),
  active: z.boolean().optional(),
});

usersRouter.patch(
  "/:id",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const data = updateInput.parse(req.body);
    const id = String(req.params.id);

    if (id === req.user!.userId && (data.active === false || data.role === "AGENT")) {
      return res.status(400).json({ error: "No puedes quitarte a ti mismo el acceso de administrador" });
    }

    const user = await prisma.user.update({ where: { id }, data, select: userSelect });
    res.json(user);
  }),
);
