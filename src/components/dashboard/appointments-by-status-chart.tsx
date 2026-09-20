"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { ChartTooltip } from "./chart-tooltip";

export interface StatusChartDatum {
  estado: string;
  estadoKey: string;
  citas: number;
}

// Color con significado por estado de cita (tokens del tema, adaptables a
// claro/oscuro): completada = menta (éxito), confirmada = salvia, pendiente =
// miel (en espera), no asistió = terracota (aviso), cancelada = apagado.
const COLOR_POR_ESTADO: Record<string, string> = {
  COMPLETADA: "var(--color-mint)",
  CONFIRMADA: "var(--color-primary)",
  PENDIENTE: "var(--color-honey)",
  NO_ASISTIO: "var(--color-accent-warm)",
  CANCELADA: "var(--color-muted-foreground)",
};

const colorPara = (estadoKey: string, index: number): string =>
  COLOR_POR_ESTADO[estadoKey] ??
  [
    "var(--color-primary)",
    "var(--color-mint)",
    "var(--color-honey)",
    "var(--color-accent-warm)",
  ][index % 4];

// Distribución de citas del mes en curso por estado (dona).
export function AppointmentsByStatusChart({ data }: { data: StatusChartDatum[] }) {
  return (
    <div style={{ width: "100%", height: 280, fontFamily: "Inter, sans-serif" }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            dataKey="citas"
            nameKey="estado"
            innerRadius={68}
            outerRadius={100}
            paddingAngle={2}
            strokeWidth={0}
          >
            {data.map((entry, index) => (
              <Cell key={entry.estadoKey} fill={colorPara(entry.estadoKey, index)} />
            ))}
          </Pie>
          <Tooltip content={<ChartTooltip />} />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 12, color: "var(--color-muted-foreground)" }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
