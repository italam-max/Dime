"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, CalendarDays, LayoutDashboard, LogOut, UserCog, Users, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/brand/logo";
import { logout } from "@/app/(auth)/actions";

const NAV_ITEMS = [
  { href: "/", label: "Panel", icon: LayoutDashboard },
  { href: "/pacientes", label: "Pacientes", icon: Users },
  { href: "/biblioteca", label: "Biblioteca", icon: BookOpen },
  { href: "/agenda", label: "Agenda", icon: CalendarDays },
  { href: "/pagos", label: "Pagos", icon: Wallet },
];

function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function AppSidebar({
  version,
  isSuperAdmin = false,
}: {
  version?: string;
  isSuperAdmin?: boolean;
}) {
  const pathname = usePathname();
  const navItems = isSuperAdmin
    ? [...NAV_ITEMS, { href: "/usuarios", label: "Usuarios", icon: UserCog }]
    : NAV_ITEMS;

  return (
    <aside className="fixed inset-y-0 left-0 flex w-60 flex-col border-r border-border bg-surface">
      <div className="px-6 py-6">
        <Link href="/" aria-label="Dime · Inicio" className="inline-flex">
          <Logo size={34} animated wordmarkClassName="text-3xl" />
        </Link>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-control px-3 py-2 text-sm font-medium transition-colors duration-150 ease-out",
                active
                  ? "bg-primary-soft text-primary"
                  : "text-muted-foreground hover:bg-surface-muted hover:text-foreground"
              )}
            >
              <Icon size={18} strokeWidth={1.8} aria-hidden />
              {label}
            </Link>
          );
        })}
      </nav>

      <footer className="border-t border-border p-3">
        <form action={logout}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-control px-3 py-2 text-sm font-medium text-muted-foreground transition-colors duration-150 ease-out hover:bg-surface-muted hover:text-foreground"
          >
            <LogOut size={18} strokeWidth={1.8} aria-hidden />
            Cerrar sesión
          </button>
        </form>
        {version && (
          <p
            className="px-3 pt-2 text-[0.7rem] tabular-nums text-muted-foreground/60"
            title="Versión desplegada"
          >
            {version}
          </p>
        )}
      </footer>
    </aside>
  );
}
