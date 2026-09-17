import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CalendarDays, CheckCircle2 } from "lucide-react";
import { getPortalPatient, hasPortalConsent } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { PortalTaskToggle } from "@/components/portal/portal-task-toggle";
import { PendingAssessments } from "@/components/portal/pending-assessments";
import { AssignedMaterial } from "@/components/portal/assigned-material";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Tu espacio · Dime",
};

// Home del portal: lo que ve el paciente. Solo datos que el terapeuta comparte;
// nunca notas clínicas, antecedentes, pagos ni tarifas (filtrado en servidor).
// El consentimiento vigente se exige en cada página del portal: sin él se
// redirige a /portal/pausa (una redirección, no un render condicional, para
// que los datos del paciente jamás se serialicen en la respuesta).
export default async function PortalHomePage() {
  const patient = await getPortalPatient();
  if (!patient) redirect("/portal/ingresar");
  if (!(await hasPortalConsent(patient.id))) redirect("/portal/pausa");

  const ahora = new Date();

  const [proximaCita, tareasPendientes, tareasHechas] = await Promise.all([
    prisma.appointment.findFirst({
      where: {
        patientId: patient.id,
        startAt: { gte: ahora },
        status: { in: ["PENDIENTE", "CONFIRMADA"] },
      },
      orderBy: { startAt: "asc" },
      // Sin fee ni notas: el paciente no ve precios ni contenido clínico.
      select: { id: true, startAt: true, endAt: true, type: true, status: true },
    }),
    prisma.task.findMany({
      where: { patientId: patient.id, completedAt: null },
      orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
      select: { id: true, title: true, dueDate: true },
      take: 20,
    }),
    prisma.task.findMany({
      where: { patientId: patient.id, completedAt: { not: null } },
      orderBy: { completedAt: "desc" },
      select: { id: true, title: true, completedAt: true },
      take: 3,
    }),
  ]);

  return (
    <div className="stagger-children mt-4 space-y-6">
      <header className="text-center">
        <h1 className="font-display text-3xl font-semibold text-foreground">
          Hola, {patient.nombre}
        </h1>
        <p className="mt-2 text-sm capitalize text-muted-foreground">
          {formatDate(ahora, "EEEE, d 'de' MMMM")}
        </p>
      </header>

      {/* Próxima cita */}
      <section className="rounded-card bg-surface p-6 shadow-soft">
        <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Tu próxima cita
        </h2>
        {proximaCita ? (
          <div className="mt-3 flex items-start gap-3">
            <CalendarDays size={20} strokeWidth={1.6} className="mt-0.5 shrink-0 text-primary" aria-hidden />
            <div>
              <p className="text-lg font-medium text-foreground">
                {formatDate(proximaCita.startAt, "EEEE, d 'de' MMMM")}
              </p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {formatDate(proximaCita.startAt, "h:mm a")} – {formatDate(proximaCita.endAt, "h:mm a")} ·{" "}
                {proximaCita.type === "ONLINE" ? "En línea" : "Presencial"}
              </p>
            </div>
          </div>
        ) : (
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            No tienes citas próximas. Tu terapeuta te avisará cuando agende la siguiente.
          </p>
        )}
      </section>

      {/* Tareas entre sesiones */}
      <section className="rounded-card bg-surface p-6 shadow-soft">
        <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Tus tareas
        </h2>

        {tareasPendientes.length === 0 ? (
          <div className="mt-4 flex items-center gap-3">
            <CheckCircle2 size={20} strokeWidth={1.6} className="shrink-0 text-primary" aria-hidden />
            <p className="text-sm leading-relaxed text-muted-foreground">
              No tienes tareas pendientes. Buen trabajo.
            </p>
          </div>
        ) : (
          <ul className="mt-3 divide-y divide-border">
            {tareasPendientes.map((tarea) => (
              <li key={tarea.id} className="flex items-center justify-between gap-4 py-3 first:pt-1 last:pb-0">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{tarea.title}</p>
                  {tarea.dueDate && (
                    <p
                      className={cn(
                        "mt-0.5 text-xs",
                        tarea.dueDate.getTime() < ahora.getTime()
                          ? "text-accent-warm"
                          : "text-muted-foreground"
                      )}
                    >
                      Para el {formatDate(tarea.dueDate, "d 'de' MMM")}
                    </p>
                  )}
                </div>
                <PortalTaskToggle taskId={tarea.id} completed={false} title={tarea.title} />
              </li>
            ))}
          </ul>
        )}

        {tareasHechas.length > 0 && (
          <div className="mt-4 border-t border-border pt-3">
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Completadas recientemente
            </p>
            <ul className="mt-2 space-y-2">
              {tareasHechas.map((tarea) => (
                <li key={tarea.id} className="flex items-center justify-between gap-4">
                  <p className="min-w-0 truncate text-sm text-muted-foreground line-through">
                    {tarea.title}
                  </p>
                  <PortalTaskToggle taskId={tarea.id} completed title={tarea.title} />
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
      {/* Evaluaciones pendientes (solo se renderiza si las hay) */}
      <PendingAssessments />

      {/* Material psicoeducativo asignado por el terapeuta */}
      <AssignedMaterial />
    </div>
  );
}
