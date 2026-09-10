import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../lib/asyncHandler.js";

export const usersRouter = Router();

const userInput = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  role: z.enum(["ADMIN", "AGENT"]).optional(),
  phone: z.string().optional().nullable(),
});

usersRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const users = await prisma.user.findMany({ where: { active: true }, orderBy: { name: "asc" } });
    res.json(users);
  }),
);

usersRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const data = userInput.parse(req.body);
    const user = await prisma.user.create({ data });
    res.status(201).json(user);
  }),
);
