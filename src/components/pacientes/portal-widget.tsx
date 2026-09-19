"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Copy, Link2, ShieldCheck, ShieldOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  inviteToPortal,
  revokePortalAccess,
} from "@/app/(app)/pacientes/portal-actions";

// Estado del acceso al portal tal como lo calcula la ficha del paciente.
export type PortalAccessStatus = "none" | "pending" | "active" | "revoked";

// Botones de invitación/revocación. Al invitar se muestra el enlace completo
// listo para copiar: es la única vez que el token viaja en claro.
export function PortalWidget({
  patientId,
  status,
  acceptedAt,
  expiresAt,
}: {
  patientId: string;
  status: PortalAccessStatus;
  acceptedAt: Date | null;
  expiresAt: Date | null;
}) {
  const [pending, startTransition] = useTransition();
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function handleInvite() {
    startTransition(async () => {
      const result = await inviteToPortal(patientId);
      if (result.success && result.link) {
        setLink(`${window.location.origin}${result.link}`);
        setCopied(false);
        toast.success(result.message ?? "Enlace generado");
      } else {
        toast.error(result.message ?? "No se pudo generar el enlace.");
      }
    });
  }

  function handleRevoke() {
    if (!window.confirm("¿Revocar el acceso al portal? El paciente perderá su sesión.")) return;
    startTransition(async () => {
      const result = await revokePortalAccess(patientId);
      if (result.success) {
        setLink(null);
        toast.success(result.message ?? "Acceso revocado");
      } else {
        toast.error(result.message ?? "No se pudo revocar el acceso.");
      }
    });
  }

  async function handleCopy() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success("Enlace copiado");
    } catch {
      toast.error("No se pudo copiar. Copia el enlace manualmente.");
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {status === "active" ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRevoke}
            disabled={pending}
          >
            <ShieldOff data-icon="inline-start" />
            {pending ? "Revocando…" : "Revocar acceso"}
          </Button>
        ) : (
          <Button type="button" variant="outline" size="sm" onClick={handleInvite} disabled={pending}>
            <Link2 data-icon="inline-start" />
            {pending
              ? "Generando…"
              : status === "pending"
                ? "Generar nuevo enlace"
                : "Invitar al portal"}
          </Button>
        )}
        {status === "pending" && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRevoke}
            disabled={pending}
            className="text-muted-foreground"
          >
            Cancelar invitación
          </Button>
        )}
      </div>

      {link && (
        <div className="flex items-center gap-2">
          <Input readOnly value={link} onFocus={(e) => e.target.select()} className="text-xs" />
          <Button type="button" variant="outline" size="sm" onClick={handleCopy}>
            <Copy data-icon="inline-start" />
            {copied ? "Copiado" : "Copiar"}
          </Button>
        </div>
      )}

      <p className="flex items-start gap-1.5 text-xs leading-relaxed text-muted-foreground">
        <ShieldCheck size={14} className="mt-0.5 shrink-0" aria-hidden />
        {status === "active"
          ? `Cuenta activa desde el ${acceptedAt ? new Date(acceptedAt).toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" }) : "—"}. El paciente entra con su correo y contraseña.`
          : status === "pending"
            ? `Invitación de alta pendiente. Con el enlace el paciente define su contraseña y activa su cuenta; vence ${expiresAt ? new Date(expiresAt).toLocaleDateString("es-MX", { day: "numeric", month: "long" }) : "en 48 h"} y solo se puede usar una vez.`
            : status === "revoked"
              ? "El acceso fue revocado y la cuenta quedó deshabilitada. Puedes invitar de nuevo cuando lo necesites."
              : "El paciente aún no tiene cuenta. Genera un enlace de alta y compártelo; con él creará su contraseña y entrará a su portal."}
      </p>
    </div>
  );
}
