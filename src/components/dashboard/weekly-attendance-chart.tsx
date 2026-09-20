"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartTooltip } from "./chart-tooltip";

export interface AttendanceChartDatum {
  semana: string;
  completadas: number;
  noAsistieron: number;
}

// Asistencia de las últimas 8 semanas: completadas vs no asistieron.
export function WeeklyAttendanceChart({ data }: { data: AttendanceChartDatum[] }) {
  return (
    <div style={{ width: "100%", height: 280, fontFamily: "Inter, sans-serif" }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--color-border)" />
          <XAxis
            dataKey="semana"
            tickLine={false}
            axisLine={false}
            minTickGap={16}
            tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
          />
          <YAxis
            allowDecimals={false}
            tickLine={false}
            axisLine={false}
            width={32}
            tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
          />
          <Tooltip
            cursor={{ fill: "color-mix(in srgb, var(--color-primary) 10%, transparent)" }}
            content={<ChartTooltip />}
          />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 12, color: "var(--color-muted-foreground)" }}
          />
          <Bar
            name="Completadas"
            dataKey="completadas"
            fill="var(--color-mint)"
            radius={[3, 3, 0, 0]}
            maxBarSize={20}
          />
          <Bar
            name="No asistieron"
            dataKey="noAsistieron"
            fill="var(--color-accent-warm)"
            radius={[3, 3, 0, 0]}
            maxBarSize={20}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
