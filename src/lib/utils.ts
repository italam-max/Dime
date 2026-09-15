// cn lo provee el paquete "cn" (estándar de los componentes generados por shadcn/ui).
export { cn, type ClassValue } from "cn";
import { format } from "date-fns";
import { es } from "date-fns/locale";

// Moneda en formato mexicano.
const formatoMoneda = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
});

export function formatCurrency(amount: number): string {
  return formatoMoneda.format(amount);
}

// Fechas en español con date-fns.
export function formatDate(date: Date | string, pattern = "d 'de' MMMM 'de' yyyy"): string {
  return format(new Date(date), pattern, { locale: es });
}

export function formatDateTime(date: Date | string): string {
  return formatDate(date, "d 'de' MMMM, HH:mm");
}

export function patientFullName(p: { nombre: string; apellidos: string }): string {
  return `${p.nombre} ${p.apellidos}`;
}

// Edad calculada a partir de la fecha de nacimiento.
export function calculateAge(fechaNacimiento: Date | string | null | undefined): number | null {
  if (!fechaNacimiento) return null;
  const birth = new Date(fechaNacimiento);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
    age -= 1;
  }
  return age;
}
