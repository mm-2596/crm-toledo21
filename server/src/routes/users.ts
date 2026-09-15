import { Router, type Request } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { requireAdmin, requireAuth } from "../lib/auth.js";
import { uploadAgentPhoto } from "../lib/upload.js";

export const usersRouter = Router();

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  phone: true,
  photoUrl: true,
  jobTitle: true,
  bio: true,
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

usersRouter.get(
  "/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const id = String(req.params.id);
    if (!requireSelfOrAdmin(req, id)) {
      return res.status(403).json({ error: "No puedes ver el perfil de otra persona" });
    }
    const user = await prisma.user.findUnique({ where: { id }, select: userSelect });
    if (!user) return res.status(404).json({ error: "Usuario no encontrado" });
    res.json(user);
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

function requireSelfOrAdmin(req: Request, id: string): boolean {
  return req.user?.role === "ADMIN" || req.user?.userId === id;
}

const profileInput = z.object({
  jobTitle: z.string().max(120).optional().nullable(),
  bio: z.string().max(2000).optional().nullable(),
  phone: z.string().max(40).optional().nullable(),
});

usersRouter.patch(
  "/:id/profile",
  requireAuth,
  asyncHandler(async (req, res) => {
    const id = String(req.params.id);
    if (!requireSelfOrAdmin(req, id)) {
      return res.status(403).json({ error: "No puedes editar el perfil de otra persona" });
    }
    const data = profileInput.parse(req.body);
    const user = await prisma.user.update({ where: { id }, data, select: userSelect });
    res.json(user);
  }),
);

usersRouter.post(
  "/:id/photo",
  requireAuth,
  uploadAgentPhoto.single("photo"),
  asyncHandler(async (req, res) => {
    const id = String(req.params.id);
    if (!requireSelfOrAdmin(req, id)) {
      return res.status(403).json({ error: "No puedes editar la foto de otra persona" });
    }
    if (!req.file) return res.status(400).json({ error: "No se recibió ninguna imagen" });

    const user = await prisma.user.update({
      where: { id },
      data: { photoUrl: `/uploads/agents/${id}/${req.file.filename}` },
      select: userSelect,
    });
    res.json(user);
  }),
);

usersRouter.get(
  "/:id/reviews",
  requireAuth,
  asyncHandler(async (req, res) => {
    const id = String(req.params.id);
    if (!requireSelfOrAdmin(req, id)) {
      return res.status(403).json({ error: "No puedes ver las reseñas de otra persona" });
    }
    const reviews = await prisma.agentReview.findMany({
      where: { agentId: id },
      orderBy: { createdAt: "desc" },
    });
    res.json(reviews);
  }),
);

usersRouter.get(
  "/reviews/pending",
  requireAdmin,
  asyncHandler(async (_req, res) => {
    const reviews = await prisma.agentReview.findMany({
      where: { approved: false },
      orderBy: { createdAt: "asc" },
      include: { agent: { select: { id: true, name: true } } },
    });
    res.json(reviews);
  }),
);

usersRouter.patch(
  "/reviews/:reviewId",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const data = z.object({ approved: z.boolean() }).parse(req.body);
    const review = await prisma.agentReview.update({
      where: { id: String(req.params.reviewId) },
      data: { approved: data.approved },
    });
    res.json(review);
  }),
);

usersRouter.delete(
  "/reviews/:reviewId",
  requireAdmin,
  asyncHandler(async (req, res) => {
    await prisma.agentReview.delete({ where: { id: String(req.params.reviewId) } });
    res.status(204).send();
  }),
);
