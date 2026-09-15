import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface KpiDelta {
  direction: "up" | "down" | "flat";
  text: string;
}

interface KpiCardProps {
  label: string;
  value: string;
  delta?: KpiDelta;
}

// Tarjeta de KPI: etiqueta sobria, cifra grande y comparación sutil
// con el mes anterior en muted-foreground (sin drama).
export function KpiCard({ label, value, delta }: KpiCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1.5">
        <p className="text-3xl font-semibold tabular-nums text-foreground">{value}</p>
        {delta && (
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            {delta.direction === "up" && <ArrowUpRight size={14} aria-hidden />}
            {delta.direction === "down" && <ArrowDownRight size={14} aria-hidden />}
            {delta.direction === "flat" && <Minus size={14} aria-hidden />}
            {delta.text}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
