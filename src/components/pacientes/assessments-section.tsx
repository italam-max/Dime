import { ClipboardCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { cn, formatDate } from "@/lib/utils";
import {
  ASSESSMENT_FREQUENCIES,
  FREQUENCY_LABELS,
  rangeForScore,
  type AssessmentFrequency,
  type AssessmentRange,
} from "@/lib/assessments/definitions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AssignAssessmentDialog } from "@/components/pacientes/assign-assessment-dialog";
import { DeactivateAssessmentButton } from "@/components/pacientes/deactivate-assessment-button";
import {
  AssessmentEvolutionChart,
  type EvolucionDato,
  type EvolucionSerie,
} from "@/components/pacientes/assessment-evolution-chart";

// Paleta Calma para las líneas de evolución (salvia, terracota, quemado, piedra).
const PALETA_EVOLUCION = ["#5E7A6B", "#B08968", "#A2675B", "#8A857C"];

function etiquetaFrecuencia(frequency: string): string {
  return ASSESSMENT_FREQUENCIES.includes(frequency as AssessmentFrequency)
    ? FREQUENCY_LABELS[frequency as AssessmentFrequency]
    : frequency;
}

// Badge sutil: terracota suave solo para rangos severos; nunca rojo alarmista.
function clasesRango(label: string | null): string {
  const esSevero = label !== null && label.toLowerCase().includes("severo");
  return cn(
    "rounded-4xl border-transparent font-normal",
    esSevero
      ? "bg-accent-warm-soft text-accent-warm"
      : "bg-surface-muted text-muted-foreground"
  );
}

// Rangos (semáforo) de un instrumento a partir de su JSON de scoring.
function parseRanges(scoring: string): AssessmentRange[] {
  try {
    const parsed = JSON.parse(scoring) as { ranges?: AssessmentRange[] };
    return Array.isArray(parsed.ranges) ? parsed.ranges : [];
  } catch {
    return [];
  }
}

// Sección "Evaluaciones" de la ficha del paciente: asignación, activas,
// tabla de respuestas con puntaje + rango, y gráfica de evolución por
// instrumento. Componente de servidor auto-contenido.
export async function AssessmentsSection({ patientId }: { patientId: string }) {
  const [instruments, assignments, responses] = await Promise.all([
    prisma.assessmentInstrument.findMany({
      where: { isActive: true },
      orderBy: { code: "asc" },
      select: { id: true, code: true, name: true },
    }),
    prisma.assessmentAssignment.findMany({
      where: { patientId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        frequency: true,
        nextDueAt: true,
        active: true,
        instrument: { select: { id: true, code: true, name: true } },
      },
    }),
    prisma.assessmentResponse.findMany({
      where: { assignment: { patientId } },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        createdAt: true,
        score: true,
        assignment: {
          select: {
            instrument: { select: { id: true, code: true, name: true, scoring: true } },
          },
        },
      },
    }),
  ]);

  const activas = assignments.filter((asignacion) => asignacion.active);

  // Tabla (más reciente primero): puntaje + etiqueta del rango correspondiente.
  const filas = responses
    .slice()
    .reverse()
    .map((respuesta) => ({
      id: respuesta.id,
      fecha: respuesta.createdAt,
      instrumento: respuesta.assignment.instrument.name,
      score: respuesta.score,
      rango: rangeForScore(
        parseRanges(respuesta.assignment.instrument.scoring),
        respuesta.score
      ),
    }));

  // Gráfica: una línea por instrumento con ≥2 respuestas, cruzadas por fecha.
  // `code` es único en AssessmentInstrument, así que sirve de dataKey.
  const porInstrumento = new Map<
    string,
    { code: string; name: string; puntos: Map<number, { label: string; score: number }> }
  >();
  for (const respuesta of responses) {
    const instrumento = respuesta.assignment.instrument;
    let serie = porInstrumento.get(instrumento.id);
    if (!serie) {
      serie = { code: instrumento.code, name: instrumento.name, puntos: new Map() };
      porInstrumento.set(instrumento.id, serie);
    }
    // Si hubiera dos respuestas el mismo día, se conserva la más reciente.
    serie.puntos.set(respuesta.createdAt.getTime(), {
      label: formatDate(respuesta.createdAt, "d MMM yyyy"),
      score: respuesta.score,
    });
  }

  const seriesConDatos = [...porInstrumento.values()].filter(
    (serie) => serie.puntos.size >= 2
  );
  const tiemposOrdenados = [
    ...new Set(seriesConDatos.flatMap((serie) => [...serie.puntos.keys()])),
  ].sort((a, b) => a - b);

  const datosEvolucion: EvolucionDato[] = tiemposOrdenados.map((tiempo) => {
    const fila: EvolucionDato = { fecha: "" };
    for (const serie of seriesConDatos) {
      const punto = serie.puntos.get(tiempo);
      if (punto) {
        fila.fecha = fila.fecha || punto.label;
        fila[serie.code] = punto.score;
      }
    }
    return fila;
  });

  const seriesEvolucion: EvolucionSerie[] = seriesConDatos.map((serie, i) => ({
    code: serie.code,
    nombre: serie.name,
    color: PALETA_EVOLUCION[i % PALETA_EVOLUCION.length],
  }));

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-3 space-y-0">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
          <ClipboardCheck size={18} strokeWidth={1.8} aria-hidden />
        </span>
        <CardTitle className="flex-1 text-lg">Evaluaciones</CardTitle>
        {instruments.length > 0 && (
          <AssignAssessmentDialog patientId={patientId} instruments={instruments} />
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {assignments.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aún no hay evaluaciones asignadas. Asigna un instrumento estandarizado
            para medir la evolución del paciente entre sesiones.
          </p>
        ) : (
          <div className="space-y-3">
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Asignaciones activas
            </p>
            {activas.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No hay asignaciones activas por ahora.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {activas.map((asignacion) => (
                  <li
                    key={asignacion.id}
                    className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        {asignacion.instrument.name}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {etiquetaFrecuencia(asignacion.frequency)} · Próxima:{" "}
                        {formatDate(asignacion.nextDueAt, "d 'de' MMM yyyy")}
                      </p>
                    </div>
                    <DeactivateAssessmentButton
                      assignmentId={asignacion.id}
                      instrumentName={asignacion.instrument.name}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {filas.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Respuestas
            </p>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">
                    Fecha
                  </TableHead>
                  <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">
                    Instrumento
                  </TableHead>
                  <TableHead className="text-right text-xs uppercase tracking-widest text-muted-foreground">
                    Puntaje
                  </TableHead>
                  <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">
                    Rango
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filas.map((fila) => (
                  <TableRow key={fila.id}>
                    <TableCell className="text-muted-foreground">
                      {formatDate(fila.fecha, "d 'de' MMM yyyy")}
                    </TableCell>
                    <TableCell>{fila.instrumento}</TableCell>
                    <TableCell className="text-right tabular-nums">{fila.score}</TableCell>
                    <TableCell>
                      {fila.rango && (
                        <Badge className={clasesRango(fila.rango.label)}>
                          {fila.rango.label}
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {filas.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Evolución
            </p>
            {seriesEvolucion.length > 0 ? (
              <AssessmentEvolutionChart
                data={datosEvolucion}
                series={seriesEvolucion}
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                La curva de evolución aparecerá cuando haya al menos dos respuestas
                del mismo instrumento.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
