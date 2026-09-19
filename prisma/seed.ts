import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Utilidades de fechas locales (sin dependencias)
function hoy(hora: number, minutos = 0): Date {
  const d = new Date();
  d.setHours(hora, minutos, 0, 0);
  return d;
}

function haceDias(dias: number, hora = 11, minutos = 0): Date {
  const d = hoy(hora, minutos);
  d.setDate(d.getDate() - dias);
  return d;
}

function enDias(dias: number, hora = 11, minutos = 0): Date {
  const d = hoy(hora, minutos);
  d.setDate(d.getDate() + dias);
  return d;
}

async function main() {
  // Guardia: no re-sembrar si ya hay pacientes (evita pisar datos reales).
  // Forzar con FORCE_SEED=true. Nunca borra usuarios: conserva cuentas reales.
  const pacientesExistentes = await prisma.patient.count();
  if (pacientesExistentes > 0 && process.env.FORCE_SEED !== "true") {
    console.log(
      `Seed omitido: ya hay ${pacientesExistentes} paciente(s). Usa FORCE_SEED=true para forzar.`
    );
    return;
  }

  // Limpieza de datos demo (NO toca usuarios: conserva admin/cuentas reales).
  await prisma.payment.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.patient.deleteMany();

  // Terapeuta demo: solo si no hay ningún usuario. Si ya existe uno (p. ej.
  // el admin de producción), se conserva y solo se agregan los pacientes.
  let user: { email: string } | null = null;
  if ((await prisma.user.count()) === 0) {
    const passwordHash = await bcrypt.hash("dime1234", 10);
    user = await prisma.user.create({
      data: {
        email: "terapeuta@dime.app",
        name: "Mariana Solís",
        passwordHash,
      },
    });
  }

  // Pacientes (6, 2 inactivos)
  const pacientes = await Promise.all([
    prisma.patient.create({
      data: {
        nombre: "Fernanda",
        apellidos: "Reyes Guzmán",
        fechaNacimiento: new Date("1992-04-18"),
        sexo: "Femenino",
        telefono: "55 1234 0010",
        email: "fer.reyes@example.com",
        direccion: "Col. Roma Norte, CDMX",
        contactoEmergencia: "Jorge Reyes (padre) · 55 9876 1122",
        antecedentes: "Ansiedad generalizada, episodios de pánico desde 2023.",
      },
    }),
    prisma.patient.create({
      data: {
        nombre: "Carlos Alberto",
        apellidos: "Montemayor Ruiz",
        fechaNacimiento: new Date("1985-11-02"),
        sexo: "Masculino",
        telefono: "55 1234 0020",
        email: "carlos.mr@example.com",
        direccion: "Naucalpan, Estado de México",
        antecedentes: "Proceso de duelo por fallecimiento de su padre.",
      },
    }),
    prisma.patient.create({
      data: {
        nombre: "Lucía",
        apellidos: "Hernández Ponce",
        fechaNacimiento: new Date("1978-07-25"),
        sexo: "Femenino",
        telefono: "55 1234 0030",
        antecedentes: "Terapia de pareja (con R. Paredes) y autoestima.",
      },
    }),
    prisma.patient.create({
      data: {
        nombre: "Diego",
        apellidos: "Salgado Vera",
        fechaNacimiento: new Date("2001-01-30"),
        sexo: "Masculino",
        telefono: "55 1234 0040",
        email: "diegosv@example.com",
        direccion: "Col. Del Valle, CDMX",
        contactoEmergencia: "Marta Vera (madre) · 55 4455 9900",
        antecedentes: "TDAH en evaluación, dificultades de organización escolar.",
      },
    }),
    prisma.patient.create({
      data: {
        nombre: "Alejandra",
        apellidos: "Quiroz Medina",
        fechaNacimiento: new Date("1990-09-14"),
        sexo: "Femenino",
        telefono: "55 1234 0050",
        email: "ale.qm@example.com",
        antecedentes: "Estrés laboral crónico y síntomas somáticos.",
        isActive: false, // baja lógica: terminó su proceso
      },
    }),
    prisma.patient.create({
      data: {
        nombre: "Roberto",
        apellidos: "Paredes Luna",
        fechaNacimiento: new Date("1983-03-08"),
        sexo: "Masculino",
        telefono: "55 1234 0060",
        antecedentes: "Terapia de pareja (con L. Hernández).",
        notasInternas: "Solo asiste acompañado de su pareja; no reagendar por separado.",
        isActive: false,
      },
    }),
  ]);

  const [fernanda, carlos, lucia, diego, alejandra, roberto] = pacientes;

  // Citas (~18): pasadas (últimos 45 días), hoy y próximos 14 días
  const citas = await Promise.all([
    // --- Pasadas COMPLETADAS con notas ---
    prisma.appointment.create({
      data: {
        patientId: fernanda.id,
        startAt: haceDias(42, 10),
        endAt: haceDias(42, 11),
        status: "COMPLETADA",
        fee: 700,
        sessionNotes:
          "Reporta menos crisis de pánico durante la semana. Exploró el desencadenante laboral.",
        sessionTasks: "Practicar respiración 4-7-8 dos veces al día. Llevar diario de pensamientos.",
      },
    }),
    prisma.appointment.create({
      data: {
        patientId: carlos.id,
        startAt: haceDias(35, 12),
        endAt: haceDias(35, 13),
        status: "COMPLETADA",
        fee: 700,
        sessionNotes: "Avance notable en la etapa de aceptación del duelo. Menos irritabilidad.",
        sessionTasks: "Carta no enviada a su padre para leer en la próxima sesión.",
      },
    }),
    prisma.appointment.create({
      data: {
        patientId: fernanda.id,
        startAt: haceDias(28, 10),
        endAt: haceDias(28, 11),
        status: "COMPLETADA",
        fee: 700,
        sessionNotes:
          "Revisión del diario: identifica catastrofización en reuniones de trabajo. Buen insight.",
        sessionTasks: "Reestructurar dos pensamientos automáticos registrados.",
      },
    }),
    prisma.appointment.create({
      data: {
        patientId: lucia.id,
        startAt: haceDias(21, 11),
        endAt: haceDias(21, 12),
        status: "COMPLETADA",
        type: "ONLINE",
        fee: 600,
        sessionNotes: "Sesión de pareja. Comunicación asertiva: practicaron escucha activa.",
        sessionTasks: "Reunión semanal de pareja sin pantallas, 30 minutos.",
      },
    }),
    prisma.appointment.create({
      data: {
        patientId: diego.id,
        startAt: haceDias(14, 16),
        endAt: haceDias(14, 17),
        status: "COMPLETADA",
        fee: 650,
        sessionNotes: "Trajo resultados de evaluación. Se acordó abordaje con rutinas y timers.",
        sessionTasks: "Usar técnica Pomodoro para estudio. Aplicar checklist de salida.",
      },
    }),
    prisma.appointment.create({
      data: {
        patientId: carlos.id,
        startAt: haceDias(7, 12),
        endAt: haceDias(7, 13),
        status: "COMPLETADA",
        fee: 700,
        sessionNotes: "Leyó la carta con mucha emoción. Cierre de etapa del duelo en curso.",
        sessionTasks: "Ritual de despedida personal antes de la próxima sesión.",
      },
    }),
    // --- Pasadas NO_ASISTIO / CANCELADA ---
    prisma.appointment.create({
      data: {
        patientId: diego.id,
        startAt: haceDias(3, 16),
        endAt: haceDias(3, 17),
        status: "NO_ASISTIO",
        fee: 650,
      },
    }),
    prisma.appointment.create({
      data: {
        patientId: alejandra.id,
        startAt: haceDias(10, 10),
        endAt: haceDias(10, 11),
        status: "CANCELADA",
        fee: 700,
      },
    }),
    // --- Hoy ---
    prisma.appointment.create({
      data: {
        patientId: fernanda.id,
        startAt: hoy(10),
        endAt: hoy(11),
        status: "CONFIRMADA",
        fee: 700,
      },
    }),
    prisma.appointment.create({
      data: {
        patientId: lucia.id,
        startAt: hoy(12, 30),
        endAt: hoy(13, 30),
        status: "PENDIENTE",
        type: "ONLINE",
        fee: 600,
      },
    }),
    // --- Próximas CONFIRMADAS ---
    prisma.appointment.create({
      data: {
        patientId: carlos.id,
        startAt: enDias(2, 12),
        endAt: enDias(2, 13),
        status: "CONFIRMADA",
        fee: 700,
      },
    }),
    prisma.appointment.create({
      data: {
        patientId: diego.id,
        startAt: enDias(4, 16),
        endAt: enDias(4, 17),
        status: "CONFIRMADA",
        fee: 650,
      },
    }),
    prisma.appointment.create({
      data: {
        patientId: fernanda.id,
        startAt: enDias(7, 10),
        endAt: enDias(7, 11),
        status: "CONFIRMADA",
        fee: 700,
      },
    }),
    prisma.appointment.create({
      data: {
        patientId: lucia.id,
        startAt: enDias(9, 11),
        endAt: enDias(9, 12),
        status: "CONFIRMADA",
        type: "ONLINE",
        fee: 600,
      },
    }),
    // --- Próximas PENDIENTES ---
    prisma.appointment.create({
      data: {
        patientId: carlos.id,
        startAt: enDias(5, 13),
        endAt: enDias(5, 14),
        status: "PENDIENTE",
        fee: 700,
      },
    }),
    prisma.appointment.create({
      data: {
        patientId: diego.id,
        startAt: enDias(11, 17),
        endAt: enDias(11, 18),
        status: "PENDIENTE",
        fee: 650,
      },
    }),
    // --- Próximas NO_ASISTIO/CANCELADA para variar ---
    prisma.appointment.create({
      data: {
        patientId: roberto.id,
        startAt: enDias(6, 10),
        endAt: enDias(6, 11),
        status: "CANCELADA",
        fee: 600,
      },
    }),
  ]);

  // Pagos (~10): PAGADOS con paidAt y PENDIENTES para probar saldo
  await Promise.all([
    prisma.payment.create({
      data: {
        patientId: fernanda.id,
        appointmentId: citas[0].id,
        amount: 700,
        method: "TRANSFERENCIA",
        status: "PAGADO",
        paidAt: haceDias(42, 12),
        concept: "Sesión individual",
      },
    }),
    prisma.payment.create({
      data: {
        patientId: carlos.id,
        appointmentId: citas[1].id,
        amount: 700,
        method: "EFECTIVO",
        status: "PAGADO",
        paidAt: haceDias(35, 13),
        concept: "Sesión individual",
      },
    }),
    prisma.payment.create({
      data: {
        patientId: fernanda.id,
        appointmentId: citas[2].id,
        amount: 700,
        method: "TARJETA",
        status: "PAGADO",
        paidAt: haceDias(28, 11, 30),
        concept: "Sesión individual",
      },
    }),
    prisma.payment.create({
      data: {
        patientId: lucia.id,
        appointmentId: citas[3].id,
        amount: 600,
        method: "TRANSFERENCIA",
        status: "PAGADO",
        paidAt: haceDias(21, 12),
        concept: "Sesión de pareja (en línea)",
      },
    }),
    prisma.payment.create({
      data: {
        patientId: diego.id,
        appointmentId: citas[4].id,
        amount: 650,
        method: "EFECTIVO",
        status: "PAGADO",
        paidAt: haceDias(14, 17),
        concept: "Sesión individual",
      },
    }),
    prisma.payment.create({
      data: {
        patientId: carlos.id,
        appointmentId: citas[5].id,
        amount: 700,
        method: "TRANSFERENCIA",
        status: "PAGADO",
        paidAt: haceDias(7, 13, 15),
        concept: "Sesión individual",
      },
    }),
    // PENDIENTES para probar saldo por paciente
    prisma.payment.create({
      data: {
        patientId: diego.id,
        appointmentId: citas[6].id, // no asistió: se le cargó la sesión
        amount: 650,
        method: "EFECTIVO",
        status: "PENDIENTE",
        concept: "Sesión no asistida (cargo)",
      },
    }),
    prisma.payment.create({
      data: {
        patientId: fernanda.id,
        amount: 700,
        method: "TRANSFERENCIA",
        status: "PENDIENTE",
        concept: "Próxima sesión (anticipo pendiente)",
      },
    }),
    prisma.payment.create({
      data: {
        patientId: alejandra.id,
        amount: 700,
        method: "OTRO",
        status: "PENDIENTE",
        concept: "Última sesión antes de concluir proceso",
      },
    }),
    prisma.payment.create({
      data: {
        patientId: lucia.id,
        appointmentId: citas[9].id,
        amount: 600,
        method: "TARJETA",
        status: "PARCIAL",
        paidAt: haceDias(1, 18),
        concept: "Sesión de pareja — pago parcial (faltan $200)",
      },
    }),
  ]);

  const usuarioMsg = user ? `usuario ${user.email}` : "usuario existente conservado";
  console.log(
    `Seed completado: ${usuarioMsg}, ${pacientes.length} pacientes, ${citas.length} citas y 10 pagos.`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
