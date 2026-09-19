"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Check, Copy, MoreHorizontal } from "lucide-react";
import {
  resetUserPassword,
  setUserActive,
  setUserRole,
  type UserActionState,
} from "@/app/(app)/usuarios/actions";
import { ROLE_LABELS, USER_ROLES } from "@/lib/validations/user";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type TargetUser = { id: string; name: string; role: string; isActive: boolean };

// Acción sensible pendiente de confirmar. Ninguna se ejecuta con un solo clic.
type Confirm = {
  title: string;
  description: string;
  actionLabel: string;
  destructive?: boolean;
  run: () => Promise<UserActionState>;
};

export function UserActions({ user, isSelf }: { user: TargetUser; isSelf: boolean }) {
  const [pending, startTransition] = useTransition();
  const [confirm, setConfirm] = useState<Confirm | null>(null);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function run(fn: () => Promise<UserActionState>) {
    startTransition(async () => {
      const result = await fn();
      if (result.ok) {
        toast.success(result.message ?? "Listo");
        if (result.tempPassword) setTempPassword(result.tempPassword);
      } else {
        toast.error(result.message ?? "No se pudo completar la acción.");
      }
    });
  }

  function confirmAndRun() {
    if (!confirm) return;
    const fn = confirm.run;
    setConfirm(null);
    run(fn);
  }

  function askReset() {
    setConfirm({
      title: "Restablecer contraseña",
      description: isSelf
        ? "Vas a generar una contraseña temporal para TU cuenta. Tu contraseña actual dejará de funcionar y tendrás que entrar con la nueva."
        : `Vas a generar una contraseña temporal para ${user.name}. Su contraseña actual dejará de funcionar. Tendrás que compartirle la nueva.`,
      actionLabel: "Restablecer",
      destructive: true,
      run: () => resetUserPassword(user.id),
    });
  }

  function askToggleActive() {
    const next = !user.isActive;
    setConfirm({
      title: next ? "Habilitar acceso" : "Deshabilitar acceso",
      description: next
        ? `${user.name} podrá volver a iniciar sesión.`
        : `${user.name} no podrá iniciar sesión y su sesión activa se cerrará. El acceso se puede volver a habilitar cuando quieras.`,
      actionLabel: next ? "Habilitar" : "Deshabilitar",
      destructive: !next,
      run: () => setUserActive(user.id, next),
    });
  }

  async function copy() {
    if (!tempPassword) return;
    try {
      await navigator.clipboard.writeText(tempPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("No se pudo copiar. Cópiala manualmente.");
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label={`Acciones de ${user.name}`}>
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuLabel className="text-xs text-muted-foreground">Cambiar rol</DropdownMenuLabel>
          {USER_ROLES.map((r) => (
            <DropdownMenuItem
              key={r}
              disabled={pending || isSelf || r === user.role}
              onClick={() => run(() => setUserRole(user.id, r))}
            >
              {ROLE_LABELS[r]}
              {r === user.role && <Check className="ml-auto size-4 text-primary" />}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem disabled={pending || isSelf} onClick={askToggleActive}>
            {user.isActive ? "Deshabilitar acceso" : "Habilitar acceso"}
          </DropdownMenuItem>
          <DropdownMenuItem disabled={pending} onClick={askReset}>
            Restablecer contraseña
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Confirmación previa a cualquier acción sensible. */}
      <Dialog open={confirm !== null} onOpenChange={(open) => !open && setConfirm(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{confirm?.title}</DialogTitle>
            <DialogDescription>{confirm?.description}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setConfirm(null)}>
              Cancelar
            </Button>
            <Button
              type="button"
              variant={confirm?.destructive ? "destructive" : "default"}
              disabled={pending}
              onClick={confirmAndRun}
            >
              {confirm?.actionLabel ?? "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Contraseña temporal generada (solo se muestra una vez). */}
      <Dialog open={tempPassword !== null} onOpenChange={(open) => !open && setTempPassword(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Contraseña temporal</DialogTitle>
            <DialogDescription>
              {isSelf
                ? "Es tu nueva contraseña. Guárdala; no se volverá a mostrar y la necesitarás para entrar."
                : `Compártela con ${user.name}. No se volverá a mostrar; pídele que la cambie al entrar.`}
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-between gap-3 rounded-control border border-border bg-surface-muted px-3 py-2">
            <code className="truncate font-mono text-sm text-foreground">{tempPassword}</code>
            <Button type="button" variant="outline" size="sm" onClick={copy}>
              {copied ? <Check data-icon="inline-start" /> : <Copy data-icon="inline-start" />}
              {copied ? "Copiada" : "Copiar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
