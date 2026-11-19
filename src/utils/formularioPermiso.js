/**
 * FORMATO DE AUTORIZACIÓN DE PERMISOS NO SUJETOS A DESCUENTO
 * (réplica del .docx de RR.HH., secciones 1 a 5).
 *
 * Recibe el detalle de SP_RRHH_PERMISO_DETALLE ({ solicitud, documentos }) y
 * abre una ventana lista para imprimir / guardar como PDF. Las firmas son las
 * digitales guardadas al firmar (trabajador al enviar, jefe al autorizar);
 * si no hay, queda la línea en blanco para firmar a mano.
 *
 * Hay una copia idéntica en RRHH_WEB/src/lib/formularioPermiso.js: mantener ambas iguales.
 */

/** Tipos de permiso del formato, en su orden (= PLA_PERMISO_MOTIVOS.NUM_ORDEN). */
const TIPOS = [
  [1, 'Descanso médico (con certificado)'],
  [2, 'Licencia de paternidad (10 días)'],
  [3, 'Licencia de maternidad (98 días)'],
  [4, 'Permiso por cita médica'],
  [5, 'Licencia por fallecimiento de familiar (5 días) provincia (7)'],
  [6, 'Permiso personal sin goce de haber'],
  [7, 'Permiso por citación judicial'],
  [8, 'Otros (especificar):'],
];

const esc = (v) => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const dmy = (v) => {
  if (!v) return '';
  const s = String(v);
  return `${s.slice(8, 10)}/${s.slice(5, 7)}/${s.slice(0, 4)}`;
};
const nombrePropio = (t) => String(t ?? '').toLowerCase().replace(/(^|[\s,(])([a-záéíóúñ])/g, (m, a, b) => a + b.toUpperCase());
const caja = (marcada) => `<span class="box">${marcada ? '✔' : ''}</span>`;

function firma(url) {
  return url
    ? `<div class="firma"><img src="${esc(url)}" alt="Firma"></div>`
    : '<div class="firma"></div>';
}

export function htmlPermiso({ solicitud: s, documentos = [], logoUrl }) {
  const orden = Number(s.motivo_orden);
  const tipos = documentos.map((d) => String(d.des_tipo ?? '').toLowerCase());
  const tieneCert = tipos.some((t) => t.startsWith('certificado'));
  const tieneSol = tipos.some((t) => t.includes('solicitud'));
  const otros = documentos.filter((d) => {
    const t = String(d.des_tipo ?? '').toLowerCase();
    return !t.startsWith('certificado') && !t.includes('solicitud');
  });
  const otroTexto = otros.map((d) => d.des_otro || d.des_tipo).join(', ');
  const autorizado = s.est_jefe === 'A';
  const conforme = s.ind_conforme_trab === 'S';
  const nombre = nombrePropio(s.nombre_completo);
  const estadoTexto = {
    PENDIENTE_JEFE: 'Pendiente de autorización del jefe',
    PENDIENTE_RRHH: 'Autorizado por el jefe · pendiente de RR.HH.',
    APROBADA: 'Aprobado por RR.HH.',
    RECHAZADA: s.rechazo_jefe === '1' || s.rechazo_jefe === 1 || s.rechazo_jefe === true ? 'Rechazado por el jefe' : 'Rechazado por RR.HH.',
    CANCELADA: 'Cancelado',
  }[s.etapa] ?? '';

  return `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"><title>Autorización de permiso - ${esc(nombre)}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: Arial, sans-serif; font-size: 11.5px; color:#000; padding: 12mm 15mm; }
  .cab { display:flex; align-items:center; gap:14px; border-bottom:2px solid #000; padding-bottom:8px; }
  .cab img { max-width:110px; max-height:60px; object-fit:contain; }
  .logo-txt { color:#B11A1A; font-weight:900; font-size:20px; line-height:1; }
  h1 { flex:1; text-align:center; font-size:15px; font-weight:800; }
  .num { font-size:10px; text-align:right; min-width:90px; }
  h2 { font-size:12px; font-weight:800; margin:14px 0 6px; }
  .fila { display:flex; gap:6px; margin:4px 0; }
  .lbl { white-space:nowrap; }
  .val { flex:1; border-bottom:1px solid #000; min-height:15px; padding:0 4px; font-weight:bold; }
  .tipos { display:grid; grid-template-columns: 1fr 1fr; gap:3px 18px; margin-top:4px; }
  .box { display:inline-flex; width:13px; height:13px; border:1.3px solid #000; margin-right:6px; vertical-align:-2px;
         align-items:center; justify-content:center; font-size:10px; font-weight:bold; }
  .nota { font-size:10px; font-style:italic; color:#333; }
  .texto { border:1px solid #000; min-height:46px; padding:5px 6px; margin-top:4px; white-space:pre-wrap; }
  .firmas { display:flex; gap:30px; margin-top:6px; align-items:flex-end; }
  .firmas > div { flex:1; }
  .firma { border-bottom:1.3px solid #000; height:52px; display:flex; align-items:flex-end; justify-content:center; }
  .firma img { max-height:48px; max-width:90%; object-fit:contain; }
  .pie { font-size:9.5px; font-weight:bold; margin-top:3px; }
  .estado { margin-top:16px; border-top:1px dashed #999; padding-top:6px; font-size:9.5px; color:#444; }
  @media print { body { padding: 8mm 12mm; } @page { size: A4 portrait; margin: 5mm; } }
</style></head>
<body>
<div class="cab">
  ${logoUrl ? `<img src="${esc(logoUrl)}" alt="Logo">` : '<div class="logo-txt">Clínica<br>La Luz</div>'}
  <h1>FORMATO DE AUTORIZACIÓN DE PERMISOS<br>NO SUJETOS A DESCUENTO</h1>
  <div class="num">N° ${esc(s.id)}<br>${esc(dmy(s.fecha_solicitud))}</div>
</div>

<h2>1. DATOS DEL PERSONAL</h2>
<div class="fila"><span class="lbl">Nombre completo:</span><span class="val">${esc(nombre)}</span></div>
<div class="fila"><span class="lbl">DNI / Nº de documento:</span><span class="val">${esc(s.dni)}</span>
  <span class="lbl">Código:</span><span class="val" style="flex:.5">${esc(s.cod_personal)}</span></div>
<div class="fila"><span class="lbl">Cargo / Puesto:</span><span class="val">${esc(nombrePropio(s.cargo))}</span></div>
<div class="fila"><span class="lbl">Área / Departamento:</span><span class="val">${esc(nombrePropio(s.area))}</span></div>
<div class="fila"><span class="lbl">Empresa / Sede:</span><span class="val">${esc(nombrePropio([s.empresa_nombre, s.sede].filter(Boolean).join(' · ')))}</span></div>

<h2>2. DETALLES DEL PERMISO</h2>
<div>Tipo de permiso solicitado: <span class="nota">(Marcar con un ✔ el tipo de permiso)</span></div>
<div class="tipos">
  ${TIPOS.map(([n, t]) => `<div>${caja(n === orden)}${esc(t)}${n === 8 && orden === 8 ? ` <b>${esc(s.des_otro_motivo)}</b>` : ''}${n === 5 && orden === 5 && s.ind_provincia === 'S' ? ' <b>(provincia)</b>' : ''}</div>`).join('')}
</div>
<div class="fila" style="margin-top:8px"><span class="lbl">Fecha(s) del permiso: &nbsp; Desde:</span><span class="val">${esc(dmy(s.fecha_inicio))}</span>
  <span class="lbl">Hasta:</span><span class="val">${esc(dmy(s.fecha_fin))}</span>
  <span class="lbl">Días:</span><span class="val" style="flex:.4">${esc(s.dias_solicitados)}</span></div>
<div class="fila"><span class="lbl">Horario (si aplica): &nbsp; Desde:</span><span class="val">${esc(s.hora_inicio)}</span>
  <span class="lbl">Hasta:</span><span class="val">${esc(s.hora_fin)}</span></div>
<div style="margin-top:6px">Motivo / Justificación del permiso:</div>
<div class="texto">${esc(s.justificacion)}</div>

<h2>3. DOCUMENTACIÓN ADJUNTA (si corresponde)</h2>
<div class="tipos">
  <div>${caja(tieneCert)}Certificado médico</div>
  <div>${caja(tieneSol)}Solicitud firmada</div>
  <div>${caja(otros.length > 0)}Otro: <b>${esc(otroTexto)}</b></div>
</div>

<h2>4. AUTORIZACIÓN</h2>
<div class="fila"><span class="lbl">Nombre del Administrador de Sede:</span><span class="val">${esc(autorizado || s.est_jefe === 'R' ? nombrePropio(s.nom_jefe) : '')}</span></div>
<div class="firmas">
  <div>${firma(autorizado ? s.firma_jefe_url : null)}<div class="pie">Firma del Administrador</div></div>
  <div style="flex:.6"><div class="fila"><span class="lbl">Fecha:</span><span class="val">${esc(s.fec_jefe ? dmy(s.fec_jefe) : '')}</span></div></div>
</div>
<div style="margin-top:6px">Observaciones (si hubiera):</div>
<div class="texto" style="min-height:34px">${esc([s.obs_jefe, s.obs_rrhh ? `RR.HH.: ${s.obs_rrhh}` : ''].filter(Boolean).join('\n'))}</div>

<h2>5. FIRMA DE CONFORMIDAD DEL TRABAJADOR</h2>
<p>Declaro haber solicitado el presente permiso y estar conforme con los términos del mismo.</p>
<div class="firmas">
  <div>${firma(conforme ? s.firma_trab_url : null)}<div class="pie">Firma del trabajador</div></div>
  <div style="flex:.6"><div class="fila"><span class="lbl">Fecha:</span><span class="val">${esc(conforme ? dmy(s.fec_conforme_trab) : '')}</span></div></div>
</div>

<div class="estado">
  Estado: <b>${esc(estadoTexto)}</b>
  ${s.etapa === 'APROBADA' && s.nom_rrhh ? ` · Aprobado por RR.HH.: ${esc(nombrePropio(s.nom_rrhh))} el ${esc(dmy(s.fecha_aprobacion_rh))}` : ''}
  ${s.afecta_salario === 'S' ? ' · <b>Afecta remuneración (sin goce de haber)</b>' : ''}
  · Registrado desde ${esc(s.origen === 'INTRANET' ? 'la intranet' : 'RR.HH.')} por ${esc(s.cod_usuario_solicita ?? '')}
</div>
</body></html>`;
}

/** Abre el formato en una ventana nueva e inicia la impresión. */
export function imprimirPermiso(detalle, logoUrl) {
  const win = window.open('', '_blank', 'width=860,height=1000');
  if (!win) return false;
  win.document.write(htmlPermiso({ ...detalle, logoUrl }));
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 400);
  return true;
}
