import type { Metadata } from "next";
import { Logo } from "@/components/brand/logo";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Entrar · Dime",
};

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm animate-fade-in">
        <header className="mb-8 flex flex-col items-center text-center">
          <h1>
            <Logo size={58} animated wordmarkClassName="text-6xl" />
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Tu consultorio, en calma.
          </p>
        </header>

        <div className="rounded-card bg-surface p-8 shadow-soft">
          <LoginForm />
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Un lugar sereno para tu práctica clínica.
        </p>
      </div>
    </main>
  );
}
