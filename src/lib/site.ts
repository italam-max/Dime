// Datos del consultorio para SEO/GEO local, JSON-LD, footer y contacto.
// IMPORTANTE: reemplaza los valores marcados con [ ] por los datos reales de
// DIME en Nezahualcóyotl; el SEO local depende de que el NAP (nombre, dirección,
// teléfono) sea correcto y consistente con tu Perfil de Empresa de Google.
export const SITE = {
  name: "DIME",
  legalName: "DIME · Apoyo psicoterapéutico",
  tagline: "Apoyo psicoterapéutico para la gestión de emociones",
  description:
    "DIME es un grupo multidisciplinario de apoyo psicoterapéutico en Nezahualcóyotl. Acompañamos tu proceso emocional con psicoterapia individual, de pareja, infantil y evaluación psicológica.",

  city: "Nezahualcóyotl",
  state: "Estado de México",
  country: "MX",
  // TODO: datos reales
  street: "Av. [tu dirección], Col. [colonia]",
  postalCode: "[C.P.]",
  phone: "+52 55 0000 0000",
  whatsapp: "525500000000", // solo dígitos, con código de país
  email: "hola@psicodime.net",
  geo: { lat: 19.4003, lng: -99.0145 }, // Nezahualcóyotl (aprox.)
  hours: "Lun a Sáb · 9:00 a 20:00",

  url: "https://psicodime.net",
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "https://app.psicodime.net",

  // Redes (reemplaza o elimina las que no uses)
  social: {
    facebook: "https://facebook.com/",
    instagram: "https://instagram.com/",
  },
} as const;

export function whatsappLink(text = "Hola, quiero agendar una cita en DIME."): string {
  return `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(text)}`;
}
