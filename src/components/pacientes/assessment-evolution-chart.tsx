"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartTooltip } from "@/components/dashboard/chart-tooltip";

export interface EvolucionSerie {
  code: string; // clave del instrumento (dataKey de la línea)
  nombre: string; // etiqueta visible en leyenda y tooltip
  color: string;
}

export interface EvolucionDato {
  fecha: string;
  [clave: string]: string | number | undefined;
}

// Evolución de puntajes en el tiempo: una línea por instrumento, ejes suaves
// y paleta Calma (mismo lenguaje que las gráficas del dashboard).
export function AssessmentEvolutionChart({
  data,
  series,
}: {
  data: EvolucionDato[];
  series: EvolucionSerie[];
}) {
  return (
    <div style={{ width: "100%", height: 280, fontFamily: "Inter, sans-serif" }}>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} stroke="#E8E5DE" />
          <XAxis
            dataKey="fecha"
            tickLine={false}
            axisLine={false}
            minTickGap={16}
            tick={{ fontSize: 12, fill: "#8A857C" }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={32}
            allowDecimals={false}
            tick={{ fontSize: 12, fill: "#8A857C" }}
          />
          <Tooltip
            cursor={{ stroke: "#E8E5DE" }}
            content={<ChartTooltip formatValue={(value) => String(value)} />}
          />
          <Legend
            iconType="plainline"
            wrapperStyle={{ fontSize: 12, color: "#8A857C" }}
          />
          {series.map((serie) => (
            <Line
              key={serie.code}
              name={serie.nombre}
              dataKey={serie.code}
              stroke={serie.color}
              strokeWidth={2}
              dot={{ r: 3, fill: serie.color, strokeWidth: 0 }}
              activeDot={{ r: 4 }}
              connectNulls={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
