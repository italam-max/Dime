import { cn } from "@/lib/utils";

type LogoMarkProps = {
  /** Alto/ancho en px (el mark es cuadrado). */
  size?: number;
  /** Anima la entrada, el vaivén de hojas y el trazo de la figura. */
  animated?: boolean;
  className?: string;
  /** Título accesible; por defecto "Dime". */
  title?: string;
  /** Si es decorativo (dentro de un lockup con etiqueta propia), se oculta a lectores. */
  decorative?: boolean;
};

/**
 * Marca Dime reconstruida como SVG: una "D" salvia con dos hojas y un pétalo
 * blush a la izquierda y una figura persona/brote (brazos en alto) dentro del
 * contador. Vectorial (nítida a cualquier tamaño) y animable por partes.
 * Colores tomados de los tokens del design system "Calma".
 *
 * Esta "D" está pensada para servir como la letra D de la palabra "Dime"
 * (ver <Logo/>), o usarse suelta como isotipo/favicon.
 */
export function LogoMark({
  size = 40,
  animated = false,
  className,
  title = "Dime",
  decorative = false,
}: LogoMarkProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : title}
      aria-hidden={decorative || undefined}
      className={cn("logo-mark", animated && "logo-mark--animated", className)}
    >
      {!decorative && <title>{title}</title>}

      {/* Hojas: pétalo blush (detrás) + hoja salvia clara (delante) */}
      <g transform="translate(11 50) rotate(-8)">
        <path
          className="logo-leaf logo-leaf--petal"
          d="M0 0 C -9 -8 -9 -22 0 -29 C 9 -22 9 -8 0 0 Z"
          fill="var(--color-petal, #ecd9d1)"
        />
      </g>
      <g transform="translate(17 48) rotate(-34)">
        <path
          className="logo-leaf"
          d="M0 0 C -10 -8 -10 -24 0 -32 C 10 -24 10 -8 0 0 Z"
          fill="var(--color-primary-light, #9db8a4)"
        />
        <path
          className="logo-vein"
          d="M0 -5 C -1 -14 -1 -20 0 -27"
          fill="none"
          stroke="var(--color-surface, #ffffff)"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.9"
        />
      </g>

      {/* La "D" en salvia, con el contador recortado (fill-rule evenodd) */}
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M16 8 L34 8 C48 8 57 18 57 32 C57 46 48 56 34 56 L16 56 Z
           M27 19 L34 19 C43 19 47 25 47 32 C47 39 43 45 34 45 L27 45 Z"
        fill="var(--color-primary, #5e7a6b)"
      />

      {/* Figura persona/brote con los brazos en alto dentro del contador */}
      <g
        className="logo-sprout"
        fill="none"
        stroke="var(--color-primary, #5e7a6b)"
        strokeWidth="2.2"
        strokeLinecap="round"
      >
        <circle cx="37" cy="23" r="3" fill="var(--color-primary, #5e7a6b)" stroke="none" />
        <path className="logo-stroke" d="M37 35 L37 29" />
        <path className="logo-stroke" d="M37 30 C 34 28.5 32.4 25.8 31.6 22.6" />
        <path className="logo-stroke" d="M37 30 C 40 28.5 41.6 25.8 42.4 22.6" />
      </g>
    </svg>
  );
}

/** Hojita decorativa reutilizable (nervadura opcional). Tamaño en em. */
function LeafAccent({
  className,
  em,
  tone = "var(--color-primary-light, #9db8a4)",
}: {
  className?: string;
  em: number;
  tone?: string;
}) {
  return (
    <svg
      viewBox="0 0 20 24"
      width={`${em}em`}
      height={`${em * 1.2}em`}
      aria-hidden
      className={className}
    >
      <path
        className="logo-accent-leaf"
        d="M10 24 C 1 17 1 6 10 0 C 19 6 19 17 10 24 Z"
        fill={tone}
      />
      <path
        d="M10 20 C 9 13 9 8 10 3"
        fill="none"
        stroke="var(--color-surface, #ffffff)"
        strokeWidth="1.4"
        strokeLinecap="round"
        opacity="0.85"
      />
    </svg>
  );
}

type LogoProps = {
  /** Alto del mark en px; el texto "ime" se escala con wordmarkClassName. */
  size?: number;
  animated?: boolean;
  /** Muestra "ime" junto al mark, formando la palabra "Dime". */
  withWordmark?: boolean;
  /** Clase Tailwind para el tamaño tipográfico de "ime", ej. "text-3xl". */
  wordmarkClassName?: string;
  className?: string;
};

/**
 * Logo completo "Dime": el mark actúa como la letra D y le sigue "ime"
 * en la tipografía display. El punto de la "i" es una hojita y un pequeño
 * brote crece sobre la palabra, ligando el motivo botánico a todo el logo.
 */
export function Logo({
  size = 36,
  animated = false,
  withWordmark = true,
  wordmarkClassName = "text-2xl",
  className,
}: LogoProps) {
  if (!withWordmark) {
    return <LogoMark size={size} animated={animated} className={className} />;
  }

  return (
    <span
      role="img"
      aria-label="Dime"
      className={cn("inline-flex items-center", className)}
    >
      <LogoMark size={size} animated={animated} decorative />
      <span
        aria-hidden
        className={cn(
          "relative font-display font-semibold leading-none text-foreground",
          animated && "logo-word--animated",
          wordmarkClassName
        )}
        style={{ marginLeft: -size * 0.04 }}
      >
        {/* brote de hojas sobre la palabra */}
        <span className="logo-sprig pointer-events-none absolute -top-[0.3em] right-[0.12em] flex items-end gap-[0.01em]">
          <LeafAccent em={0.32} className="-rotate-[42deg]" />
          <LeafAccent
            em={0.4}
            className="-rotate-[6deg]"
            tone="var(--color-primary, #5e7a6b)"
          />
        </span>
        {/* la "ı" (sin punto) con su punto convertido en hojita */}
        <span className="relative">
          {"ı"}
          <LeafAccent
            em={0.28}
            className="logo-tittle pointer-events-none absolute -top-[0.02em] left-[0.01em] rotate-[14deg]"
          />
        </span>
        me
      </span>
    </span>
  );
}
