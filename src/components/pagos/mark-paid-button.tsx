"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { markPaymentAsPaid } from "@/app/(app)/pagos/actions";

// Confirma el monto con el terapeuta antes de marcar el pago como cobrado.
export function MarkPaidButton({
  paymentId,
  amount,
}: {
  paymentId: string;
  amount: number;
}) {
  const [pending, startTransition] = useTransition();

  function handleClick() {
    if (!window.confirm(`¿Confirmar el cobro de ${formatCurrency(amount)}?`)) return;
    startTransition(async () => {
      const result = await markPaymentAsPaid(paymentId);
      if (result.ok) {
        toast.success("Pago marcado como cobrado");
      } else {
        toast.error(result.message ?? "No se pudo actualizar el pago.");
      }
    });
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={handleClick}
      disabled={pending}
    >
      <Check aria-hidden />
      {pending ? "Cobrando…" : "Marcar pagado"}
    </Button>
  );
}
