/**
 * Formatea una fecha en formato legible (DD/MM/YYYY)
 *
 * @param dateString - Fecha a formatear (string, Date, o timestamp)
 * @returns String con la fecha formateada
 */
export const formatDate = (dateString?: string) => {
  if (!dateString) return "Nunca";
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};
