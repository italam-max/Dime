"use client";

import type { ReactNode } from "react";

interface TooltipItem {
  name?: string | number;
  value?: number | string;
  color?: string;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: TooltipItem[];
  label?: ReactNode;
  formatValue?: (value: number) => string;
}

// Tooltip compartido para las gráficas del dashboard:
// card blanca, radio 8, sombra suave y texto sobrio (design system "Calma").
export function ChartTooltip({ active, payload, label, formatValue }: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="rounded-lg border border-border bg-surface px-3 py-2 text-sm shadow-[0_1px_2px_rgba(44,42,38,.04),0_8px_24px_rgba(44,42,38,.06)]">
      {label != null && label !== "" && (
        <p className="mb-1 font-medium capitalize text-foreground">{label}</p>
      )}
      {payload.map((item, i) => (
        <p key={i} className="flex items-center gap-2 text-muted-foreground">
          <span
            className="size-2 shrink-0 rounded-full"
            style={{ backgroundColor: item.color ?? "#8A857C" }}
          />
          <span>{item.name}</span>
          <span className="ml-auto pl-4 font-medium tabular-nums text-foreground">
            {formatValue ? formatValue(Number(item.value)) : item.value}
          </span>
        </p>
      ))}
    </div>
  );
}
