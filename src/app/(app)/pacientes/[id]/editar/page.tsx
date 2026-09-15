import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { ArrowLeft } from "lucide-react";
import { updatePatient } from "@/app/(app)/pacientes/actions";
import { PatientForm } from "@/components/pacientes/patient-form";
import { patientFullName } from "@/lib/utils";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Editar paciente · Dime",
};

export default async function EditarPacientePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const patient = await prisma.patient.findUnique({ where: { id } });
  if (!patient) notFound();

  return (
    <div className="animate-fade-in mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href={`/pacientes/${patient.id}`}
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Volver a la ficha
        </Link>
        <h1 className="font-display text-4xl font-semibold text-foreground">
          Editar paciente
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {patientFullName(patient)}
        </p>
      </div>

      <PatientForm
        action={updatePatient}
        patient={{
          id: patient.id,
          nombre: patient.nombre,
          apellidos: patient.apellidos,
          fechaNacimiento: patient.fechaNacimiento
            ? format(patient.fechaNacimiento, "yyyy-MM-dd")
            : null,
          sexo: patient.sexo,
          telefono: patient.telefono,
          email: patient.email,
          direccion: patient.direccion,
          contactoEmergencia: patient.contactoEmergencia,
          antecedentes: patient.antecedentes,
          notasInternas: patient.notasInternas,
          isActive: patient.isActive,
        }}
        submitLabel="Guardar cambios"
        successMessage="Cambios guardados"
        cancelHref={`/pacientes/${patient.id}`}
      />
    </div>
  );
}
