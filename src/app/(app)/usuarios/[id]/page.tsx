import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowLeft, CalendarDays, Clock, Mail, ShieldCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { cn, formatDate } from "@/lib/utils";
import { ROLE_DESCRIPTIONS, ROLE_LABELS, type UserRole } from "@/lib/validations/user";
import { UserActions } from "@/components/usuarios/user-actions";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Usuario · Dime",
};

const ROLE_BADGE: Record<string, string> = {
  SUPERADMIN: "bg-primary-soft text-primary",
  ADMIN: "bg-accent-warm-soft text-accent-warm",
  THERAPIST: "bg-surface-muted text-muted-foreground",
};

function relative(date: Date): string {
  return formatDistanceToNow(date, { addSuffix: true, locale: es });
}

// Ficha de acceso de un usuario. Solo para SUPERADMIN. Reúne identidad, rol,
// estado y actividad de la cuenta; las acciones de gestión viven en un solo
// lugar (encabezado) y todas piden confirmación.
export default async function UsuarioDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const current = await getCurrentUser();
  if (!current) redirect("/login");
  if (current.role !== "SUPERADMIN") redirect("/");

  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
    },
  });
  if (!user) notFound();
  // Las cuentas de paciente no se gestionan desde la herramienta de staff.
  if (user.role === "PATIENT") redirect("/usuarios");

  const isSelf = user.id === current.id;
  const roleLabel = ROLE_LABELS[user.role as UserRole] ?? user.role;
  const roleDescription = ROLE_DESCRIPTIONS[user.role as UserRole];

  const facts: { icon: typeof Mail; label: string; value: string; hint?: string }[] = [
    { icon: Mail, label: "Correo", value: user.email },
    {
      icon: ShieldCheck,
      label: "Rol",
      value: roleLabel,
      hint: roleDescription,
    },
    {
      icon: Clock,
      label: "Último acceso",
      value: user.lastLoginAt ? relative(user.lastLoginAt) : "Nunca ha ingresado",
      hint: user.lastLoginAt ? formatDate(user.lastLoginAt, "d 'de' MMM yyyy, HH:mm") : undefined,
    },
    {
      icon: CalendarDays,
      label: "Registrado",
      value: relative(user.createdAt),
      hint: formatDate(user.createdAt, "d 'de' MMM yyyy"),
    },
  ];

  return (
    <div className="animate-fade-in space-y-6">
      <Link
        href="/usuarios"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft size={16} strokeWidth={1.8} aria-hidden />
        Usuarios
      </Link>

      {/* Encabezado: identidad + acciones de gestión. */}
      <Card className="flex flex-wrap items-start justify-between gap-6 px-4">
        <div className="flex items-center gap-4">
          <span className="flex size-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-light text-xl font-semibold text-primary-foreground">
            {user.name.charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-3xl font-semibold text-foreground">{user.name}</h1>
              {isSelf && (
                <span className="text-sm font-normal text-muted-foreground">(tú)</span>
              )}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "inline-flex rounded-full px-2.5 py-1 text-xs font-medium",
                  ROLE_BADGE[user.role] ?? "bg-surface-muted text-muted-foreground"
                )}
              >
                {roleLabel}
              </span>
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                  user.isActive
                    ? "bg-primary-soft text-primary"
                    : "bg-surface-muted text-muted-foreground"
                )}
              >
                <span
                  className={cn(
                    "size-1.5 rounded-full",
                    user.isActive ? "bg-primary" : "bg-muted-foreground/50"
                  )}
                  aria-hidden
                />
                {user.isActive ? "Acceso activo" : "Acceso deshabilitado"}
              </span>
            </div>
          </div>
        </div>

        <UserActions user={user} isSelf={isSelf} />
      </Card>

      {/* Datos de la cuenta. */}
      <div className="grid gap-4 sm:grid-cols-2">
        {facts.map(({ icon: Icon, label, value, hint }) => (
          <Card key={label} className="flex flex-row items-start gap-3 px-4">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-control bg-surface-muted text-muted-foreground">
              <Icon size={18} strokeWidth={1.8} aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
              <p className="mt-1 truncate text-sm font-medium text-foreground">{value}</p>
              {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
            </div>
          </Card>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        Los pacientes, la agenda y los pagos son compartidos por la cuenta. El rol determina qué
        puede hacer esta persona dentro del sistema.
      </p>
    </div>
  );
}
