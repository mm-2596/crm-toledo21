import { Router } from "express";
import { asyncHandler } from "../lib/asyncHandler.js";
import { notificationsFor } from "../lib/notifications.js";

export const notificationsRouter = Router();

notificationsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    res.json(await notificationsFor({ userId: req.user!.userId, role: req.user!.role }));
  }),
);
