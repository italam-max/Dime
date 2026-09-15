import { createHash } from "node:crypto";
import { PrismaClient } from "@prisma/client";

// Genera una invitación de demo para Fernanda con un token conocido.
const prisma = new PrismaClient();
const token = "demo-f8c3a2b97e41d0685f2e9c4b7a3d0e61194c";
const tokenHash = createHash("sha256").update(token).digest("hex");

async function main() {
  const patient = await prisma.patient.findFirstOrThrow({ where: { nombre: "Fernanda" } });

  await prisma.portalAccess.upsert({
    where: { patientId: patient.id },
    create: {
      patientId: patient.id,
      tokenHash,
      invitedAt: new Date(),
      expiresAt: new Date(Date.now() + 48 * 3600 * 1000),
    },
    update: {
      tokenHash,
      invitedAt: new Date(),
      expiresAt: new Date(Date.now() + 48 * 3600 * 1000),
      acceptedAt: null,
      revokedAt: null,
    },
  });

  const enDosDias = new Date(Date.now() + 2 * 24 * 3600 * 1000);
  const yaTieneTareas = await prisma.task.count({ where: { patientId: patient.id } });
  if (yaTieneTareas === 0) {
    await prisma.task.createMany({
      data: [
        { patientId: patient.id, title: "Practicar respiración 4-7-8 dos veces al día", dueDate: enDosDias },
        { patientId: patient.id, title: "Registrar dos pensamientos automáticos en el diario", dueDate: enDosDias },
      ],
    });
  }

  // Asignación de demo: PHQ-9 semanal pendiente de responder hoy.
  const phq9 = await prisma.assessmentInstrument.findUniqueOrThrow({ where: { code: "PHQ9" } });
  const yaTieneAsignacion = await prisma.assessmentAssignment.findFirst({
    where: { patientId: patient.id, instrumentId: phq9.id, active: true },
  });
  if (!yaTieneAsignacion) {
    await prisma.assessmentAssignment.create({
      data: {
        patientId: patient.id,
        instrumentId: phq9.id,
        frequency: "SEMANAL",
        nextDueAt: new Date(),
      },
    });
  }

  // Material de demo: asignar el primer artículo publicado.
  const articulo = await prisma.article.findFirst({ where: { published: true } });
  if (articulo) {
    const yaAsignado = await prisma.articleAssignment.findFirst({
      where: { patientId: patient.id, articleId: articulo.id },
    });
    if (!yaAsignado) {
      await prisma.articleAssignment.create({
        data: { patientId: patient.id, articleId: articulo.id },
      });
    }
  }

  console.log(`Paciente: ${patient.nombre} ${patient.apellidos}`);
  console.log(`Enlace: http://localhost:3000/portal/ingresar?token=${token}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
