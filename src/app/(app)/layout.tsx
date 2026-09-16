import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { getCurrentUser } from "@/lib/auth";
import { formatDate } from "@/lib/utils";

function greetingFor(date: Date): string {
  const hour = date.getHours();
  if (hour < 12) return "Buenos días";
  if (hour < 19) return "Buenas tardes";
  return "Buenas noches";
}

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const now = new Date();

  return (
    <div className="min-h-screen">
      <AppSidebar />

      <div className="pl-60">
        <header className="flex items-end justify-between border-b border-border px-8 py-6">
          <div>
            <p className="font-display text-2xl font-medium text-foreground">
              {greetingFor(now)}, {user.name.split(" ")[0]}
            </p>
            <p className="mt-1 text-sm capitalize text-muted-foreground">
              {formatDate(now, "EEEE, d 'de' MMMM 'de' yyyy")}
            </p>
          </div>
        </header>

        <main className="mx-auto max-w-6xl animate-fade-in p-8">{children}</main>
      </div>
    </div>
  );
}
