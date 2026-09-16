"use client";

import { useEffect } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { toast } from "sonner";
import { z } from "zod";
import { patientSchema, type PatientInput } from "@/lib/validations/patient";
import type { PatientFormState } from "@/app/(app)/pacientes/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

// Valores iniciales para edición (fechas ya como yyyy-MM-dd para el input date).
export interface PatientInitialValues {
  id: string;
  nombre: string;
  apellidos: string;
  fechaNacimiento: string | null;
  sexo: string | null;
  telefono: string;
  email: string | null;
  direccion: string | null;
  contactoEmergencia: string | null;
  antecedentes: string | null;
  notasInternas: string | null;
  isActive: boolean;
}

interface PatientFormProps {
  action: (prev: PatientFormState, formData: FormData) => Promise<PatientFormState>;
  patient?: PatientInitialValues;
  submitLabel: string;
  successMessage: string;
  cancelHref: string;
}

type PatientFormInput = z.input<typeof patientSchema>;

// Formulario de alta/edición de paciente. La validación del cliente la hace
// react-hook-form con el mismo esquema Zod; el Server Action vuelve a validar
// el FormData antes de tocar la base de datos.
export function PatientForm({
  action,
  patient,
  submitLabel,
  successMessage,
  cancelHref,
}: PatientFormProps) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(action, {} as PatientFormState);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<PatientFormInput, unknown, PatientInput>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      nombre: patient?.nombre ?? "",
      apellidos: patient?.apellidos ?? "",
      fechaNacimiento: patient?.fechaNacimiento ?? "",
      sexo: patient?.sexo ?? "",
      telefono: patient?.telefono ?? "",
      email: patient?.email ?? "",
      direccion: patient?.direccion ?? "",
      contactoEmergencia: patient?.contactoEmergencia ?? "",
      antecedentes: patient?.antecedentes ?? "",
      notasInternas: patient?.notasInternas ?? "",
      isActive: patient?.isActive ?? true,
    },
  });

  // Al crear/editar con éxito: toast sereno y navegación a la ficha.
  useEffect(() => {
    if (state.success && state.patientId) {
      toast.success(state.message ?? successMessage);
      router.push(`/pacientes/${state.patientId}`);
    }
  }, [state, successMessage, router]);

  // Envía el formulario al Server Action solo si la validación del cliente pasó.
  const onSubmit = handleSubmit(async (data) => {
    const formData = new FormData();
    for (const [key, value] of Object.entries(data)) {
      if (value === null || value === undefined) continue;
      formData.set(
        key,
        value instanceof Date ? format(value, "yyyy-MM-dd") : String(value)
      );
    }
    formData.set("isActive", data.isActive ? "on" : "");
    if (patient) formData.set("id", patient.id);
    await formAction(formData);
  });

  // Une el error del cliente (RHF) con el del servidor (Zod en la action).
  function fieldError(name: keyof PatientFormInput): string | undefined {
    const clientError = errors[name];
    return (
      (clientError && typeof clientError.message === "string" ? clientError.message : undefined) ??
      state.errors?.[name]?.[0]
    );
  }

  const errorClass = (name: keyof PatientFormInput) =>
    cn("text-xs text-danger", fieldError(name) ? "" : "hidden");

  return (
    <form onSubmit={onSubmit} className="stagger-children space-y-6" noValidate>
      {state.message && !state.success && (
        <p className="text-sm text-danger" role="alert">
          {state.message}
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Datos personales</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre</Label>
            <Input
              id="nombre"
              placeholder="Mariana"
              aria-invalid={!!fieldError("nombre")}
              {...register("nombre")}
            />
            <p className={errorClass("nombre")} role="alert">
              {fieldError("nombre")}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="apellidos">Apellidos</Label>
            <Input
              id="apellidos"
              placeholder="Solís Vega"
              aria-invalid={!!fieldError("apellidos")}
              {...register("apellidos")}
            />
            <p className={errorClass("apellidos")} role="alert">
              {fieldError("apellidos")}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fechaNacimiento">Fecha de nacimiento</Label>
            <Input
              id="fechaNacimiento"
              type="date"
              // La fecha vacía se normaliza a null para el esquema (nullable).
              {...register("fechaNacimiento", {
                setValueAs: (value) => (value === "" || value == null ? null : value),
              })}
            />
            <p className={errorClass("fechaNacimiento")} role="alert">
              {fieldError("fechaNacimiento")}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sexo">Sexo</Label>
            <Controller
              control={control}
              name="sexo"
              render={({ field }) => (
                <Select
                  value={typeof field.value === "string" ? field.value : ""}
                  onValueChange={(value) => field.onChange(value === "none" ? null : value)}
                >
                  <SelectTrigger id="sexo" className="w-full">
                    <SelectValue placeholder="Sin especificar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin especificar</SelectItem>
                    <SelectItem value="Femenino">Femenino</SelectItem>
                    <SelectItem value="Masculino">Masculino</SelectItem>
                    <SelectItem value="Otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contacto</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="telefono">Teléfono</Label>
            <Input
              id="telefono"
              type="tel"
              placeholder="55 1234 5678"
              aria-invalid={!!fieldError("telefono")}
              {...register("telefono")}
            />
            <p className={errorClass("telefono")} role="alert">
              {fieldError("telefono")}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Correo electrónico</Label>
            <Input
              id="email"
              type="email"
              placeholder="paciente@correo.com"
              aria-invalid={!!fieldError("email")}
              {...register("email")}
            />
            <p className={errorClass("email")} role="alert">
              {fieldError("email")}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="direccion">Dirección</Label>
            <Input
              id="direccion"
              placeholder="Colonia, ciudad"
              {...register("direccion")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactoEmergencia">Contacto de emergencia</Label>
            <Input
              id="contactoEmergencia"
              placeholder="Nombre y teléfono de un familiar"
              {...register("contactoEmergencia")}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Información clínica</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="antecedentes">Motivo de consulta y antecedentes</Label>
            <Textarea
              id="antecedentes"
              placeholder="Motivo principal de consulta, antecedentes relevantes…"
              className="min-h-24"
              {...register("antecedentes")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notasInternas">Notas internas</Label>
            <Textarea
              id="notasInternas"
              placeholder="Observaciones solo para ti: preferencias, acuerdos, cuidados…"
              className="min-h-24"
              {...register("notasInternas")}
            />
          </div>

          {patient && (
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                className="size-4 accent-primary"
                {...register("isActive")}
              />
              Paciente activo (aparece en el listado y se puede agendar)
            </label>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-3">
        <Button type="button" variant="ghost" onClick={() => router.push(cancelHref)}>
          Cancelar
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Guardando…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
