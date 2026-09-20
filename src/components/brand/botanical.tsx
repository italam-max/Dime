import { cn } from "@/lib/utils";

// Motivo botánico de Dime trasladado a la app: un ramo de hojas (la misma
// silueta del logo) para usar como marca de agua decorativa en encabezados,
// estados vacíos y acentos. Vive detrás del contenido, a baja opacidad.

const LEAF = "M0 0 C -9 -8 -9 -22 0 -29 C 9 -22 9 -8 0 0 Z";
const VEIN = "M0 -5 C -1 -14 -1 -20 0 -27";

// Hojas del ramo: rotación, escala y tono (tokens "Calma").
const HOJAS = [
  { r: -48, s: 0.7, tone: "var(--color-petal, #ecd9d1)" },
  { r: -22, s: 1.0, tone: "var(--color-primary-light, #9db8a4)" },
  { r: 4, s: 0.86, tone: "var(--color-primary-light, #9db8a4)" },
  { r: 30, s: 0.66, tone: "var(--color-primary, #5e7a6b)" },
];

// Ramo de hojas que crece desde el origen. Colócalo con clases (posición,
// ancho, opacidad, rotación). Es decorativo: oculto a lectores de pantalla.
export function BotanicalSpray({ className }: { className?: string }) {
  return (
    <svg viewBox="-34 -44 68 50" aria-hidden className={cn("botanical-spray", className)}>
      {HOJAS.map((h, i) => (
        <g key={i} transform={`rotate(${h.r}) scale(${h.s})`}>
          <path d={LEAF} fill={h.tone} />
          <path
            d={VEIN}
            fill="none"
            stroke="var(--color-surface, #ffffff)"
            strokeWidth="1.4"
            strokeLinecap="round"
            opacity="0.5"
          />
        </g>
      ))}
    </svg>
  );
}
