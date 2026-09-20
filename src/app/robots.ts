import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

// Robots de la web pública: permite indexar el sitio de marketing y el blog, y
// bloquea las áreas privadas de la plataforma (paciente y terapeuta).
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/inicio", "/blog"],
      disallow: [
        "/pacientes",
        "/agenda",
        "/pagos",
        "/biblioteca",
        "/usuarios",
        "/portal",
        "/login",
        "/logout",
      ],
    },
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url,
  };
}
