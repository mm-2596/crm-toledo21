import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../lib/asyncHandler.js";

export const pipelineRouter = Router();

pipelineRouter.get(
  "/stages",
  asyncHandler(async (_req, res) => {
    const stages = await prisma.pipelineStage.findMany({
      orderBy: { order: "asc" },
      include: {
        deals: {
          where: { status: "ABIERTO" },
          include: { contact: true, property: true, agent: true },
          orderBy: { createdAt: "desc" },
        },
      },
    });
    res.json(stages);
  }),
);

const dealInput = z.object({
  contactId: z.string().min(1),
  propertyId: z.string().optional().nullable(),
  stageId: z.string().min(1),
  agentId: z.string().optional().nullable(),
  value: z.number().int().optional().nullable(),
  expectedCloseDate: z.string().datetime().optional().nullable(),
  notes: z.string().optional().nullable(),
});

pipelineRouter.post(
  "/deals",
  asyncHandler(async (req, res) => {
    const data = dealInput.parse(req.body);
    const deal = await prisma.deal.create({
      data: {
        ...data,
        expectedCloseDate: data.expectedCloseDate ? new Date(data.expectedCloseDate) : null,
      },
    });
    res.status(201).json(deal);
  }),
);

const moveDealInput = z.object({
  stageId: z.string().min(1),
});

pipelineRouter.patch(
  "/deals/:id/stage",
  asyncHandler(async (req, res) => {
    const { stageId } = moveDealInput.parse(req.body);
    const deal = await prisma.deal.update({
      where: { id: String(req.params.id) },
      data: { stageId },
    });
    res.json(deal);
  }),
);

const closeDealInput = z.object({
  status: z.enum(["GANADO", "PERDIDO"]),
});

pipelineRouter.patch(
  "/deals/:id/close",
  asyncHandler(async (req, res) => {
    const { status } = closeDealInput.parse(req.body);
    const deal = await prisma.deal.update({
      where: { id: String(req.params.id) },
      data: { status },
    });
    res.json(deal);
  }),
);

pipelineRouter.delete(
  "/deals/:id",
  asyncHandler(async (req, res) => {
    await prisma.deal.delete({ where: { id: String(req.params.id) } });
    res.status(204).send();
  }),
);
