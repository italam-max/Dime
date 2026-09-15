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

// Ingresos cobrados por mes (últimos 12 meses). Serie salvia, ejes sobrios.
export function IncomeChart({ data }: { data: IncomeChartDatum[] }) {
  return (
    <div style={{ width: "100%", height: 280, fontFamily: "Inter, sans-serif" }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} stroke="#E8E5DE" />
          <XAxis
            dataKey="mes"
            tickLine={false}
            axisLine={false}
            minTickGap={16}
            tick={{ fontSize: 12, fill: "#8A857C" }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={56}
            tick={{ fontSize: 12, fill: "#8A857C" }}
            tickFormatter={(value: number) => formatoCompacto.format(value)}
          />
          <Tooltip
            cursor={{ fill: "rgba(94,122,107,0.06)" }}
            content={<ChartTooltip formatValue={(value) => formatCurrency(value)} />}
          />
          <Bar
            name="Ingresos"
            dataKey="ingresos"
            fill="#5E7A6B"
            radius={[4, 4, 0, 0]}
            maxBarSize={32}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
