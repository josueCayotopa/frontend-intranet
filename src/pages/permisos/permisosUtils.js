/** Utilidades del módulo de permisos (intranet). */

/** Etapa de la solicitud (la calcula SP_RRHH_PERMISOS_BASE). */
export const ETAPAS = {
  PENDIENTE_JEFE: { texto: 'Espera al jefe', clase: 'bg-amber-50 text-amber-700' },
  PENDIENTE_RRHH: { texto: 'Autorizado · en RR.HH.', clase: 'bg-blue-50 text-blue-700' },
  APROBADA: { texto: 'Aprobado', clase: 'bg-green-50 text-green-700' },
  RECHAZADA: { texto: 'Rechazado', clase: 'bg-red-50 text-red-700' },
  CANCELADA: { texto: 'Cancelado', clase: 'bg-gray-100 text-gray-500' },
};

export const EXTENSIONES = '.pdf,.jpg,.jpeg,.png';
export const MAX_MB = 10;

export const si = (v) => v === true || v === 1 || v === '1' || v === 'S';

export function archivoValido(f) {
  if (!f) return 'Elija el archivo.';
  const ext = f.name.split('.').pop()?.toLowerCase();
  if (!['pdf', 'jpg', 'jpeg', 'png'].includes(ext)) return 'Solo PDF o imagen (JPG, PNG).';
  if (f.size > MAX_MB * 1024 * 1024) return `El archivo debe pesar como máximo ${MAX_MB} MB.`;
  return '';
}

export const horario = (s) => (s.hora_inicio ? `${s.hora_inicio} a ${s.hora_fin}` : '');
