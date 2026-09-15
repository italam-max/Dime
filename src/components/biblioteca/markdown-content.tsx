import type { JSX } from "react";
import Markdown, { type ExtraProps } from "react-markdown";

// Props que recibe cada elemento sustituido: los del tag HTML + ExtraProps.
type MdProps<Tag extends keyof JSX.IntrinsicElements> = JSX.IntrinsicElements[Tag] & ExtraProps;

// Estilos serenos tipo "prose" a mano (sin plugin de typography): el mismo
// renderizado se usa en la vista previa del terapeuta y en la lectura del portal.
const components = {
  h1: ({ node: _node, ...props }: MdProps<"h1">) => (
    <h1 className="font-display text-2xl font-semibold text-foreground" {...props} />
  ),
  h2: ({ node: _node, ...props }: MdProps<"h2">) => (
    <h2 className="pt-2 font-display text-xl font-semibold text-foreground" {...props} />
  ),
  h3: ({ node: _node, ...props }: MdProps<"h3">) => (
    <h3 className="pt-1 text-base font-semibold text-foreground" {...props} />
  ),
  p: ({ node: _node, ...props }: MdProps<"p">) => (
    <p className="text-sm leading-relaxed text-foreground" {...props} />
  ),
  ul: ({ node: _node, ...props }: MdProps<"ul">) => (
    <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-foreground" {...props} />
  ),
  ol: ({ node: _node, ...props }: MdProps<"ol">) => (
    <ol className="list-decimal space-y-1.5 pl-5 text-sm leading-relaxed text-foreground" {...props} />
  ),
  strong: ({ node: _node, ...props }: MdProps<"strong">) => (
    <strong className="font-semibold text-foreground" {...props} />
  ),
  a: ({ node: _node, ...props }: MdProps<"a">) => (
    <a className="text-primary underline underline-offset-4" {...props} />
  ),
  blockquote: ({ node: _node, ...props }: MdProps<"blockquote">) => (
    <blockquote
      className="border-l-2 border-primary/40 pl-4 text-sm italic text-muted-foreground"
      {...props}
    />
  ),
};

// Cuerpo de artículo en markdown, con estilos Calma. Sirve en servidor y cliente.
export function MarkdownContent({ markdown }: { markdown: string }) {
  return (
    <div className="space-y-3">
      <Markdown components={components}>{markdown}</Markdown>
    </div>
  );
}
