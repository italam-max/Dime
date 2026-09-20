// Datos del consultorio para SEO/GEO local, JSON-LD, footer y contacto.
//
// Los datos de contacto (dirección, teléfono, WhatsApp, correo, horario) están
// PENDIENTES de confirmación del cliente. Mientras CONTACT_READY sea false, el
// sitio NO los publica (muestra un aviso de "muy pronto"). Cuando el cliente
// confirme: completa los campos reales y pon CONTACT_READY en true. El SEO local
// depende de que el NAP sea correcto y consistente con el Perfil de Empresa de
// Google.
export const CONTACT_READY: boolean = false;

export const SITE = {
  name: "DIME",
  legalName: "DIME · Apoyo psicoterapéutico",
  tagline: "Apoyo psicoterapéutico para la gestión de emociones",
  description:
    "DIME es un grupo multidisciplinario de apoyo psicoterapéutico en Nezahualcóyotl. Acompañamos tu proceso emocional con psicoterapia individual, de pareja, infantil y evaluación psicológica.",

  // Ubicación general (segura de publicar).
  city: "Nezahualcóyotl",
  state: "Estado de México",
  country: "MX",
  geo: { lat: 19.4003, lng: -99.0145 }, // Nezahualcóyotl (aprox.)

  // Pendientes de confirmación — se completan y se publican con CONTACT_READY.
  street: "",
  postalCode: "",
  phone: "",
  whatsapp: "", // solo dígitos, con código de país (ej. 525512345678)
  email: "",
  hours: "",

  url: "https://psicodime.net",
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "https://app.psicodime.net",

  // Redes (reemplaza o elimina las que no uses; vacío = no se publica)
  social: {
    facebook: "",
    instagram: "",
  },
};

// Destino del botón "Agendar cita": WhatsApp cuando esté publicado; mientras
// tanto lleva a la sección de contacto (aviso de próximamente).
export function agendarHref(text = "Hola, quiero agendar una cita en DIME."): string {
  if (CONTACT_READY && SITE.whatsapp) {
    return `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(text)}`;
  }
  return "/inicio#contacto";
}

// ¿El destino de agendar es un enlace externo (WhatsApp)? Define target/rel.
export function agendarIsExternal(): boolean {
  return CONTACT_READY && Boolean(SITE.whatsapp);
}
