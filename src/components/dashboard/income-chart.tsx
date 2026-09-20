"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartTooltip } from "./chart-tooltip";
import { formatCurrency } from "@/lib/utils";

export interface IncomeChartDatum {
  mes: string;
  ingresos: number;
}

const formatoCompacto = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  notation: "compact",
});

// Ingresos cobrados por mes (últimos 12 meses). Serie color miel/ámbar (dinero),
// ejes y rejilla en tokens del tema para adaptarse a claro/oscuro.
export function IncomeChart({ data }: { data: IncomeChartDatum[] }) {
  return (
    <div style={{ width: "100%", height: 280, fontFamily: "Inter, sans-serif" }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--color-border)" />
          <XAxis
            dataKey="mes"
            tickLine={false}
            axisLine={false}
            minTickGap={16}
            tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={56}
            tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
            tickFormatter={(value: number) => formatoCompacto.format(value)}
          />
          <Tooltip
            cursor={{ fill: "color-mix(in srgb, var(--color-honey) 12%, transparent)" }}
            content={<ChartTooltip formatValue={(value) => formatCurrency(value)} />}
          />
          <Bar
            name="Ingresos"
            dataKey="ingresos"
            fill="var(--color-honey)"
            radius={[4, 4, 0, 0]}
            maxBarSize={32}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
