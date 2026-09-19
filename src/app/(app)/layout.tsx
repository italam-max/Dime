import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { getCurrentUser } from "@/lib/auth";
import { versionLabel } from "@/lib/version";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await getCurrentUser();
  // Sesión inválida (usuario inexistente o deshabilitado): limpia la cookie en
  // /logout para no rebotar contra el proxy y caer en un bucle de redirecciones.
  if (!user) redirect("/logout");

  return (
    <div className="min-h-screen">
      <AppSidebar version={versionLabel} isSuperAdmin={user.role === "SUPERADMIN"} />

      <div className="pl-60">
        <main className="mx-auto max-w-6xl p-8">{children}</main>
      </div>
    </div>
  );
}
