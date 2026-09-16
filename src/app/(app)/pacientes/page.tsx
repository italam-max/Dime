import type { Metadata } from "next";
import Link from "next/link";
import { Search, UserPlus, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { calculateAge, formatDate, patientFullName } from "@/lib/utils";
import { PatientActiveBadge } from "@/components/pacientes/status-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata: Metadata = {
  title: "Pacientes · Dime",
};

const PAGE_SIZE = 12;

const ESTADO_OPTIONS = [
  { value: "todos", label: "Todos" },
  { value: "activos", label: "Activos" },
  { value: "inactivos", label: "Inactivos" },
];

// Listado de pacientes: búsqueda por nombre/apellidos/teléfono (q), filtro por
// estado y paginación simple — todo vía search params, sin estado cliente.
export default async function PacientesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; estado?: string; page?: string }>;
}) {
  const { q = "", estado = "todos", page = "1" } = await searchParams;
  const currentPage = Math.max(1, Number.parseInt(page, 10) || 1);

  const where = {
    AND: [
      q
        ? {
            OR: [
              { nombre: { contains: q } },
              { apellidos: { contains: q } },
              { telefono: { contains: q } },
            ],
          }
        : {},
      estado === "activos" ? { isActive: true } : {},
      estado === "inactivos" ? { isActive: false } : {},
    ],
  };

  const [total, patients] = await Promise.all([
    prisma.patient.count({ where }),
    prisma.patient.findMany({
      where,
      orderBy: [{ apellidos: "asc" }, { nombre: "asc" }],
      skip: (currentPage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      // Última cita del paciente (la más reciente por fecha de inicio).
      include: {
        appointments: {
          orderBy: { startAt: "desc" },
          take: 1,
          select: { startAt: true },
        },
      },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function pageHref(targetPage: number): string {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (estado !== "todos") params.set("estado", estado);
    params.set("page", String(targetPage));
    return `/pacientes?${params.toString()}`;
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-semibold text-foreground">
            Pacientes
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {total === 1 ? "1 paciente" : `${total} pacientes`} en tu consultorio.
          </p>
        </div>
        <Button asChild>
          <Link href="/pacientes/nuevo">
            <UserPlus data-icon="inline-start" />
            Nuevo paciente
          </Link>
        </Button>
      </div>

      <form method="GET" action="/pacientes" className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-64 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Buscar por nombre, apellidos o teléfono"
            className="pl-8"
            aria-label="Buscar paciente"
          />
        </div>
        <select
          name="estado"
          defaultValue={estado}
          aria-label="Filtrar por estado"
          className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
        >
          {ESTADO_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <Button type="submit" variant="outline">
          Buscar
        </Button>
      </form>

      {patients.length === 0 ? (
        <EmptyState
          icon={q ? Search : Users}
          title={q ? "Sin resultados" : "Aún no tienes pacientes registrados"}
          description={
            q
              ? "No encontramos pacientes que coincidan con tu búsqueda. Prueba con otro nombre o teléfono."
              : "Empieza creando el primero. Su historial de citas y pagos quedará reunido aquí."
          }
          action={
            !q && (
              <Button asChild>
                <Link href="/pacientes/nuevo">
                  <UserPlus data-icon="inline-start" />
                  Nuevo paciente
                </Link>
              </Button>
            )
          }
        />
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">
                  Nombre
                </TableHead>
                <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">
                  Edad
                </TableHead>
                <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">
                  Teléfono
                </TableHead>
                <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">
                  Estado
                </TableHead>
                <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">
                  Última cita
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {patients.map((patient) => {
                const age = calculateAge(patient.fechaNacimiento);
                const lastAppointment = patient.appointments[0];
                return (
                  <TableRow key={patient.id}>
                    <TableCell>
                      <Link
                        href={`/pacientes/${patient.id}`}
                        className="font-medium text-foreground hover:text-primary hover:underline underline-offset-4"
                      >
                        {patientFullName(patient)}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {age !== null ? `${age} años` : "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {patient.telefono}
                    </TableCell>
                    <TableCell>
                      <PatientActiveBadge isActive={patient.isActive} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {lastAppointment
                        ? formatDate(lastAppointment.startAt, "d 'de' MMM yyyy")
                        : "Sin citas"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      {total > PAGE_SIZE && (
        <nav
          className="flex items-center justify-between text-sm text-muted-foreground"
          aria-label="Paginación de pacientes"
        >
          <Button asChild variant="ghost" size="sm" aria-disabled={currentPage <= 1}>
            <Link href={pageHref(currentPage - 1)} tabIndex={currentPage <= 1 ? -1 : undefined}>
              ← Anterior
            </Link>
          </Button>
          <span>
            Página {currentPage} de {totalPages}
          </span>
          <Button asChild variant="ghost" size="sm" aria-disabled={currentPage >= totalPages}>
            <Link
              href={pageHref(currentPage + 1)}
              tabIndex={currentPage >= totalPages ? -1 : undefined}
            >
              Siguiente →
            </Link>
          </Button>
        </nav>
      )}
    </div>
  );
}
