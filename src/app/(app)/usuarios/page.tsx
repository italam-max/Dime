import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { cn, formatDate } from "@/lib/utils";
import { ROLE_LABELS, USER_ROLES, type UserRole } from "@/lib/validations/user";
import { CreateUserDialog } from "@/components/usuarios/create-user-dialog";
import { UserActions } from "@/components/usuarios/user-actions";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata: Metadata = {
  title: "Usuarios · Dime",
};

const ROLE_BADGE: Record<string, string> = {
  SUPERADMIN: "bg-primary-soft text-primary",
  ADMIN: "bg-accent-warm-soft text-accent-warm",
  THERAPIST: "bg-surface-muted text-muted-foreground",
};

// Gestión de usuarios y accesos. Solo para SUPERADMIN.
export default async function UsuariosPage() {
  const current = await getCurrentUser();
  if (!current) redirect("/login");
  if (current.role !== "SUPERADMIN") redirect("/");

  // Solo cuentas de staff. Las cuentas de paciente (role PATIENT) se gestionan
  // desde la ficha del paciente, no aquí.
  const users = await prisma.user.findMany({
    where: { role: { in: [...USER_ROLES] } },
    orderBy: [{ isActive: "desc" }, { createdAt: "asc" }],
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-semibold text-foreground">Usuarios</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Gestiona los accesos al sistema, sus roles y su estado.
          </p>
        </div>
        <CreateUserDialog />
      </div>

      <Card className="px-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-6 text-xs uppercase tracking-widest text-muted-foreground">
                Usuario
              </TableHead>
              <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">
                Rol
              </TableHead>
              <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">
                Estado
              </TableHead>
              <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">
                Registrado
              </TableHead>
              <TableHead className="pr-6 text-right text-xs uppercase tracking-widest text-muted-foreground">
                Acciones
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => {
              const isSelf = user.id === current.id;
              return (
                <TableRow key={user.id} className={cn(!user.isActive && "opacity-60")}>
                  <TableCell className="pl-6">
                    <Link
                      href={`/usuarios/${user.id}`}
                      className="group flex items-center gap-3 rounded-control -mx-1 px-1 py-0.5 transition-colors hover:bg-surface-muted"
                    >
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-light text-xs font-semibold text-primary-foreground">
                        {`${user.name.charAt(0)}`.toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground group-hover:text-primary">
                          {user.name}
                          {isSelf && (
                            <span className="ml-2 text-xs font-normal text-muted-foreground">
                              (tú)
                            </span>
                          )}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2.5 py-1 text-xs font-medium",
                        ROLE_BADGE[user.role] ?? "bg-surface-muted text-muted-foreground"
                      )}
                    >
                      {ROLE_LABELS[user.role as UserRole] ?? user.role}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 text-sm",
                        user.isActive ? "text-foreground" : "text-muted-foreground"
                      )}
                    >
                      <span
                        className={cn(
                          "size-1.5 rounded-full",
                          user.isActive ? "bg-primary" : "bg-muted-foreground/50"
                        )}
                        aria-hidden
                      />
                      {user.isActive ? "Activo" : "Inactivo"}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(user.createdAt, "d 'de' MMM yyyy")}
                  </TableCell>
                  <TableCell className="pr-6 text-right">
                    <UserActions user={user} isSelf={isSelf} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
