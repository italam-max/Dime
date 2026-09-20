import Link from "next/link";
import { CalendarClock, ChevronRight, ListTodo, Wallet } from "lucide-react";
import { differenceInCalendarDays, isToday, isTomorrow } from "date-fns";
import { calculateAge, cn, formatCurrency, formatDate, patientFullName } from "@/lib/utils";

export interface PatientRowData {
  id: string;
  nombre: string;
  apellidos: string;
  telefono: string;
  fechaNacimiento: Date | null;
  isActive: boolean;
  nextAppointmentAt: Date | null;
  pendingTasks: number;
  balance: number;
}

function iniciales(nombre: string, apellidos: string): string {
  return `${nombre.charAt(0)}${apellidos.charAt(0)}`.toUpperCase();
}

// Etiqueta relativa breve para la próxima cita (Hoy / Mañana / En N días).
function relativa(date: Date): string | null {
  if (isToday(date)) return "Hoy";
  if (isTomorrow(date)) return "Mañana";
  const dias = differenceInCalendarDays(date, new Date());
  if (dias > 1 && dias <= 14) return `En ${dias} días`;
  return null;
}

// Fila de roster clínico premium: identidad de "tablero de pacientes" con
// materialidad — avatar con halo de estado, próxima cita con etiqueta relativa,
// utilidad a la derecha y una barra de acento que aparece al pasar el cursor.
export function PatientRow({ patient }: { patient: PatientRowData }) {
  const age = calculateAge(patient.fechaNacimiento);
  const rel = patient.nextAppointmentAt ? relativa(patient.nextAppointmentAt) : null;

  return (
    <Link href={`/pacientes/${patient.id}`} className="group block">
      <div
        className={cn(
          "hover-lift relative overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10",
          !patient.isActive && "opacity-70"
        )}
      >
        {/* Barra de acento en hover */}
        <span
          className="absolute inset-y-0 left-0 w-[3px] bg-primary opacity-0 transition-opacity duration-200 group-hover:opacity-100"
          aria-hidden
        />

        <div className="flex flex-wrap items-center gap-x-4 gap-y-3 px-5 py-4 sm:flex-nowrap">
          {/* Identidad */}
          <div className="flex min-w-0 items-center gap-3.5 sm:w-60 sm:shrink-0">
            <span
              className={cn(
                "flex size-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-light text-sm font-semibold text-primary-foreground shadow-soft ring-2 ring-offset-2 ring-offset-card",
                patient.isActive ? "ring-primary/40" : "ring-border"
              )}
            >
              {iniciales(patient.nombre, patient.apellidos)}
            </span>
            <div className="min-w-0">
              <p className="truncate font-display text-lg font-medium leading-tight text-foreground transition-colors group-hover:text-primary">
                {patientFullName(patient)}
              </p>
              <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                <span
                  className={cn(
                    "size-1.5 rounded-full",
                    patient.isActive ? "bg-primary" : "bg-muted-foreground/50"
                  )}
                  aria-hidden
                />
                <span>{patient.isActive ? "Activo" : "Inactivo"}</span>
                {age !== null && (
                  <>
                    <span aria-hidden>·</span>
                    <span>{age} años</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Próxima cita — dato central, con etiqueta relativa */}
          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            <CalendarClock
              size={17}
              strokeWidth={1.8}
              className={cn(
                "shrink-0",
                patient.nextAppointmentAt ? "text-primary" : "text-muted-foreground/50"
              )}
              aria-hidden
            />
            {patient.nextAppointmentAt ? (
              <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                <p className="truncate text-sm text-foreground">
                  <span className="font-medium">
                    {formatDate(patient.nextAppointmentAt, "EEE d 'de' MMM")}
                  </span>
                  <span className="text-muted-foreground">
                    {" · "}
                    {formatDate(patient.nextAppointmentAt, "h:mm a")}
                  </span>
                </p>
                {rel && (
                  <span className="rounded-full bg-primary-soft px-2 py-0.5 text-[0.7rem] font-semibold text-primary">
                    {rel}
                  </span>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground/70">Sin próxima cita</p>
            )}
          </div>

          {/* Utilidad + acceso */}
          <div className="flex shrink-0 items-center gap-2">
            {patient.pendingTasks > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-honey-soft px-2.5 py-1 text-xs font-medium text-honey">
                <ListTodo size={13} strokeWidth={2} aria-hidden />
                {patient.pendingTasks}
              </span>
            )}
            {patient.balance > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-warm-soft px-2.5 py-1 text-xs font-medium text-accent-warm">
                <Wallet size={13} strokeWidth={2} aria-hidden />
                {formatCurrency(Math.round(patient.balance))}
              </span>
            )}
            <ChevronRight
              size={18}
              className="text-muted-foreground/50 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-primary"
              aria-hidden
            />
          </div>
        </div>
      </div>
    </Link>
  );
}
