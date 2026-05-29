export const formatCurrency = (amount, currency = 'PEN') =>
  new Intl.NumberFormat('es-PE', { style: 'currency', currency }).format(amount ?? 0);

export const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  const [day, month, year] = dateStr.includes('/')
    ? dateStr.split('/')
    : new Date(dateStr).toLocaleDateString('es-PE').split('/');
  return `${day}/${month}/${year}`;
};

export const formatDateFromISO = (isoStr) => {
  if (!isoStr) return '—';
  return new Date(isoStr).toLocaleDateString('es-PE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
};

export const MESES = [
  '', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];
