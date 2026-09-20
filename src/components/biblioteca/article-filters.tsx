"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  ARTICLE_CATEGORIES,
  ARTICLE_CATEGORY_LABELS,
  ARTICLE_FORMAT_LABELS,
  ARTICLE_FORMATS,
} from "@/lib/validations/article";

// Secciones por formato + buscador por título + filtro por categoría.
// Conserva el resto de parámetros de la URL.
export function ArticleFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get("q") ?? "");
  const [category, setCategory] = useState(searchParams.get("categoria") ?? "todas");
  const format = searchParams.get("formato") ?? "todos";
  const [, startTransition] = useTransition();

  function apply(nextQ: string, nextCategory: string, nextFormat: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (nextQ.trim()) params.set("q", nextQ.trim());
    else params.delete("q");
    if (nextCategory !== "todas") params.set("categoria", nextCategory);
    else params.delete("categoria");
    if (nextFormat !== "todos") params.set("formato", nextFormat);
    else params.delete("formato");
    startTransition(() => router.replace(`${pathname}?${params.toString()}`));
  }

  const secciones = [
    { key: "todos", label: "Todos" },
    ...ARTICLE_FORMATS.map((f) => ({ key: f, label: ARTICLE_FORMAT_LABELS[f] })),
  ];

  return (
    <div className="space-y-3">
      {/* Secciones por formato */}
      <div className="flex flex-wrap gap-1.5">
        {secciones.map((s) => {
          const active = format === s.key;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => apply(value, category, s.key)}
              aria-pressed={active}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "bg-surface-muted text-muted-foreground hover:text-foreground"
              )}
            >
              {s.label}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            apply(value, category, format);
          }}
          className="relative min-w-64 flex-1"
        >
          <Search
            size={16}
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Buscar por título"
            className="pl-9"
            aria-label="Buscar por título"
          />
        </form>

        <label className="sr-only" htmlFor="filtro-categoria">
          Filtrar por categoría
        </label>
        <select
          id="filtro-categoria"
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            apply(value, e.target.value, format);
          }}
          className="h-9 rounded-lg border border-input bg-transparent px-2.5 text-sm"
        >
          <option value="todas">Todas las categorías</option>
          {ARTICLE_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {ARTICLE_CATEGORY_LABELS[c]}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
