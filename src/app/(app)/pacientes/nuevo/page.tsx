import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createPatient } from "@/app/(app)/pacientes/actions";
import { PatientForm } from "@/components/pacientes/patient-form";

export const metadata: Metadata = {
  title: "Nuevo paciente · Dime",
};

export default function NuevoPacientePage() {
  return (
    <div className="animate-fade-in mx-auto max-w-3xl space-y-6">
      <div>
        <ButtonBack />
        <h1 className="font-display text-4xl font-semibold text-foreground">
          Nuevo paciente
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Los campos marcados con asterisco son obligatorios. El contacto de
          emergencia es recomendado, pero no obligatorio.
        </p>
      </div>

      <PatientForm
        action={createPatient}
        submitLabel="Registrar paciente"
        successMessage="Paciente registrado"
        cancelHref="/pacientes"
      />
    </div>
  );
}

function ButtonBack() {
  return (
    <Link
      href="/pacientes"
      className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
      <ArrowLeft className="size-4" />
      Volver a pacientes
    </Link>
  );
}
