"use client";

import { useActionState, useState } from "react";
import { activatePortalAccount, type PortalActionState } from "@/app/(portal)/portal/acciones";
import { Button } from "@/components/ui/button";

const initialState: PortalActionState = {};

// Alta de la cuenta del paciente: define contraseña + acepta el aviso de
// privacidad. Al enviar se crea su cuenta y se abre su espacio.
export function ConsentForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(activatePortalAccount, initialState);
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [accepted, setAccepted] = useState(false);

  const canSubmit = accepted && password.length >= 8 && !pending;

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="token" value={token} />

      <div className="rounded-control bg-surface p-4 shadow-soft">
        <label htmlFor="portal-password" className="text-sm font-medium text-foreground">
          Crea tu contraseña
        </label>
        <p className="mt-1 text-xs text-muted-foreground">
          La usarás para entrar a tu espacio la próxima vez. Mínimo 8 caracteres.
        </p>
        <div className="mt-3 flex items-center gap-2">
          <input
            id="portal-password"
            name="password"
            type={show ? "text" : "password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
            minLength={8}
            className="min-h-11 w-full rounded-control border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary"
            placeholder="Tu contraseña"
          />
          <Button
            type="button"
            variant="outline"
            className="min-h-11 shrink-0"
            onClick={() => setShow((v) => !v)}
          >
            {show ? "Ocultar" : "Mostrar"}
          </Button>
        </div>
      </div>

      <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-control bg-surface p-4 shadow-soft">
        <input
          type="checkbox"
          name="consent"
          checked={accepted}
          onChange={(event) => setAccepted(event.target.checked)}
          className="mt-0.5 size-4 shrink-0 accent-primary"
        />
        <span className="text-sm leading-relaxed text-foreground">
          He leído y acepto el aviso de privacidad.
        </span>
      </label>

      {state.message && (
        <p className="text-sm text-danger" role="alert">
          {state.message}
        </p>
      )}

      <Button type="submit" className="min-h-11 w-full" disabled={!canSubmit}>
        {pending ? "Creando tu espacio…" : "Crear mi cuenta y entrar"}
      </Button>
    </form>
  );
}
