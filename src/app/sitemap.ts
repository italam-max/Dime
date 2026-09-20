import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";
import { BLOG_POSTS } from "@/content/blog";

// Sitemap de la web pública (psicodime.net). En el dominio raíz la landing se
// sirve en "/", así que esa es su URL canónica pública.
export default function sitemap(): MetadataRoute.Sitemap {
  const base = SITE.url;
  const now = new Date();

  const paginas: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, changeFrequency: "monthly", priority: 1 },
    { url: `${base}/blog`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
  ];

  const articulos: MetadataRoute.Sitemap = BLOG_POSTS.map((post) => ({
    url: `${base}/blog/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...paginas, ...articulos];
}
