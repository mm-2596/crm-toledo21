import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../lib/asyncHandler.js";

export const dashboardRouter = Router();

dashboardRouter.get(
  "/summary",
  asyncHandler(async (_req, res) => {
    const [contactsCount, propertiesCount, openDeals, wonDeals, pendingActivities] = await Promise.all([
      prisma.contact.count(),
      prisma.property.count({ where: { status: "DISPONIBLE" } }),
      prisma.deal.count({ where: { status: "ABIERTO" } }),
      prisma.deal.count({ where: { status: "GANADO" } }),
      prisma.activity.count({ where: { completed: false, dueDate: { not: null } } }),
    ]);

    const dealsByStage = await prisma.pipelineStage.findMany({
      orderBy: { order: "asc" },
      select: {
        id: true,
        name: true,
        _count: { select: { deals: { where: { status: "ABIERTO" } } } },
      },
    });

    res.json({
      contactsCount,
      propertiesAvailable: propertiesCount,
      openDeals,
      wonDeals,
      pendingActivities,
      dealsByStage,
    });
  }),
);
