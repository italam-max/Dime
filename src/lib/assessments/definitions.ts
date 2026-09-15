// Definiciones de los instrumentos de evaluación estandarizados.
// Son DATOS, no código: la fuente persistente es la tabla AssessmentInstrument
// (sincronizada vía scripts/seed-instruments.ts). Este módulo es el contrato
// compartido entre el seed y cualquier código que necesite la estructura.

export interface AssessmentOption {
  label: string;
  value: number;
}

export interface AssessmentItem {
  text: string;
  options: AssessmentOption[];
}

export interface AssessmentRange {
  min: number;
  max: number;
  label: string;
}

export interface InstrumentDefinition {
  code: string; // PHQ9 | GAD7 | WHO5
  name: string;
  items: AssessmentItem[];
  scoring: { type: "sum"; ranges: AssessmentRange[] };
}

// Opciones de frecuencia típicas de PHQ-9 / GAD-7 (últimos 14 días).
const OPCIONES_0_A_3: AssessmentOption[] = [
  { label: "Ninguna vez", value: 0 },
  { label: "Varios días", value: 1 },
  { label: "Más de la mitad de los días", value: 2 },
  { label: "Casi todos los días", value: 3 },
];

// Opciones del WHO-5 (últimos 14 días).
const OPCIONES_0_A_5: AssessmentOption[] = [
  { label: "En ningún momento", value: 0 },
  { label: "Rara vez", value: 1 },
  { label: "Alguna vez", value: 2 },
  { label: "A menudo", value: 3 },
  { label: "La mayoría de las veces", value: 4 },
  { label: "Todo el tiempo", value: 5 },
];

export const INSTRUMENT_DEFINITIONS: InstrumentDefinition[] = [
  {
    code: "PHQ9",
    name: "Cuestionario de salud del paciente (PHQ-9)",
    items: [
      { text: "Poco interés o placer en hacer cosas", options: OPCIONES_0_A_3 },
      { text: "Me he sentido triste, deprimido/a o sin esperanzas", options: OPCIONES_0_A_3 },
      { text: "Dificultad para quedarme o permanecer dormido/a, o dormir demasiado", options: OPCIONES_0_A_3 },
      { text: "Me he sentido cansado/a o con poca energía", options: OPCIONES_0_A_3 },
      { text: "Poco apetito o he comido en exceso", options: OPCIONES_0_A_3 },
      { text: "Me he sentido mal conmigo mismo/a, o que soy un fracaso o que he quedado mal conmigo mismo/a o con mi familia", options: OPCIONES_0_A_3 },
      { text: "Dificultad para concentrarme en cosas, como leer el periódico o ver televisión", options: OPCIONES_0_A_3 },
      { text: "Me he movido o hablado tan lento que otras personas podrían notarlo, o todo lo contrario: he estado tan inquieto/a o agitado/a que me he movido mucho más de lo acostumbrado", options: OPCIONES_0_A_3 },
      { text: "He tenido pensamientos de que estaría mejor muerto/a o de lastimarme de alguna forma", options: OPCIONES_0_A_3 },
    ],
    scoring: {
      type: "sum",
      ranges: [
        { min: 0, max: 4, label: "Leve" },
        { min: 5, max: 9, label: "Leve-moderado" },
        { min: 10, max: 14, label: "Moderado" },
        { min: 15, max: 19, label: "Moderado-severo" },
        { min: 20, max: 27, label: "Severo" },
      ],
    },
  },
  {
    code: "GAD7",
    name: "Escala de ansiedad generalizada (GAD-7)",
    items: [
      { text: "Me he sentido nervioso/a, ansioso/a o con los nervios de punta", options: OPCIONES_0_A_3 },
      { text: "No he podido dejar de preocuparme", options: OPCIONES_0_A_3 },
      { text: "Me he preocupado demasiado por diferentes cosas", options: OPCIONES_0_A_3 },
      { text: "He tenido dificultad para relajarme", options: OPCIONES_0_A_3 },
      { text: "Me he sentido tan inquieto/a que me ha sido difícil permanecer sentado/a quieto/a", options: OPCIONES_0_A_3 },
      { text: "Me he molestado o irritado fácilmente", options: OPCIONES_0_A_3 },
      { text: "He sentido miedo, como si algo terrible fuera a suceder", options: OPCIONES_0_A_3 },
    ],
    scoring: {
      type: "sum",
      ranges: [
        { min: 0, max: 4, label: "Leve" },
        { min: 5, max: 9, label: "Leve-moderado" },
        { min: 10, max: 14, label: "Moderado" },
        { min: 15, max: 21, label: "Severo" },
      ],
    },
  },
  {
    code: "WHO5",
    name: "Índice de bienestar de la OMS (WHO-5)",
    items: [
      { text: "Me he sentido alegre y de buen humor", options: OPCIONES_0_A_5 },
      { text: "Me he sentido tranquilo/a y relajado/a", options: OPCIONES_0_A_5 },
      { text: "Me he sentido activo/a y con energía", options: OPCIONES_0_A_5 },
      { text: "Me he despertado sintiéndome fresco/a y descansado/a", options: OPCIONES_0_A_5 },
      { text: "Mi vida diaria ha estado llena de cosas que me interesan", options: OPCIONES_0_A_5 },
    ],
    scoring: {
      type: "sum",
      ranges: [
        { min: 0, max: 12, label: "Bajo bienestar" },
        { min: 13, max: 25, label: "Bienestar aceptable" },
      ],
    },
  },
];

export const ASSESSMENT_FREQUENCIES = ["UNICA", "SEMANAL", "QUINCENAL"] as const;
export type AssessmentFrequency = (typeof ASSESSMENT_FREQUENCIES)[number];

export const FREQUENCY_LABELS: Record<AssessmentFrequency, string> = {
  UNICA: "Única",
  SEMANAL: "Semanal",
  QUINCENAL: "Quincenal",
};

// Días que se suman a nextDueAt según la frecuencia (null = no se regenera).
export const FREQUENCY_DAYS: Record<AssessmentFrequency, number | null> = {
  UNICA: null,
  SEMANAL: 7,
  QUINCENAL: 14,
};

// Rango (semáforo) al que pertenece un puntaje, según el scoring del instrumento.
export function rangeForScore(
  ranges: AssessmentRange[],
  score: number
): AssessmentRange | null {
  return ranges.find((range) => score >= range.min && score <= range.max) ?? null;
}
