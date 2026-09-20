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

const P_LIGHT = "var(--color-primary-light, #9db8a4)";
const P = "var(--color-primary, #5e7a6b)";
const MINT = "var(--color-mint, #8ee6b6)";
const PETAL = "var(--color-petal, #ecd9d1)";

// Una hoja grande individual, dimensionada por el ancho de la clase. La silueta
// crece hacia arriba (punta arriba); se rota con la clase para orientarla.
function BigLeaf({
  className,
  tone,
  op,
}: {
  className?: string;
  tone: string;
  op: number;
}) {
  return (
    <svg
      viewBox="-11 -31 22 33"
      aria-hidden
      className={cn("absolute", className)}
      style={{ opacity: op }}
    >
      <path d={LEAF} fill={tone} />
      <path
        d={VEIN}
        fill="none"
        stroke="var(--color-background, #151a17)"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.45"
      />
    </svg>
  );
}

// Fondo de bosque: follaje grande enmarcando el contenido (dosel arriba, maleza
// abajo, hojas en los costados), posicionado con CSS para no deformarse. El
// centro queda despejado para leer. Colócalo en un contenedor `relative` con
// `absolute inset-0 overflow-hidden` detrás del contenido.
export function ForestBackdrop() {
  return (
    <>
      {/* Dosel superior */}
      <BigLeaf className="-top-20 -left-12 w-64 rotate-[202deg]" tone={P_LIGHT} op={0.16} />
      <BigLeaf className="-top-28 left-28 w-72 rotate-[168deg]" tone={MINT} op={0.12} />
      <BigLeaf className="-top-24 right-2 w-80 rotate-[158deg]" tone={P_LIGHT} op={0.15} />
      <BigLeaf className="-top-32 right-44 w-64 rotate-[196deg]" tone={MINT} op={0.11} />
      <BigLeaf className="-top-16 left-1/2 hidden w-56 -translate-x-1/2 rotate-180 lg:block" tone={P_LIGHT} op={0.07} />
      {/* Costados */}
      <BigLeaf className="top-[34%] -left-24 w-72 rotate-[82deg]" tone={P_LIGHT} op={0.09} />
      <BigLeaf className="top-[48%] -right-24 w-80 -rotate-[82deg]" tone={P} op={0.09} />
      {/* Pétalos de acento */}
      <BigLeaf className="top-[44%] left-6 w-40 rotate-[58deg]" tone={PETAL} op={0.1} />
      <BigLeaf className="top-[56%] right-8 w-40 -rotate-[58deg]" tone={PETAL} op={0.1} />
      {/* Maleza inferior */}
      <BigLeaf className="-bottom-20 -left-10 w-80 rotate-[10deg]" tone={P_LIGHT} op={0.16} />
      <BigLeaf className="-bottom-28 left-40 w-64 -rotate-[22deg]" tone={MINT} op={0.12} />
      <BigLeaf className="-bottom-24 right-6 w-80 -rotate-[10deg]" tone={P_LIGHT} op={0.16} />
      <BigLeaf className="-bottom-32 right-48 w-64 rotate-[24deg]" tone={MINT} op={0.12} />
    </>
  );
}
