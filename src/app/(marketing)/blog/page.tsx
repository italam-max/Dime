import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { BotanicalSpray } from "@/components/brand/botanical";
import { SITE } from "@/lib/site";
import { BLOG_POSTS } from "@/content/blog";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: "Blog · DIME · Salud emocional en Nezahualcóyotl",
  description:
    "Artículos sobre ansiedad, emociones, terapia y bienestar, escritos por el equipo de DIME en Nezahualcóyotl.",
  alternates: { canonical: "/blog" },
};

export default function BlogIndexPage() {
  return (
    <div className="relative mx-auto w-full max-w-5xl px-6 py-16">
      <BotanicalSpray className="pointer-events-none absolute -top-6 right-2 w-40 rotate-[200deg] opacity-[0.09]" />

      <header className="relative max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">Blog</p>
        <h1 className="mt-3 font-display text-4xl font-semibold text-foreground sm:text-5xl">
          Recursos para tu bienestar emocional
        </h1>
        <p className="mt-4 text-muted-foreground">
          Ideas y herramientas sobre emociones, ansiedad y salud mental, desde nuestro consultorio en
          Nezahualcóyotl.
        </p>
      </header>

      <div className="mt-12 space-y-4">
        {BLOG_POSTS.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="hover-lift group flex flex-col gap-2 rounded-xl bg-card p-6 ring-1 ring-foreground/10"
          >
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span className="font-medium uppercase tracking-wide text-primary">{post.category}</span>
              <span aria-hidden>·</span>
              <time dateTime={post.date}>{formatDate(post.date, "d 'de' MMM yyyy")}</time>
              <span aria-hidden>·</span>
              <span>{post.readingMinutes} min de lectura</span>
            </div>
            <h2 className="font-display text-2xl font-medium text-foreground transition-colors group-hover:text-primary">
              {post.title}
            </h2>
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">{post.excerpt}</p>
            <span className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-primary">
              Leer artículo
              <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" aria-hidden />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
