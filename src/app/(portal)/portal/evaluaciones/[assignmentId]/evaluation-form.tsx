"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AssessmentItem } from "@/lib/assessments/definitions";
import { submitAssessmentResponse } from "@/app/(portal)/portal/evaluaciones-actions";

// Lista compacta de ítems: cada pregunta con sus opciones como botones
// seleccionables (radio-group construido a mano, área de toque generosa para
// móvil). Todas las preguntas son obligatorias: "Enviar" solo se habilita
// cuando el cuestionario está completo. Al enviar, pantalla de agradecimiento
// sin puntaje — el paciente nunca ve su resultado.
export function EvaluationForm({
  assignmentId,
  items,
}: {
  assignmentId: string;
  items: AssessmentItem[];
}) {
  const [answers, setAnswers] = useState<(number | null)[]>(() =>
    items.map(() => null)
  );
  const [sent, setSent] = useState(false);
  const [pending, startTransition] = useTransition();

  const respondidas = answers.filter((respuesta) => respuesta !== null).length;
  const completo = respondidas === items.length;
  const progreso = Math.round((respondidas / items.length) * 100);

  function seleccionar(index: number, value: number) {
    setAnswers((previas) =>
      previas.map((actual, i) => (i === index ? value : actual))
    );
  }

  function handleSubmit() {
    if (!completo) return;
    startTransition(async () => {
      const result = await submitAssessmentResponse(
        assignmentId,
        answers.map((respuesta) => respuesta!)
      );
      if (result.ok) {
        setSent(true);
      } else {
        toast.error(
          result.message ?? "No pudimos registrar tu respuesta. Inténtalo de nuevo."
        );
      }
    });
  }

  if (sent) {
    return (
      <div className="mt-8 rounded-card bg-surface p-8 text-center shadow-soft">
        <CheckCircle2
          size={28}
          strokeWidth={1.6}
          className="mx-auto text-primary"
          aria-hidden
        />
        <h2 className="mt-4 font-display text-2xl font-semibold text-foreground">
          Gracias.
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Tu respuesta quedó registrada y la revisará tu terapeuta.
        </p>
        <Button asChild className="mt-6 min-h-11 sm:min-h-9">
          <Link href="/portal">Volver a mi espacio</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-6">
      {/* Progreso: contador sencillo + barra mínima. */}
      <div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Pregunta {Math.min(respondidas + 1, items.length)} de {items.length}
          </span>
          <span>
            {respondidas}/{items.length}
          </span>
        </div>
        <div
          className="mt-2 h-1 rounded-full bg-surface-muted"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progreso}
        >
          <div
            className="h-1 rounded-full bg-primary transition-all duration-200"
            style={{ width: `${progreso}%` }}
          />
        </div>
      </div>

      <ol className="space-y-4">
        {items.map((item, index) => (
          <li key={index} className="rounded-card bg-surface p-5 shadow-soft">
            <p className="text-sm font-medium text-foreground">
              {index + 1}. {item.text}
            </p>
            <div
              className="mt-3 space-y-2"
              role="radiogroup"
              aria-label={`Pregunta ${index + 1}`}
            >
              {item.options.map((option) => {
                const seleccionada = answers[index] === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="radio"
                    aria-checked={seleccionada}
                    onClick={() => seleccionar(index, option.value)}
                    className={cn(
                      "flex min-h-11 w-full items-center rounded-control border px-3 py-2.5 text-left text-sm transition-colors duration-150",
                      seleccionada
                        ? "border-primary bg-primary-soft font-medium text-primary"
                        : "border-border bg-background text-foreground hover:bg-surface-muted"
                    )}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </li>
        ))}
      </ol>

      <div className="space-y-2">
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={!completo || pending}
          className="min-h-11 w-full sm:min-h-9"
        >
          {pending ? "Enviando…" : "Enviar"}
        </Button>
        {!completo && (
          <p className="text-center text-xs text-muted-foreground">
            Responde todas las preguntas para enviar.
          </p>
        )}
      </div>
    </div>
  );
}
