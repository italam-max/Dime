"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { loginSchema } from "@/lib/validations/auth";
import { createSession, destroySession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export interface LoginFormState {
  message?: string;
}

// Inicia sesión: valida credenciales, crea la cookie de sesión y redirige al panel.
export async function login(
  _prev: LoginFormState,
  formData: FormData
): Promise<LoginFormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { message: "Revisa tu correo y contraseña e inténtalo de nuevo." };
  }

  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });

  // Mensaje sereno y genérico: no revela si el correo existe.
  const invalid = { message: "El correo o la contraseña no coinciden. Inténtalo de nuevo." };
  if (!user) return invalid;

  const matches = await bcrypt.compare(password, user.passwordHash);
  if (!matches) return invalid;

  // Las cuentas de paciente entran por su portal, no por el acceso del staff.
  if (user.role === "PATIENT") {
    return { message: "Esta cuenta es de paciente. Entra desde el enlace de tu portal." };
  }

  if (!user.isActive) {
    return { message: "Tu acceso está deshabilitado. Contacta a un administrador." };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  await createSession(user.id);
  redirect("/");
}

// Cierra la sesión y vuelve al login.
export async function logout(): Promise<void> {
  await destroySession();
  redirect("/login");
}
