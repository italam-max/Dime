import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { getCurrentUser } from "@/lib/auth";
import { versionLabel } from "@/lib/version";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen">
      <AppSidebar version={versionLabel} />

      <div className="pl-60">
        <main className="mx-auto max-w-6xl p-8">{children}</main>
      </div>
    </div>
  );
}
