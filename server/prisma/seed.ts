import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const stages = [
  { name: "Nuevo lead", order: 1 },
  { name: "Contactado", order: 2 },
  { name: "Visita programada", order: 3 },
  { name: "Negociación", order: 4 },
  { name: "Cerrado", order: 5 },
];

async function main() {
  for (const stage of stages) {
    await prisma.pipelineStage.upsert({
      where: { name: stage.name },
      update: {},
      create: stage,
    });
  }
  console.log("Pipeline por defecto creado.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
