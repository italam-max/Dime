import { ExternalLink } from "lucide-react";

// Render de un recurso de la biblioteca a partir de campos guiados (sin markdown):
// resumen, medio incrustado (según formato), cuerpo en párrafos y puntos clave.

interface ResourceContentProps {
  format: string;
  summary?: string | null;
  body?: string | null;
  keyPoints?: string | null;
  url?: string | null;
}

// ID de YouTube desde varias formas de URL.
function youtubeId(url: string): string | null {
  const m = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/i
  );
  return m ? m[1] : null;
}
function vimeoId(url: string): string | null {
  const m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
  return m ? m[1] : null;
}
function esImagen(url: string): boolean {
  return /\.(png|jpe?g|gif|webp|avif|svg)(\?.*)?$/i.test(url);
}

function LinkButton({ url, label }: { url: string; label: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 rounded-control bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
    >
      <ExternalLink size={16} strokeWidth={2} aria-hidden />
      {label}
    </a>
  );
}

function MediaEmbed({ format, url }: { format: string; url: string }) {
  if (format === "VIDEO") {
    const yt = youtubeId(url);
    const vm = vimeoId(url);
    const src = yt
      ? `https://www.youtube.com/embed/${yt}`
      : vm
        ? `https://player.vimeo.com/video/${vm}`
        : null;
    if (src) {
      return (
        <div className="aspect-video w-full overflow-hidden rounded-card border border-border bg-black">
          <iframe
            src={src}
            title="Video"
            className="size-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      );
    }
    return <LinkButton url={url} label="Ver el video" />;
  }

  if (format === "AUDIO") {
    return (
      <div className="space-y-2">
        <audio controls className="w-full" src={url}>
          Tu navegador no puede reproducir este audio.
        </audio>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <ExternalLink size={13} aria-hidden />
          Abrir en otra pestaña
        </a>
      </div>
    );
  }

  if (format === "INFOGRAFIA") {
    if (esImagen(url)) {
      return (
        <a href={url} target="_blank" rel="noopener noreferrer" className="block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt="Infografía"
            className="w-full rounded-card border border-border"
          />
        </a>
      );
    }
    return <LinkButton url={url} label="Abrir la infografía" />;
  }

  return <LinkButton url={url} label="Abrir el recurso" />;
}

export function ResourceContent({ format, summary, body, keyPoints, url }: ResourceContentProps) {
  const paragraphs = (body ?? "")
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  const points = (keyPoints ?? "")
    .split(/\n/)
    .map((p) => p.replace(/^[-*•]\s*/, "").trim())
    .filter(Boolean);

  const hasContent = summary || url || paragraphs.length > 0 || points.length > 0;

  return (
    <div className="space-y-5">
      {summary && <p className="text-base leading-relaxed text-foreground">{summary}</p>}

      {url && <MediaEmbed format={format} url={url} />}

      {paragraphs.length > 0 && (
        <div className="space-y-3">
          {paragraphs.map((p, i) => (
            <p key={i} className="text-sm leading-relaxed text-muted-foreground">
              {p}
            </p>
          ))}
        </div>
      )}

      {points.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Puntos clave
          </p>
          <ul className="space-y-2">
            {points.map((pt, i) => (
              <li key={i} className="flex gap-2.5 text-sm text-foreground">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
                <span className="leading-relaxed">{pt}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!hasContent && (
        <p className="text-sm italic text-muted-foreground">Este recurso aún no tiene contenido.</p>
      )}
    </div>
  );
}
