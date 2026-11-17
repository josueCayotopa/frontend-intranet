// Utilidades del módulo "Evaluar a mi personal".

export const ROJO = '#B11A1A';

export const RECOMENDACIONES = [
  { valor: '12M', texto: '12 meses', largo: 'Renovar contrato por 12 meses' },
  { valor: '6M', texto: '6 meses', largo: 'Renovar contrato por 6 meses' },
  { valor: '3M', texto: '3 meses', largo: 'Renovar contrato por 3 meses' },
  { valor: '2M', texto: '2 meses', largo: 'Renovar contrato por 2 meses' },
  { valor: '1M', texto: '1 mes', largo: 'Renovar contrato por 1 mes' },
  { valor: 'IN', texto: 'Indeterminado', largo: 'Renovar a plazo indeterminado' },
  { valor: 'NO', texto: 'No renovar', largo: 'No renovar el contrato' },
];

export const textoRecomendacion = (v) => RECOMENDACIONES.find((r) => r.valor === v)?.largo ?? '—';

/** Estado de la evaluación visto por el jefe. */
export function estadoJefe(f) {
  if (!f.estado) return { texto: 'Sin evaluación asignada', clase: 'bg-gray-100 text-gray-500' };
  if (f.estado === 'EN_PROCESO' && f.falta_seccion && f.falta_seccion !== 'RH') {
    return { texto: 'Pendiente de su calificación', clase: 'bg-red-50 text-red-700' };
  }
  const mapa = {
    EN_PROCESO: { texto: 'Calificado · falta RR.HH.', clase: 'bg-blue-50 text-blue-700' },
    PENDIENTE_APROBACION: { texto: 'En aprobación', clase: 'bg-amber-50 text-amber-700' },
    APROBADA: { texto: 'Aprobada', clase: 'bg-green-50 text-green-700' },
    CERRADA: { texto: 'Cerrada', clase: 'bg-green-50 text-green-700' },
    RECHAZADA: { texto: 'Rechazada', clase: 'bg-red-50 text-red-700' },
    CONTRATO_GENERADO: { texto: 'Contrato renovado', clase: 'bg-gray-100 text-gray-600' },
  };
  return mapa[f.estado] ?? { texto: f.estado, clase: 'bg-gray-100 text-gray-600' };
}

export function fecha(valor) {
  if (!valor) return '—';
  const [a, m, d] = String(valor).slice(0, 10).split('-');
  return Number(a) >= 2050 ? 'Indeterminado' : `${d}/${m}/${a}`;
}

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'setiembre', 'octubre', 'noviembre', 'diciembre'];
export const periodoTexto = (p) => (p ? `${MESES[(Number(p) % 100) - 1]} ${Math.floor(Number(p) / 100)}` : '—');

export const nombrePropio = (t) => (t ?? '').toLowerCase().replace(/(^|[\s,'-])(\p{L})/gu, (_, s, l) => s + l.toUpperCase());

const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/**
 * Imprime la evaluación con el mismo esquema del formato oficial (datos,
 * sección RR.HH., sección del jefe, resultado, aprobaciones y firmas).
 * Abre una ventana con el documento y lanza el diálogo de impresión.
 */
export function imprimirEvaluacion(datos) {
  const c = datos.cabecera;
  const seccion = (cat) => {
    const filas = datos.criterios.filter((x) => x.categoria === cat);
    const sub = filas.reduce((s, x) => s + (Number(x.puntaje) || 0) * Number(x.peso || 1), 0);
    return `<table><thead><tr><th>Criterio</th><th class="n">Puntaje</th><th>Observación</th></tr></thead><tbody>${filas
      .map((x) => `<tr><td>${esc(x.descripcion)}</td><td class="n">${x.puntaje ?? '-'} / ${x.escala_max}</td><td>${esc(x.observacion)}</td></tr>`)
      .join('')}</tbody></table><p class="sub">Subtotal: ${sub}</p>`;
  };
  const total = datos.criterios.reduce((s, x) => s + (Number(x.puntaje) || 0) * Number(x.peso || 1), 0);
  const aprob = datos.aprobaciones
    .map((a) => `<li><strong>${esc(a.nombre ?? a.usuario)}</strong> — ${a.estado === 'A' ? 'Aprobado' : a.estado === 'R' ? 'Rechazado' : 'Pendiente'}${a.fecha_accion ? ` (${fecha(a.fecha_accion)})` : ''}${a.comentario ? `: ${esc(a.comentario)}` : ''}</li>`)
    .join('');

  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Evaluación ${esc(c.nombre_completo)}</title>
<style>
  body{font:12px/1.4 Arial,sans-serif;color:#111;margin:24px}
  h1{font-size:18px;color:#0a3d7a;margin:0}
  .cab{display:flex;justify-content:space-between;border-bottom:2px solid #0a3d7a;padding-bottom:8px;margin-bottom:12px}
  h2{font-size:12px;text-transform:uppercase;background:#f1f3f6;border-left:4px solid #0a3d7a;padding:5px 8px;margin:14px 0 6px}
  table{width:100%;border-collapse:collapse}th,td{border:1px solid #d5d9e0;padding:5px 7px;text-align:left;vertical-align:top}
  th{background:#f7f8fa;font-size:11px;text-transform:uppercase}.n{text-align:center;width:80px}
  .sub{text-align:right;font-weight:bold;margin:4px 0}
  .total{border:1px solid #bcd3ee;background:#eef5fd;text-align:center;padding:10px;margin-top:6px}
  .total b{font-size:18px;color:#0a3d7a}
  .firmas{display:flex;justify-content:space-around;margin-top:60px;text-align:center}
  .firmas div{border-top:1px solid #000;width:28%;padding-top:4px;font-size:11px}
  @media print{body{margin:10mm}}
</style></head><body>
<div class="cab"><div><h1>EVALUACIÓN DE DESEMPEÑO</h1><div>Período: ${esc(periodoTexto(c.periodo))}</div></div>
<div>${esc(nombrePropio(c.empresa_nombre))}<br>Emisión: ${new Date().toLocaleDateString('es-PE')}</div></div>
<h2>A. Datos del trabajador</h2>
<table><tr><th>Nombre</th><td>${esc(c.nombre_completo)}</td><th>F. ingreso</th><td>${fecha(c.fecha_ingreso ?? c.fec_ingreso_planilla)}</td></tr>
<tr><th>Puesto</th><td>${esc([c.area, c.area_puesto ?? c.cargo].filter(Boolean).join(' / '))}</td><th>Jefe</th><td>${esc(c.jefe_nombre ?? '')}</td></tr></table>
<h2>B. Evaluación Recursos Humanos</h2>${seccion('RH')}
<h2>C. Evaluación jefe inmediato</h2>${seccion('JEFE')}
<h2>D. Resultado final</h2>
<div class="total"><b>PUNTAJE TOTAL: ${total}</b><br>Recomendación final: <strong>${esc(textoRecomendacion(c.recomendacion_final))}</strong></div>
${c.recomendaciones ? `<p><strong>Recomendaciones:</strong> ${esc(c.recomendaciones)}</p>` : ''}
<h2>E. Aprobaciones</h2>${aprob ? `<ul>${aprob}</ul>` : '<p>Sin aprobadores.</p>'}
<div class="firmas"><div>${esc(c.jefe_nombre ?? '')}<br><b>JEFE INMEDIATO</b></div><div>RECURSOS HUMANOS</div><div>GERENCIA</div></div>
<script>window.onload=function(){window.print();}</script>
</body></html>`;

  const ventana = window.open('', '_blank');
  if (!ventana) return false;
  ventana.document.open();
  ventana.document.write(html);
  ventana.document.close();
  return true;
}

/** Estado general de la evaluación, visto por el aprobador. */
export function estadoGeneral(f) {
  if (f.estado === 'EN_PROCESO') {
    const falta = { RH: 'RR.HH.', JEFE: 'el jefe', RH_JEFE: 'RR.HH. y el jefe' }[f.falta_seccion] ?? 'una sección';
    return { texto: `Falta calificar: ${falta}`, clase: 'bg-gray-100 text-gray-600' };
  }
  return ({
    PENDIENTE_APROBACION: { texto: 'En aprobación', clase: 'bg-amber-50 text-amber-700' },
    APROBADA: { texto: 'Aprobada · lista para contrato', clase: 'bg-green-50 text-green-700' },
    CERRADA: { texto: 'Cerrada', clase: 'bg-green-50 text-green-700' },
    RECHAZADA: { texto: 'Rechazada', clase: 'bg-red-50 text-red-700' },
    CONTRATO_GENERADO: { texto: 'Contrato renovado', clase: 'bg-gray-100 text-gray-600' },
  })[f.estado] ?? { texto: f.estado, clase: 'bg-gray-100 text-gray-600' };
}

/** Bit del SQL Server (llega como texto). */
export const si = (v) => v === true || v === 1 || v === '1';
