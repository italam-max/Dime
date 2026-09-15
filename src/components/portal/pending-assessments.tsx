import Link from "next/link";
import { endOfDay } from "date-fns";
import { getPortalPatient } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";

// Evaluaciones pendientes del home del portal: asignaciones activas cuya
// próxima fecha ya llegó. Solo se renderiza la sección si hay pendientes;
// la consulta no incluye datos clínicos ni financieros (solo el nombre del
// instrumento). El paciente nunca ve puntajes ni rangos.
export async function PendingAssessments() {
  const patient = await getPortalPatient();
  if (!patient) return null;

  const pendientes = await prisma.assessmentAssignment.findMany({
    where: {
      patientId: patient.id,
      active: true,
      nextDueAt: { lte: endOfDay(new Date()) },
    },
    orderBy: [{ nextDueAt: "asc" }],
    select: {
      id: true,
      instrument: { select: { name: true } },
    },
  });

  if (pendientes.length === 0) return null;

  return (
    <section className="rounded-card bg-surface p-6 shadow-soft">
      <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
        Evaluaciones pendientes
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Esta evaluación toma menos de un minuto.
      </p>
      <ul className="mt-3 divide-y divide-border">
        {pendientes.map((pendiente) => (
          <li
            key={pendiente.id}
            className="flex items-center justify-between gap-4 py-3 first:pt-1 last:pb-0"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">
                {pendiente.instrument.name}
              </p>
            </div>
            <Button asChild className="min-h-11 shrink-0 sm:min-h-9">
              <Link href={`/portal/evaluaciones/${pendiente.id}`}>Responder</Link>
            </Button>
          </li>
        ))}
      </ul>
    </section>
  );
}
