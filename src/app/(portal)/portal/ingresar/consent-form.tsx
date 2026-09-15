"use client";

import { useActionState, useState } from "react";
import { acceptPortalInvitation, type PortalActionState } from "@/app/(portal)/portal/acciones";
import { Button } from "@/components/ui/button";

const initialState: PortalActionState = {};

// Checkbox de consentimiento + envío. El botón se habilita solo al aceptar.
export function ConsentForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(acceptPortalInvitation, initialState);
  const [accepted, setAccepted] = useState(false);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="token" value={token} />

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

      <Button type="submit" className="min-h-11 w-full" disabled={!accepted || pending}>
        {pending ? "Abriendo tu espacio…" : "Entrar a mi espacio"}
      </Button>
    </form>
  );
}
