"use client";

import { useActionState } from "react";
import { loginPortal, type PortalActionState } from "@/app/(portal)/portal/acciones";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: PortalActionState = {};

export function PortalLoginForm() {
  const [state, action, pending] = useActionState(loginPortal, initialState);

  return (
    <form action={action} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="email">Correo electrónico</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="tu@correo.com"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Contraseña</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          required
          minLength={8}
        />
      </div>

      {state.message && (
        <p className="text-sm text-danger" role="alert">
          {state.message}
        </p>
      )}

      <Button type="submit" className="min-h-11 w-full" disabled={pending}>
        {pending ? "Entrando…" : "Entrar a mi espacio"}
      </Button>
    </form>
  );
}
