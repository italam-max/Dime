"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import {
  createUserSchema,
  isUserRole,
  PATIENT_ROLE,
  type UserRole,
} from "@/lib/validations/user";

export interface UserActionState {
  ok: boolean;
  message?: string;
  /** Contraseña temporal generada (solo se muestra una vez). */
  tempPassword?: string;
}

// Solo un SUPERADMIN puede gestionar usuarios. Devuelve el admin o un error.
async function requireSuperAdmin(): Promise<
  { ok: true; adminId: string } | { ok: false; state: UserActionState }
> {
  const current = await getCurrentUser();
  if (!current || current.role !== "SUPERADMIN") {
    return { ok: false, state: { ok: false, message: "No tienes permiso para esta acción." } };
  }
  return { ok: true, adminId: current.id };
}

function genTempPassword(): string {
  return randomBytes(15).toString("base64url").slice(0, 18);
}

export async function createUser(input: {
  name: string;
  email: string;
  role: string;
  password: string;
}): Promise<UserActionState> {
  const guard = await requireSuperAdmin();
  if (!guard.ok) return guard.state;

  const parsed = createUserSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) return { ok: false, message: "Ya existe un usuario con ese correo." };

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      role: parsed.data.role,
      passwordHash,
    },
  });

  revalidatePath("/usuarios");
  return { ok: true, message: "Usuario creado" };
}

export async function setUserRole(userId: string, role: string): Promise<UserActionState> {
  const guard = await requireSuperAdmin();
  if (!guard.ok) return guard.state;
  if (!isUserRole(role)) return { ok: false, message: "Rol inválido." };

  if (userId === guard.adminId) {
    return { ok: false, message: "No puedes cambiar tu propio rol." };
  }

  const target = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!target) return { ok: false, message: "No se encontró el usuario." };
  if (target.role === PATIENT_ROLE) {
    return { ok: false, message: "Las cuentas de paciente se gestionan desde su ficha." };
  }

  // No dejar el sistema sin super admins.
  if (target.role === "SUPERADMIN" && role !== "SUPERADMIN") {
    const superAdmins = await prisma.user.count({ where: { role: "SUPERADMIN" } });
    if (superAdmins <= 1) {
      return { ok: false, message: "Debe existir al menos un super admin." };
    }
  }

  await prisma.user.update({ where: { id: userId }, data: { role: role as UserRole } });
  revalidatePath("/usuarios");
  return { ok: true, message: "Rol actualizado" };
}

export async function setUserActive(userId: string, isActive: boolean): Promise<UserActionState> {
  const guard = await requireSuperAdmin();
  if (!guard.ok) return guard.state;

  if (userId === guard.adminId) {
    return { ok: false, message: "No puedes desactivar tu propia cuenta." };
  }

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, isActive: true },
  });
  if (!target) return { ok: false, message: "No se encontró el usuario." };
  if (target.role === PATIENT_ROLE) {
    return { ok: false, message: "Las cuentas de paciente se gestionan desde su ficha." };
  }

  if (!isActive && target.role === "SUPERADMIN") {
    const activeSupers = await prisma.user.count({
      where: { role: "SUPERADMIN", isActive: true },
    });
    if (activeSupers <= 1) {
      return { ok: false, message: "Debe quedar al menos un super admin activo." };
    }
  }

  await prisma.user.update({ where: { id: userId }, data: { isActive } });
  revalidatePath("/usuarios");
  return { ok: true, message: isActive ? "Acceso habilitado" : "Acceso deshabilitado" };
}

export async function resetUserPassword(userId: string): Promise<UserActionState> {
  const guard = await requireSuperAdmin();
  if (!guard.ok) return guard.state;

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });
  if (!target) return { ok: false, message: "No se encontró el usuario." };
  if (target.role === PATIENT_ROLE) {
    return { ok: false, message: "Las cuentas de paciente se gestionan desde su ficha." };
  }

  const tempPassword = genTempPassword();
  const passwordHash = await bcrypt.hash(tempPassword, 10);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });

  revalidatePath("/usuarios");
  return { ok: true, message: "Contraseña restablecida", tempPassword };
}
