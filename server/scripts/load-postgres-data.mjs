#!/usr/bin/env node
// Paso 2 de la migración a Supabase: carga el JSON volcado de MySQL en la
// nueva base Postgres. Ejecutar SOLO después de:
//   1. Cambiar el "provider" de prisma/schema.prisma a "postgresql"
//   2. Apuntar DATABASE_URL (.env) a la cadena de conexión de Supabase
//   3. Ejecutar `npx prisma db push` para crear el esquema vacío en Supabase
import fs from "node:fs";
import path from "node:path";
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const inPath = path.join("/tmp", "toledo21-mysql-dump.json");
const data = JSON.parse(fs.readFileSync(inPath, "utf-8"));

// Orden que respeta las claves foráneas: primero lo que no depende de nada.
console.log("Cargando usuarios...");
for (const row of data.users) await prisma.user.create({ data: row });

console.log("Cargando etapas del pipeline...");
for (const row of data.pipelineStages) await prisma.pipelineStage.create({ data: row });

console.log("Cargando contactos...");
for (const row of data.contacts) await prisma.contact.create({ data: row });

console.log("Cargando propiedades...");
for (const row of data.properties) await prisma.property.create({ data: row });

console.log("Cargando imágenes de propiedades...");
for (const row of data.propertyImages) await prisma.propertyImage.create({ data: row });

console.log("Cargando negociaciones (deals)...");
for (const row of data.deals) await prisma.deal.create({ data: row });

console.log("Cargando actividades...");
for (const row of data.activities) await prisma.activity.create({ data: row });

console.log("Cargando valoraciones...");
for (const row of data.valuations) await prisma.valuation.create({ data: row });

console.log("Cargando reseñas de agentes...");
for (const row of data.agentReviews) await prisma.agentReview.create({ data: row });

console.log("\n--- Verificación ---");
console.log("users:", await prisma.user.count(), "/ esperado", data.users.length);
console.log("contacts:", await prisma.contact.count(), "/ esperado", data.contacts.length);
console.log("properties:", await prisma.property.count(), "/ esperado", data.properties.length);
console.log("propertyImages:", await prisma.propertyImage.count(), "/ esperado", data.propertyImages.length);
console.log("pipelineStages:", await prisma.pipelineStage.count(), "/ esperado", data.pipelineStages.length);
console.log("deals:", await prisma.deal.count(), "/ esperado", data.deals.length);
console.log("activities:", await prisma.activity.count(), "/ esperado", data.activities.length);
console.log("valuations:", await prisma.valuation.count(), "/ esperado", data.valuations.length);
console.log("agentReviews:", await prisma.agentReview.count(), "/ esperado", data.agentReviews.length);

await prisma.$disconnect();
