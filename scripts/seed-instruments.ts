import { PrismaClient } from "@prisma/client";
import { INSTRUMENT_DEFINITIONS } from "../src/lib/assessments/definitions";

// Sincroniza los instrumentos estandarizados (PHQ-9, GAD-7, WHO-5) en la base
// de datos. Idempotente: actualiza ítems/puntaje si ya existen (creación por
// código). Debe correrse en cada entorno, incluida producción.
const prisma = new PrismaClient();

async function main() {
  for (const definition of INSTRUMENT_DEFINITIONS) {
    await prisma.assessmentInstrument.upsert({
      where: { code: definition.code },
      create: {
        code: definition.code,
        name: definition.name,
        items: JSON.stringify(definition.items),
        scoring: JSON.stringify(definition.scoring),
      },
      update: {
        name: definition.name,
        items: JSON.stringify(definition.items),
        scoring: JSON.stringify(definition.scoring),
      },
    });
    console.log(`Instrumento ${definition.code} sincronizado (${definition.items.length} ítems)`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
