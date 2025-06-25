/**
 * Formatea una fecha en formato legible (DD/MM/YYYY)
 *
 * @param dateString - Fecha a formatear (string, Date, o timestamp)
 * @returns String con la fecha formateada
 */
export const formatDate = (dateString?: string) => {
  if (!dateString) return "Nunca";
  const date = new Date(dateString);

  return new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

// Función para formatear fecha YYYY-MM-DD a formato legible
export const formatearFecha = (fecha?: string) => {
  if (!fecha) return "No especificada";

  // Si el formato es YYYY-MM-DD, crear la fecha manualmente para evitar desfase por zona horaria
  const match = fecha.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  let dateObj: Date;

  if (match) {
    const [_, year, month, day] = match;

    dateObj = new Date(Number(year), Number(month) - 1, Number(day));
  } else {
    dateObj = new Date(fecha);
  }

  return dateObj.toLocaleDateString("es-CO", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

// Función para formatear el kilometraje
export const formatearKilometraje = (km?: number) => {
  if (!km && km !== 0) return "No registrado";

  return `${new Intl.NumberFormat("es-CO").format(km)} km`;
};
