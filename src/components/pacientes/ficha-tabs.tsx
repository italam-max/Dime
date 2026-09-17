"use client";

import { Children, isValidElement, useState, type ReactNode } from "react";
import { Activity, History, LayoutDashboard, ListTodo, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// Los componentes de ícono no cruzan el límite servidor→cliente, así que se
// resuelven aquí por clave string.
const TAB_ICONS: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  activity: Activity,
  list: ListTodo,
  history: History,
};

export type FichaTab = { id: string; label: string; icon?: keyof typeof TAB_ICONS };

/**
 * Pestañas segmentadas de la ficha. Recibe los paneles como hijos, cada uno
 * marcado con `data-tab="<id>"`; solo se monta el panel activo (con
 * animación de entrada). El contenido de cada panel se renderiza en servidor.
 */
export function FichaTabs({ tabs, children }: { tabs: FichaTab[]; children: ReactNode }) {
  const [active, setActive] = useState(tabs[0]?.id);

  const panels = Children.toArray(children);
  const activePanel = panels.find(
    (child) => isValidElement(child) && (child.props as { "data-tab"?: string })["data-tab"] === active
  );

  return (
    <div>
      <div
        role="tablist"
        aria-label="Secciones de la ficha"
        className="flex gap-1 overflow-x-auto rounded-xl bg-surface-muted p-1"
      >
        {tabs.map(({ id, label, icon }) => {
          const selected = id === active;
          const Icon = icon ? TAB_ICONS[icon] : null;
          return (
            <button
              key={id}
              role="tab"
              type="button"
              aria-selected={selected}
              onClick={() => setActive(id)}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150 ease-out",
                selected
                  ? "bg-surface text-primary shadow-soft"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {Icon && <Icon size={16} strokeWidth={1.8} aria-hidden />}
              {label}
            </button>
          );
        })}
      </div>

      <div key={active} className="mt-6 animate-fade-in space-y-6">
        {activePanel}
      </div>
    </div>
  );
}
