# 01 · Requerimientos

## Visión
Plataforma integral para psicólogos/terapeutas que centraliza el seguimiento de sus pacientes y citas. El **paciente es el núcleo (core) del sistema**: toda cita, sesión y pago gira alrededor de su ficha clínica.

Principios rectores:

- **Minimalismo premium**: interfaz limpia, con aire, jerarquía tipográfica clara. Nada que distraiga del trabajo clínico.
- **Calma**: colores sobrios, transiciones suaves, microcopy tranquilizador. La herramienta no debe generar estrés.
- **Amigable**: pocas pantallas, acciones evidentes, estados vacíos que guían.

## Alcance del MVP

| Módulo | Incluye |
|---|---|
| Pacientes (core) | Alta, edición, baja lógica, búsqueda, filtros, ficha clínica completa |
| Agenda de citas | Calendario semanal + lista del día, crear/reprogramar/cancelar, estados de asistencia, notas de sesión |
| Pagos | Registro de pagos por paciente/cita, estados (pendiente/pagado/parcial), saldo pendiente |
| Reportes | Dashboard con KPIs y gráficos (ingresos, asistencia, citas por estado) |

## Fuera del MVP (roadmap)

- Recordatorios automáticos (email/WhatsApp)
- Portal del paciente (agendar en línea, ver sus citas)
- Teleterapia / videollamadas
- Multi-terapeuta con roles y permisos
- Facturación fiscal / CFDI (México) u equivalentes
- Historial clínico avanzado (evolución, gráficas de progreso, adjuntos)

## Actores

- **Terapeuta (admin)**: único rol en el MVP. Gestiona todo.

## Reglas de negocio

### Paciente
- Un paciente se da de **baja lógica** (`isActive = false`), nunca se borra: preserva historial clínico y pagos.
- Campos obligatorios al alta: nombre, apellidos, teléfono.
- Contacto de emergencia recomendado pero no obligatorio.

### Cita
- Estados: `PENDIENTE` → `CONFIRMADA` → `COMPLETADA` | `NO_ASISTIO`; `CANCELADA` desde casi cualquier estado.
- Al completar una sesión se capturan **notas de sesión** (resumen clínico y tareas/acuerdos).
- Una cita tiene duración (inicio–fin), tipo (`PRESENCIAL` u `ONLINE`) y tarifa aplicada.
- Reprogramar = cambiar fecha/hora manteniendo estado (`PENDIENTE`/`CONFIRMADA`).
- No se permiten dos citas solapadas en el mismo horario (validación a nivel de aplicación).

### Pago
- Estados: `PENDIENTE`, `PAGADO`, `PARCIAL`.
- Métodos: `EFECTIVO`, `TRANSFERENCIA`, `TARJETA`, `OTRO`.
- Un pago se liga a un paciente y, opcionalmente, a una cita concreta.
- El **saldo pendiente** del paciente = suma de pagos pendientes/parciales asociados.

### Reportes
- KPIs del mes en curso: citas realizadas, tasa de asistencia, ingresos cobrados, pacientes activos.
- Gráficas: ingresos por mes (12 meses), distribución de citas por estado, asistencia semanal.

## Requerimientos no funcionales

- Idioma de la interfaz: **español** (todos los textos).
- Rendimiento: pantallas con datos de ejemplo (< 1.000 pacientes) deben cargar < 1 s.
- Seguridad: autenticación obligatoria; contraseñas con hash (bcrypt); datos de pacientes protegidos tras login.
- Disponibilidad de impresión básica de ficha (nice-to-have, no bloqueante).
