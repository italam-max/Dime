# 03 · Design System — "Calma"

Estética: **minimalismo premium** con colores sobrios y calmados. Inspiración: clínicas de bienestar de alta gama, papelería fina, luz natural.

## Filosofía

- El espacio en blanco es un feature: aire generoso (paddings de 24–48 px), contenido que respira.
- La jerarquía se construye con **tipografía y peso**, no con cajas ni bordes duros.
- Bordes casi invisibles (`border` en 8% de opacidad del tinte), sombras muy suaves y difusas.
- Nada de colores de alarma agresivos: incluso los errores son tierra quemada, no rojo puro.
- Microcopy en tono humano y tranquilo: "Aún no tienes pacientes registrados. Empieza creando el primero."

## Paleta

Base neutra cálida (piedra/porcelana) + un único acento salvia apagado + un tono terracota suave solo para deuda/alerta.

| Token | Hex | Uso |
|---|---|---|
| `background` | `#FAF9F6` | Fondo general (porcelana cálida) |
| `surface` | `#FFFFFF` | Tarjetas, paneles |
| `surface-muted` | `#F3F1EC` | Filas alternas, áreas anidadas |
| `foreground` | `#2C2A26` | Texto principal (tinta cálida) |
| `muted-foreground` | `#8A857C` | Texto secundario |
| `border` | `#E8E5DE` | Bordes sutiles |
| `primary` | `#5E7A6B` | Acento salvia (botones principales, enlaces, selección) |
| `primary-foreground` | `#FAF9F6` | Texto sobre primary |
| `primary-soft` | `#E9EFEA` | Fondos de acento (badges, hovers suaves) |
| `accent-warm` | `#B08968` | Terracota suave: saldo pendiente, avisos |
| `accent-warm-soft` | `#F4EBE2` | Fondo terracota |
| `danger` | `#A2675B` | Acciones destructivas (quemado, no rojo puro) |

## Tipografía

- **Display / títulos:** `Cormorant Garamond` (serif elegante, peso 500–600) — usada en titulares de sección y la marca.
- **Interfaz / cuerpo:** `Inter` (400/500/600) — todo lo funcional.
- Escala: 12 (caption) · 14 (body-sm) · 16 (body) · 20 (h3) · 28 (h2) · 36 (h1/display).
- Numeración de tablas y KPIs en `Inter` con `font-variant-numeric: tabular-nums`.

Carga mediante `next/font/google` (autohospedada, sin dependencia de CDN en runtime).

## Forma y profundidad

- **Radios:** 12 px en tarjetas y diálogos, 8 px en inputs/botones, 999 px en badges.
- **Sombras:** una sola familia suave — `0 1px 2px rgba(44,42,38,.04), 0 8px 24px rgba(44,42,38,.06)`; sin sombras duras.
- **Bordes:** 1 px en `#E8E5DE` (o tinte al 8%), nunca negros puros.
- **Foco visible:** anillo de 2 px en salvia al 40%.

## Componentes base (shadcn/ui sobre los tokens)

- `button`: primario salvia relleno; secundario superficie con borde; fantasma para acciones de tabla.
- `card`: superficie blanca, radio 12, sombra suave, sin borde visible salvo hover sutil.
- `badge`: fondo `primary-soft`/`accent-warm-soft`, texto en tono correspondiente, radio completo.
- `input/select/textarea`: fondo blanco, borde sutil, foco salvia.
- `table`: cabecera en `muted-foreground` 12px uppercase tracking amplio; filas con separador de 1px en borde.
- `dialog`: centrado, radio 12, sin backdrop oscuro agresivo (`rgba(44,42,38,.4)` con blur leve).
- `calendar` (agenda): días en Inter, día actual con punto salvia, citas como píldoras con el estado en color sutil.

## Movimiento

- Transiciones de 150–250 ms con `ease-out`.
- Solo animaciones de aparición sutil (fade + translateY de 4px) en tarjetas y diálogos.
- Nada de parallax, rebotes ni sonidos.

## Layout de aplicación

- **Sidebar** fijo de 240 px, fondo blanco, logo "Dime" en Cormorant Garamond, navegación con iconos lucide (tamaño 18) y etiquetas 14 px.
- **Header**: saludo + fecha actual a la izquierda, acciones contextuales a la derecha.
- Contenido máximo 1200 px centrado, padding 32 px.
- Estados vacíos con ilustración tipográfica sobria (nada de clipart).
