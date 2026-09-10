import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const stages = [
  { name: "Nuevo lead", order: 1 },
  { name: "Contactado", order: 2 },
  { name: "Visita programada", order: 3 },
  { name: "Negociación", order: 4 },
  { name: "Cerrado", order: 5 },
];

const properties = [
  {
    reference: "TOL-001",
    title: "Piso reformado junto al Alcázar",
    type: "PISO" as const,
    listingType: "VENTA" as const,
    price: 185000,
    city: "Toledo",
    zone: "Casco Histórico",
    bedrooms: 2,
    bathrooms: 1,
    areaM2: 78,
    description:
      "Piso completamente reformado a dos minutos del Alcázar, con vistas parciales a la ciudad. Cocina y baño nuevos, suelos de gres. Ideal para inversión turística o primera vivienda.",
  },
  {
    reference: "TOL-002",
    title: "Ático con terraza en Santa Teresa",
    type: "ATICO" as const,
    listingType: "VENTA" as const,
    price: 245000,
    city: "Toledo",
    zone: "Santa Teresa",
    bedrooms: 3,
    bathrooms: 2,
    areaM2: 105,
    description:
      "Ático luminoso con terraza de 20 m² y vistas abiertas. Tres habitaciones, dos baños, plaza de garaje incluida. Edificio con ascensor.",
  },
  {
    reference: "TOL-003",
    title: "Chalet adosado en Santa Bárbara",
    type: "CHALET" as const,
    listingType: "VENTA" as const,
    price: 320000,
    city: "Toledo",
    zone: "Santa Bárbara",
    bedrooms: 4,
    bathrooms: 3,
    areaM2: 180,
    description:
      "Chalet adosado con jardín privado y garaje para dos coches. Zona tranquila y bien comunicada, a 10 minutos del centro en coche.",
  },
  {
    reference: "TOL-004",
    title: "Piso en alquiler cerca de la estación",
    type: "PISO" as const,
    listingType: "ALQUILER" as const,
    price: 650,
    city: "Toledo",
    zone: "Estación",
    bedrooms: 2,
    bathrooms: 1,
    areaM2: 65,
    description: "Piso amueblado a 5 minutos andando de la estación de tren. Ideal para media/larga estancia.",
  },
];

const contacts = [
  {
    name: "María López",
    email: "maria.lopez@example.com",
    phone: "622 111 222",
    source: "WEB_HOUZEZ" as const,
    preferredZone: "Casco Histórico",
    propertyType: "PISO" as const,
    listingType: "VENTA" as const,
    budgetMax: 200000,
    bedroomsMin: 2,
    needsFinancing: true,
    priority: "ALTA" as const,
    notes: "Contactó por la web preguntando por TOL-001. Quiere visitar esta semana.",
  },
  {
    name: "Javier Sánchez",
    email: "javier.sanchez@example.com",
    phone: "633 222 333",
    source: "REFERRAL" as const,
    preferredZone: "Santa Bárbara",
    propertyType: "CHALET" as const,
    listingType: "VENTA" as const,
    budgetMax: 350000,
    bedroomsMin: 4,
    needsFinancing: false,
    priority: "MEDIA" as const,
    notes: "Referido por un cliente anterior. Sin prisa, comparando varias zonas.",
  },
  {
    name: "Lucía Fernández",
    phone: "644 333 444",
    source: "PHONE" as const,
    preferredZone: "Estación",
    propertyType: "PISO" as const,
    listingType: "ALQUILER" as const,
    budgetMax: 700,
    priority: "BAJA" as const,
    notes: "Llamó preguntando por alquileres cerca de la estación, aún valorando opciones.",
  },
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

  for (const property of properties) {
    await prisma.property.upsert({
      where: { reference: property.reference },
      update: {},
      create: property,
    });
  }
  console.log("Propiedades de ejemplo creadas.");

  for (const contact of contacts) {
    const existing = contact.email
      ? await prisma.contact.findFirst({ where: { email: contact.email } })
      : await prisma.contact.findFirst({ where: { phone: contact.phone } });
    if (!existing) {
      await prisma.contact.create({ data: contact });
    }
  }
  console.log("Contactos de ejemplo creados.");

  const maria = await prisma.contact.findFirst({ where: { email: "maria.lopez@example.com" } });
  const javier = await prisma.contact.findFirst({ where: { email: "javier.sanchez@example.com" } });
  const lucia = await prisma.contact.findFirst({ where: { phone: "644 333 444" } });
  const tol001 = await prisma.property.findUnique({ where: { reference: "TOL-001" } });
  const tol003 = await prisma.property.findUnique({ where: { reference: "TOL-003" } });
  const tol004 = await prisma.property.findUnique({ where: { reference: "TOL-004" } });
  const stageList = await prisma.pipelineStage.findMany({ orderBy: { order: "asc" } });
  const [nuevo, contactado, visita] = stageList;

  if (maria && tol001 && nuevo) {
    const existingDeal = await prisma.deal.findFirst({ where: { contactId: maria.id, propertyId: tol001.id } });
    if (!existingDeal) {
      const deal = await prisma.deal.create({
        data: { contactId: maria.id, propertyId: tol001.id, stageId: visita.id, value: 185000 },
      });
      await prisma.activity.create({
        data: {
          contactId: maria.id,
          dealId: deal.id,
          type: "VISITA",
          description: "Visita a TOL-001 (Casco Histórico)",
          dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        },
      });
    }
  }

  if (javier && tol003 && contactado) {
    const existingDeal = await prisma.deal.findFirst({ where: { contactId: javier.id, propertyId: tol003.id } });
    if (!existingDeal) {
      await prisma.deal.create({
        data: { contactId: javier.id, propertyId: tol003.id, stageId: contactado.id, value: 320000 },
      });
      await prisma.activity.create({
        data: {
          contactId: javier.id,
          type: "LLAMADA",
          description: "Llamar para concretar próxima visita a Santa Bárbara",
          dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
        },
      });
    }
  }

  if (lucia && tol004 && nuevo) {
    const existingDeal = await prisma.deal.findFirst({ where: { contactId: lucia.id, propertyId: tol004.id } });
    if (!existingDeal) {
      await prisma.deal.create({
        data: { contactId: lucia.id, propertyId: tol004.id, stageId: nuevo.id, value: 650 },
      });
    }
    await prisma.activity.create({
      data: {
        contactId: lucia.id,
        type: "WHATSAPP",
        description: "Enviar fotos adicionales del piso de la Estación",
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      },
    });
  }

  console.log("Oportunidades y tareas de ejemplo creadas.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
