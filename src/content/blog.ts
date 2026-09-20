// Contenido del blog (fuente de tráfico especializado / SEO). Cada entrada es
// texto plano por párrafos; para publicar una nueva, agrega un objeto aquí.
export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  date: string; // ISO
  category: string;
  readingMinutes: number;
  accent: "sage" | "mint" | "honey" | "iris" | "petal" | "warm";
  body: string[];
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "como-saber-si-necesito-terapia",
    title: "¿Cómo saber si necesito ir a terapia?",
    excerpt:
      "No hace falta estar en crisis para pedir apoyo. Estas son algunas señales de que la psicoterapia puede ayudarte.",
    date: "2026-09-10",
    category: "Bienestar emocional",
    readingMinutes: 5,
    accent: "sage",
    body: [
      "Mucha gente cree que la terapia es solo para momentos de crisis. En realidad, pedir apoyo psicológico es una forma de cuidarte, igual que vas al médico antes de que un malestar se vuelva grave.",
      "Hay señales que vale la pena escuchar: emociones que se sienten demasiado intensas o difíciles de manejar, pensamientos que se repiten y no te dejan descansar, cambios en el sueño o el apetito, o la sensación de que algo te pesa aunque por fuera todo parezca estar bien.",
      "También es válido buscar terapia sin un motivo puntual: para conocerte mejor, tomar una decisión importante, cerrar un duelo o simplemente tener un espacio propio para pensar en voz alta.",
      "En DIME acompañamos ese proceso a tu ritmo. La primera sesión es un espacio para contarnos qué te trae, sin compromiso de continuar si no lo sientes tuyo. Lo importante es que des el primer paso.",
    ],
  },
  {
    slug: "manejar-la-ansiedad-primeros-pasos",
    title: "Manejar la ansiedad: primeros pasos que puedes dar hoy",
    excerpt:
      "La ansiedad tiene funciones, pero cuando se desborda agota. Algunas prácticas sencillas para volver a tu centro.",
    date: "2026-09-15",
    category: "Ansiedad",
    readingMinutes: 6,
    accent: "mint",
    body: [
      "La ansiedad no es tu enemiga: es una respuesta de tu cuerpo para protegerte. El problema aparece cuando se enciende sin una amenaza real y se queda encendida, dejándote con el pecho apretado, la mente acelerada y el cuerpo cansado.",
      "Un primer paso es la respiración. Inhala contando hasta cuatro, sostén siete y exhala en ocho. Repetirlo unas cuantas veces le avisa a tu sistema nervioso que puede bajar la guardia.",
      "El segundo es nombrar lo que sientes. Escribir “ahora siento ansiedad porque…” separa la emoción de los hechos y le quita fuerza al pensamiento catastrófico.",
      "El tercero es el movimiento: una caminata corta, estirarte o salir a tomar aire ayudan a descargar la activación acumulada.",
      "Estas prácticas alivian el momento, pero si la ansiedad aparece seguido y te limita, un proceso terapéutico te da herramientas de fondo. En DIME trabajamos contigo para entender de dónde viene y qué la sostiene.",
    ],
  },
  {
    slug: "terapia-psicologica-en-nezahualcoyotl",
    title: "Terapia psicológica en Nezahualcóyotl: qué esperar de tu primera sesión",
    excerpt:
      "Si buscas apoyo psicológico cerca de casa, esto es lo que encontrarás al llegar a DIME.",
    date: "2026-09-18",
    category: "Primeros pasos",
    readingMinutes: 4,
    accent: "iris",
    body: [
      "Buscar terapia cerca de casa hace más fácil sostener el proceso. En Nezahualcóyotl, DIME es un espacio de apoyo psicoterapéutico pensado para acompañarte con cercanía y sin juicios.",
      "Tu primera sesión es sobre todo un encuentro. Nos cuentas qué te trae, cómo te has sentido y qué te gustaría cambiar. No tienes que llegar con todo claro: para eso estamos.",
      "A partir de ahí, definimos juntos un plan de acompañamiento a tu medida, con la frecuencia que te haga sentido. Somos un equipo multidisciplinario, así que si tu proceso lo requiere, coordinamos el apoyo adecuado.",
      "Entre sesiones puedes apoyarte en la app de Dime para ver tus citas, tus tareas y los recursos que te compartimos. La tecnología acompaña, pero el centro siempre es la relación contigo.",
      "Si estás en Nezahualcóyotl o cerca y quieres empezar, agenda tu primera cita. Dar el paso ya es parte del proceso.",
    ],
  },
];

export function getPost(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug);
}
