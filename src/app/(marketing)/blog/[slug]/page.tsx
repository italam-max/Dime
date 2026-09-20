import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SITE, whatsappLink } from "@/lib/site";
import { BLOG_POSTS, getPost } from "@/content/blog";
import { formatDate } from "@/lib/utils";

export function generateStaticParams() {
  return BLOG_POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return { title: "Artículo · DIME" };
  return {
    metadataBase: new URL(SITE.url),
    title: `${post.title} · DIME`,
    description: post.excerpt,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: "article",
      locale: "es_MX",
      title: post.title,
      description: post.excerpt,
      publishedTime: post.date,
    },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.date,
    author: { "@type": "Organization", name: SITE.name },
    publisher: { "@type": "Organization", name: SITE.name, url: SITE.url },
    mainEntityOfPage: `${SITE.url}/blog/${post.slug}`,
  };

  return (
    <article className="mx-auto w-full max-w-2xl px-6 py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Link
        href="/blog"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Volver al blog
      </Link>

      <header className="mt-6">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="font-medium uppercase tracking-wide text-primary">{post.category}</span>
          <span aria-hidden>·</span>
          <time dateTime={post.date}>{formatDate(post.date, "d 'de' MMMM yyyy")}</time>
          <span aria-hidden>·</span>
          <span>{post.readingMinutes} min de lectura</span>
        </div>
        <h1 className="mt-3 font-display text-4xl font-semibold leading-tight text-foreground">
          {post.title}
        </h1>
      </header>

      <div className="mt-8 space-y-5">
        {post.body.map((p, i) => (
          <p key={i} className="text-[1.05rem] leading-relaxed text-foreground/90">
            {p}
          </p>
        ))}
      </div>

      <div
        className="mt-12 rounded-card bg-card px-6 py-8 text-center ring-1 ring-foreground/10"
        style={{
          backgroundImage:
            "radial-gradient(80% 120% at 100% 0%, color-mix(in srgb, var(--color-primary) 12%, transparent), transparent 60%)",
        }}
      >
        <h2 className="font-display text-2xl font-semibold text-foreground">
          ¿Quieres dar el primer paso?
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          En DIME acompañamos tu proceso emocional en Nezahualcóyotl, a tu ritmo.
        </p>
        <div className="mt-5">
          <Button asChild size="lg">
            <a href={whatsappLink()} target="_blank" rel="noopener noreferrer">
              Agendar una cita
            </a>
          </Button>
        </div>
      </div>
    </article>
  );
}
