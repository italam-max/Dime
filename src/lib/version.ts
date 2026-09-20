// Versión visible de la app (esquema propio de 4 partes) y datos del build.
// APP_VERSION es la fuente de verdad para mostrar; súbela en cada release.
// BUILD_SHA / BUILD_TIME se inyectan al construir la imagen Docker (opcional)
// para ver en el sidebar exactamente qué commit está desplegado en prod.
export const APP_VERSION = "1.0.1.0";

export const BUILD_SHA = (process.env.APP_BUILD_SHA ?? "").slice(0, 7);

export const BUILD_TIME = process.env.APP_BUILD_TIME ?? "";

// Etiqueta corta para el sidebar, p. ej. "v1.0.0.1 · a1b2c3d".
export const versionLabel = ["v" + APP_VERSION, BUILD_SHA].filter(Boolean).join(" · ");
