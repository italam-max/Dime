# 04 · Roadmap

Orden sugerido tras el MVP. Cada fase es entregable de forma independiente.

## Fase A — Comunicaciones
- Recordatorios de cita por email (24 h y 2 h antes).
- Plantillas de mensajes personalizables.
- Bitácora de comunicaciones por paciente.

## Fase B — Portal del paciente
- Especificación completa y construible en **docs/05-paciente.md** (magic link, consentimiento digital, evaluaciones PHQ-9/GAD-7/WHO-5, biblioteca psicoeducativa, tareas entre sesiones).
- Se implementa por sub-fases: P1 acceso+tareas, P2 evaluaciones, P3 biblioteca, P4 pulido.
- Postergado dentro de esta fase: que el paciente reprograme citas en línea (decisión: el terapeuta sigue gestionando la agenda en MVP).

## Fase C — Recordatorios WhatsApp
- Integración con API de WhatsApp Business (o proveedor tipo Twilio).
- Confirmación de asistencia con un toque (botones de respuesta).

## Fase D — Multi-terapeuta
- Roles: admin, terapeuta, recepción.
- Agenda por terapeuta, disponibilidad y sobrelapación entre profesionales.
- Filtrado de reportes por terapeuta.

## Fase E — Práctica clínica avanzada
- Evolución del paciente con gráficas de progreso.
- Adjuntos (consentimientos, evaluaciones) con almacenamiento de archivos.
- Cuestionarios estandarizados (PHQ-9, GAD-7) con cálculo automático.

## Fase F — Facturación y operación
- Facturación fiscal (CFDI en México u equivalente local).
- Exportación de reportes a PDF/Excel.
- Catálogo de tarifas y paquetes de sesiones.

## Fase G — Teleterapia
- Sala de videollamada integrada (WebRTC vía proveedor).
- Enlace de sesión generado automáticamente para citas `ONLINE`.

## Criterio de priorización
1. Lo que ahorra tiempo administrativo al terapeuta (A, luego C).
2. Lo que mejora la retención de pacientes (B).
3. Lo que habilita crecimiento del negocio (D, F).
