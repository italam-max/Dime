import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Entrar · Dime",
};

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm animate-fade-in">
        <header className="mb-8 text-center">
          <h1 className="font-display text-5xl font-semibold text-foreground">
            Dime
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
