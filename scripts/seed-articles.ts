import { PrismaClient } from "@prisma/client";

// Siembra artículos de ejemplo para la biblioteca psicoeducativa. Idempotente:
// solo inserta cuando la tabla Article está vacía, para no pisar contenido del
// terapeuta. Uso: npx tsx scripts/seed-articles.ts
const prisma = new PrismaClient();

const ARTICLES = [
  {
    title: "Respiración diafragmática: tu ancla en momentos de ansiedad",
    category: "ANSIEDAD",
    body: `Cuando la ansiedad aparece, el cuerpo entra en alerta: la respiración se vuelve rápida y superficial, el corazón se acelera y la mente se adelanta a escenarios que aún no suceden. La respiración diafragmática es una herramienta sencilla para comunicarle a tu cuerpo que estás a salvo.

## ¿En qué consiste?

Se trata de respirar usando el diafragma, el músculo que se encuentra debajo de los pulmones. Al inhalar, el abdomen se expande suavemente; al exhalar, se relaja. Es la respiración de los bebés: natural, lenta y profunda.

## Cómo practicarla

- Sitúate en un lugar cómodo, sentado o acostado, con una mano sobre el pecho y otra sobre el abdomen.
- Inhala por la nariz contando hasta cuatro, dejando que el aire llene el abdomen (la mano de abajo se mueve, la de arriba casi no).
- Sostén el aire un momento, sin forzar.
- Exhala por la boca contando hasta seis, soltando el aire despacio.

Repite este ciclo de cinco a diez veces. La exhalación más larga que la inhalación es la que envía la señal de calma al sistema nervioso.

## Cuándo usarla

No esperes a que la ansiedad sea intensa. Practícala unos minutos al día en momentos de calma, para que tu cuerpo la reconozca cuando realmente la necesites. Con el tiempo, notarás que recuperar la calma te toma cada vez menos esfuerzo.

Recuerda: no se trata de eliminar la ansiedad, sino de aprender a acompañarla hasta que baje sola. Estás aprendiendo una habilidad, y como toda habilidad, mejora con la práctica.`,
  },
  {
    title: "Higiene del sueño: hábitos para descansar mejor",
    category: "SUENO",
    body: `Dormir bien no es un lujo: es la base sobre la que se sostiene tu equilibrio emocional. Si te cuesta conciliar el sueño o te despiertas sin descansar, estos hábitos pueden ayudarte a recuperar un ritmo más sereno.

## Prepara el terreno

El sueño se construye durante el día. Estas son algunas claves:

- Acuéstate y levántate a la misma hora, incluso los fines de semana.
- Evita la cafeína después de media tarde.
- Haz ejercicio durante el día, pero no justo antes de dormir.
- Reduce pantallas y luces intensas al menos una hora antes de acostarte.

## Un ritual de descanso

Crea una rutina corta y agradable que le indique a tu mente que el día terminó: una ducha tibia, leer unas páginas, estiramientos suaves o escribir tres cosas del día por las que estés agradecido. Lo importante es que sea repetible y tranquila.

## Si no puedes dormir

Si pasados unos veinte minutos sigues despierto, no luches contra el sueño en la cama. Levántate, haz algo relajante con poca luz y vuelve cuando sientas sueño. El dormitorio debe asociarse con descansar, no con la frustración de no poder hacerlo.

Los cambios pequeños y constantes suelen dar mejores resultados que los grandes propósitos que duran dos días. Elige un solo hábito esta semana y obsérvalo con curiosidad, sin juzgarte.`,
  },
  {
    title: "¿Qué es la ansiedad y por qué siento esto?",
    category: "ANSIEDAD",
    body: `Si estás leyendo esto, probablemente hayas sentido alguna vez ese nudo en el estómago, esas preguntas que dan vueltas sin descanso o esa sensación de que algo va a salir mal aunque no sepas qué. Queremos empezar diciéndote algo importante: no estás roto, ni exagerando, ni solo.

## Una alarma que protege

La ansiedad es una respuesta natural del cuerpo ante lo que percibe como una amenaza. Es la misma alarma que hace siglos protegía a los humanos del peligro físico. El problema no es tenerla, sino que a veces suena cuando no hay un peligro real, o no deja de sonar.

Por eso sientes el corazón acelerado, la tensión muscular o los pensamientos acelerados: tu cuerpo se está preparando para actuar, aunque no siempre haya algo concreto que enfrentar.

## Señales habituales

- Preocupación constante o anticipación de lo peor.
- Inquietud física, dificultad para relajarte.
- Problemas para conciliar o mantener el sueño.
- Tensión en hombros, mandíbula o pecho.

## Qué puedes hacer

Notar la ansiedad es el primer paso. Respirar despacio, poner en palabras lo que sientes y permitirte pausas son gestos que, aunque parezcan pequeños, comunican a tu sistema nervioso que estás cuidándote.

Llegar hasta aquí ya es un acto de cuidado. En terapia podrás entender mejor de dónde viene tu ansiedad y construir, paso a paso, la forma de vivir con más calma. No tienes que resolverlo todo hoy.`,
  },
];

async function main() {
  const count = await prisma.article.count();
  if (count > 0) {
    console.log(`La tabla Article ya tiene ${count} artículo(s). No se insertó nada.`);
    return;
  }

  for (const article of ARTICLES) {
    await prisma.article.create({
      data: { ...article, published: true },
    });
    console.log(`Artículo creado: ${article.title} (${article.category})`);
  }
  console.log(`Listo: ${ARTICLES.length} artículos de ejemplo publicados.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
