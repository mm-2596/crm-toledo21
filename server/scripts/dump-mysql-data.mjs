#!/usr/bin/env node
// Paso 1 de la migración a Supabase: vuelca todos los datos de la base MySQL
// actual a un JSON local (fuera del repo). Se usa antes de cambiar el
// proveedor de Prisma a postgresql.
import fs from "node:fs";
import path from "node:path";
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const outPath = path.join("/tmp", "toledo21-mysql-dump.json");

const data = {
  users: await prisma.user.findMany(),
  contacts: await prisma.contact.findMany(),
  properties: await prisma.property.findMany(),
  propertyImages: await prisma.propertyImage.findMany(),
  pipelineStages: await prisma.pipelineStage.findMany(),
  deals: await prisma.deal.findMany(),
  activities: await prisma.activity.findMany(),
  valuations: await prisma.valuation.findMany(),
  agentReviews: await prisma.agentReview.findMany(),
};

fs.writeFileSync(outPath, JSON.stringify(data, null, 2));

for (const [key, rows] of Object.entries(data)) {
  console.log(`${key}: ${rows.length}`);
}
console.log(`\nGuardado en ${outPath}`);

await prisma.$disconnect();
