"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ARTICLE_CATEGORIES, ARTICLE_CATEGORY_LABELS } from "@/lib/validations/article";

// Buscador por título + filtro por categoría; conserva el resto de parámetros.
export function ArticleFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get("q") ?? "");
  const [category, setCategory] = useState(searchParams.get("categoria") ?? "todas");
  const [, startTransition] = useTransition();

  function apply(nextQ: string, nextCategory: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (nextQ.trim()) {
      params.set("q", nextQ.trim());
    } else {
      params.delete("q");
    }
    if (nextCategory !== "todas") {
      params.set("categoria", nextCategory);
    } else {
      params.delete("categoria");
    }
    startTransition(() => router.replace(`${pathname}?${params.toString()}`));
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          apply(value, category);
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
          apply(value, e.target.value);
        }}
        className="h-9 rounded-lg border border-input bg-transparent px-2.5 text-sm"
      >
        <option value="todas">Todas las categorías</option>
        {ARTICLE_CATEGORIES.map((category) => (
          <option key={category} value={category}>
            {ARTICLE_CATEGORY_LABELS[category]}
          </option>
        ))}
      </select>
    </div>
  );
}
