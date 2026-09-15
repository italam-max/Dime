"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { ChartTooltip } from "./chart-tooltip";

export interface StatusChartDatum {
  estado: string;
  estadoKey: string;
  citas: number;
}

// Paleta "Calma" por estado de cita.
const COLOR_POR_ESTADO: Record<string, string> = {
  COMPLETADA: "#5E7A6B",
  CONFIRMADA: "#8A857C",
  PENDIENTE: "#E8E5DE",
  NO_ASISTIO: "#B08968",
  CANCELADA: "#CFC9BE",
};

const colorPara = (estadoKey: string, index: number): string =>
  COLOR_POR_ESTADO[estadoKey] ?? ["#5E7A6B", "#8A857C", "#E8E5DE", "#B08968"][index % 4];

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
            wrapperStyle={{ fontSize: 12, color: "#8A857C" }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
