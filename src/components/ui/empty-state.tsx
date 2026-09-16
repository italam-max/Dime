import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  /** Ícono lucide, mostrado en un círculo salvia suave. */
  icon?: LucideIcon;
  title: string;
  description?: string;
  /** Acción principal (ej. un Button con Link). */
  action?: React.ReactNode;
  className?: string;
}

/**
 * Estado vacío homologado del design system "Calma": tarjeta centrada,
 * ilustración tipográfica sobria, microcopy tranquilo. Aparición suave.
 */
export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <Card className={cn("animate-scale-in items-center gap-3 py-16 text-center", className)}>
      {Icon && (
        <span className="mb-1 flex size-12 items-center justify-center rounded-full bg-primary-soft text-primary">
          <Icon size={22} strokeWidth={1.6} aria-hidden />
        </span>
      )}
      <p className="font-display text-2xl text-foreground">{title}</p>
      {description && <p className="max-w-md text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </Card>
  );
}
