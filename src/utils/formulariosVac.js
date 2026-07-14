/**
 * Genera e imprime los formularios oficiales de vacaciones de Clínica La Luz:
 *  - SOLICITUD DE VACACIONES (tipo VG)
 *  - COMPRA DE VACACIONES    (tipo VC)
 *
 * Abre una ventana nueva con el HTML listo para imprimir / guardar como PDF.
 */

// Parsea fecha en formato 'dd/mm/yyyy' (como devuelve ErpService) → Date
function parseDMY(str) {
  if (!str) return null;
  const parts = str.split('/');
  if (parts.length !== 3) return null;
  const d = new Date(`${parts[2]}-${parts[1]}-${parts[0]}T00:00:00`);
  return isNaN(d) ? null : d;
}

// Agrega un día y devuelve 'dd/mm/yyyy'
function diaSignuiente(dmy) {
  const d = parseDMY(dmy);
  if (!d) return '';
  d.setDate(d.getDate() + 1);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yy = d.getFullYear();
  return `${dd}/${mm}/${yy}`;
}

function esc(v) {
  return String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ── Estilos comunes ────────────────────────────────────────────────────────
const CSS = `
  * { margin:0; padding:0; box-sizing:border-box; }
  body {
    font-family: Arial, sans-serif;
    font-size: 11px;
    color: #000;
    background: #fff;
    padding: 12mm 14mm;
  }
  table { border-collapse: collapse; width: 100%; }
  td    { border: 1.5px solid #000; padding: 5px 8px; vertical-align: top; }
  .nb td { border: none; padding: 0; }
  .lbl   { font-size: 8px; font-weight: 800; text-transform: uppercase; margin-bottom: 2px; letter-spacing: .3px; }
  .val   { font-size: 12px; min-height: 17px; }
  .th    { background:#000; color:#fff; text-align:center; font-weight:bold; font-size:11.5px; padding:4px; }
  @media print {
    body { padding: 6mm 10mm; }
    @page { size: A4 portrait; margin: 4mm; }
  }
`;

const LOGO = `
  <td style="width:125px;text-align:center;padding:9px 16px;border-right:1.5px solid #000;">
    <div style="font-size:9px;font-weight:bold;color:#B11A1A;letter-spacing:1px;">Clínica</div>
    <div style="font-size:23px;font-weight:900;color:#B11A1A;line-height:1.1;letter-spacing:-.5px;">La Luz</div>
  </td>
`;

// ── HTML Solicitud de Vacaciones (VG) ──────────────────────────────────────
function htmlSolicitudVac({ nombre, dni, cargo, empresa, sede, fecIngreso, dSol, mSol, aSol, solicitud }) {
  const dias      = solicitud.num_dias ?? 0;
  const fecInicio = solicitud.fec_inicio ?? '';
  const fecFinal  = solicitud.fec_final  ?? '';
  const fecReanuda = diaSignuiente(fecFinal);
  const periodo   = solicitud.periodo_vac ?? '';

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Solicitud de Vacaciones</title>
  <style>${CSS}</style>
</head>
<body>

<!-- CABECERA -->
<table>
  <tr>
    ${LOGO}
    <td style="text-align:center;font-size:19px;font-weight:bold;vertical-align:middle;">
      SOLICITUD DE VACACIONES
    </td>
    <td style="width:108px;text-align:center;padding:5px;border-left:1.5px solid #000;">
      <div class="lbl" style="border-bottom:1.5px solid #000;padding-bottom:3px;margin-bottom:5px;font-size:7.5px;">
        Fecha de Solicitud
      </div>
      <table style="margin:0;">
        <tr>
          <td style="text-align:center;font-size:13px;font-weight:bold;padding:3px 5px;">${esc(dSol)}</td>
          <td style="text-align:center;font-size:13px;font-weight:bold;padding:3px 5px;">${esc(mSol)}</td>
          <td style="text-align:center;font-size:13px;font-weight:bold;padding:3px 5px;">${esc(aSol)}</td>
        </tr>
      </table>
    </td>
  </tr>
</table>

<!-- DATOS PERSONALES -->
<table style="margin-top:-1.5px;">
  <tr><td colspan="2" class="th">DATOS PERSONALES</td></tr>
  <tr>
    <td colspan="2">
      <div class="lbl">Apellidos y Nombres</div>
      <div class="val">${esc(nombre)}</div>
    </td>
  </tr>
  <tr>
    <td style="width:50%;">
      <div class="lbl">N° DNI</div>
      <div class="val">${esc(dni)}</div>
    </td>
    <td>
      <div class="lbl">Cargo que Desempeña</div>
      <div class="val">${esc(cargo)}</div>
    </td>
  </tr>
</table>

<!-- DATOS GENERALES -->
<table style="margin-top:-1.5px;">
  <tr><td colspan="2" class="th">DATOS GENERALES</td></tr>
  <tr>
    <td colspan="2">
      <div class="lbl">Empresa</div>
      <div class="val">${esc(empresa)}</div>
    </td>
  </tr>
  <tr>
    <td style="width:50%;">
      <div class="lbl">Sede</div>
      <div class="val">${esc(sede)}</div>
    </td>
    <td>
      <div class="lbl">Fecha de Ingreso</div>
      <div class="val">${esc(fecIngreso)}</div>
    </td>
  </tr>
</table>

<!-- DÍAS SOLICITADOS -->
<table style="margin-top:-1.5px;">
  <tr>
    <td style="text-align:center;font-size:12px;font-weight:bold;padding:13px 10px;">
      POR MEDIO DE LA PRESENTE, SOLICITO&nbsp;&nbsp;
      <u style="padding:0 6px;">${esc(String(dias))}</u>
      &nbsp;&nbsp;DIA(S) A CUENTA DE MIS VACACIONES
    </td>
  </tr>
</table>

<!-- FECHAS -->
<table style="margin-top:-1.5px;">
  <tr>
    <td style="width:33%;text-align:center;padding:9px 6px;">
      <div class="lbl">Fecha de Inicio de Goce de Vacaciones</div>
      <div class="val" style="text-align:center;font-size:14px;font-weight:bold;padding:6px 0;">${esc(fecInicio)}</div>
    </td>
    <td style="width:33%;text-align:center;padding:9px 6px;">
      <div class="lbl">Fecha de Finalización de Vacaciones</div>
      <div class="val" style="text-align:center;font-size:14px;font-weight:bold;padding:6px 0;">${esc(fecFinal)}</div>
    </td>
    <td style="text-align:center;padding:9px 6px;">
      <div class="lbl">Fecha Reanudacion de Labores</div>
      <div class="val" style="text-align:center;font-size:14px;font-weight:bold;padding:6px 0;">${esc(fecReanuda)}</div>
    </td>
  </tr>
</table>

<!-- USO RRHH -->
<table style="margin-top:-1.5px;">
  <tr><td class="th">PARA LLENADO EXCLUSIVO DE RRHH</td></tr>
  <tr>
    <td>
      <div class="lbl">PERIODO VACACIONAL:</div>
      <div class="val" style="min-height:22px;">${esc(periodo)}</div>
    </td>
  </tr>
</table>

<!-- FIRMAS -->
<table class="nb" style="margin-top:38px;">
  <tr>
    <td style="width:33%;text-align:center;padding:0 14px;">
      <div style="border-bottom:1.5px solid #000;height:56px;"></div>
      <div style="font-size:9.5px;font-weight:bold;margin-top:4px;">FIRMA DEL SOLICITANTE</div>
      <div style="font-size:9px;margin-top:2px;">DNI: ${esc(dni)}</div>
    </td>
    <td style="width:33%;text-align:center;padding:0 14px;">
      <div style="border-bottom:1.5px solid #000;height:56px;"></div>
      <div style="font-size:9.5px;font-weight:bold;margin-top:4px;">AUTORIZADO POR:</div>
    </td>
    <td style="width:33%;text-align:center;padding:0 14px;">
      <div style="border-bottom:1.5px solid #000;height:56px;"></div>
      <div style="font-size:9.5px;font-weight:bold;margin-top:4px;">FIRMA DE RRHH</div>
    </td>
  </tr>
</table>

<!-- NOTA -->
<div style="margin-top:22px;font-size:8.5px;font-style:italic;text-align:justify;">
  Este formulario debe ser <strong>ENTREGADO</strong> a la oficina de Recursos Humanos, antes del día que el
  colaborador <strong>INICIE</strong> su período vacacional, caso contrario se tomará como faltas y se procederá
  al descuento respectivo.
</div>

</body>
</html>`;
}

// ── HTML Compra de Vacaciones (VC) ─────────────────────────────────────────
function htmlCompraVac({ nombre, dni, cargo, area, empresa, fecIngreso, solicitud }) {
  const dias       = solicitud.num_dias ?? 0;
  const periodo    = solicitud.periodo_vac ?? String(solicitud.ano_proceso ?? '');
  const montoTotal = Number(solicitud.imp_adelanto ?? 0);
  const descuento  = Number(solicitud.descuento_afp ?? 0);
  const montoRecibe = Math.max(0, montoTotal - descuento);
  const fmt2 = (v) => v.toFixed(2);

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Compra de Vacaciones</title>
  <style>${CSS}</style>
</head>
<body>

<!-- CABECERA -->
<table>
  <tr>
    ${LOGO}
    <td style="text-align:center;font-size:19px;font-weight:bold;vertical-align:middle;">
      COMPRA DE VACACIONES
    </td>
  </tr>
</table>

<!-- DATOS -->
<table style="margin-top:-1.5px;">
  <tr>
    <td>
      <div class="lbl">Empresa</div>
      <div class="val">${esc(empresa)}</div>
    </td>
  </tr>
  <tr>
    <td>
      <div class="lbl">Apellidos y Nombres</div>
      <div class="val">${esc(nombre)}</div>
    </td>
  </tr>
  <tr>
    <td>
      <div class="lbl">Cargo</div>
      <div class="val">${esc(cargo)}</div>
    </td>
  </tr>
</table>

<table style="margin-top:-1.5px;">
  <tr>
    <td style="width:45%;">
      <div class="lbl">Área</div>
      <div class="val">${esc(area)}</div>
    </td>
    <td style="width:30%;">
      <div class="lbl">Fecha de Ingreso</div>
      <div class="val">${esc(fecIngreso)}</div>
    </td>
    <td>
      <div class="lbl">DNI</div>
      <div class="val">${esc(dni)}</div>
    </td>
  </tr>
</table>

<table style="margin-top:-1.5px;">
  <tr>
    <td>
      <div class="lbl">Cantidad de Días Vendidos</div>
      <div class="val" style="font-size:16px;font-weight:bold;">${esc(String(dias))}</div>
    </td>
  </tr>
  <tr>
    <td>
      <div class="lbl">Periodo:</div>
      <div class="val">${esc(periodo)}</div>
    </td>
  </tr>
  <tr>
    <td>
      <div class="lbl">Monto Total a Vender: S/.</div>
      <div class="val" style="font-size:14px;font-weight:bold;">${montoTotal > 0 ? fmt2(montoTotal) : ''}</div>
    </td>
  </tr>
  <tr>
    <td>
      <div class="lbl">Descuento AFP/ONP: S/.</div>
      <div class="val" style="font-size:14px;font-weight:bold;">${descuento > 0 ? fmt2(descuento) : ''}</div>
    </td>
  </tr>
  <tr>
    <td>
      <div class="lbl">Monto a Recibir: S/.</div>
      <div class="val" style="font-size:16px;font-weight:bold;color:#B11A1A;">${montoTotal > 0 ? fmt2(montoRecibe) : ''}</div>
    </td>
  </tr>
</table>

<!-- APROBACIONES -->
<table style="margin-top:-1.5px;">
  <tr><td class="th">APROBACIONES</td></tr>
</table>

<!-- FIRMAS -->
<table class="nb" style="margin-top:36px;">
  <tr>
    <td style="width:33%;text-align:center;padding:0 14px;">
      <div style="border-bottom:1.5px solid #000;height:56px;"></div>
      <div style="font-size:9.5px;font-weight:bold;margin-top:4px;">Firma del Trabajador</div>
      <div style="font-size:9px;margin-top:2px;">DNI: ${esc(dni)}</div>
    </td>
    <td style="width:33%;text-align:center;padding:0 14px;">
      <div style="border-bottom:1.5px solid #000;height:56px;"></div>
      <div style="font-size:9.5px;font-weight:bold;margin-top:4px;">VB JEFE INMEDIATO</div>
    </td>
    <td style="width:33%;text-align:center;padding:0 14px;">
      <div style="border-bottom:1.5px solid #000;height:56px;"></div>
      <div style="font-size:9.5px;font-weight:bold;margin-top:4px;">VB RRHH</div>
    </td>
  </tr>
  <tr>
    <td style="border:none;"></td>
    <td style="border:none;text-align:center;padding:28px 14px 0;">
      <div style="border-bottom:1.5px solid #000;height:44px;"></div>
      <div style="font-size:9.5px;font-weight:bold;margin-top:4px;">GERENCIA DE FINANZAS</div>
    </td>
    <td style="border:none;"></td>
  </tr>
</table>

</body>
</html>`;
}

// ── Función principal exportada ────────────────────────────────────────────
export function imprimirFormularioVac({ solicitud, empleado, user }) {
  const nombre = empleado?.nombre_completo?.trim() ||
    [user?.ape_paterno, user?.ape_materno, user?.nom_trabajador].filter(Boolean).join(' ') ||
    user?.usuario || '';

  const dni       = user?.dni || '';
  const cargo     = empleado?.cargo || '';
  const area      = empleado?.area  || '';
  const empresa   = empleado?.empresa || '';
  const sede      = empleado?.sede    || '';
  const fecIngreso = empleado?.fecha_ingreso
    ? (() => {
        const d = new Date(String(empleado.fecha_ingreso).includes('T')
          ? empleado.fecha_ingreso
          : empleado.fecha_ingreso + 'T00:00:00');
        if (isNaN(d)) return empleado.fecha_ingreso;
        return d.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
      })()
    : '';

  const hoy = new Date();
  const dSol = String(hoy.getDate()).padStart(2, '0');
  const mSol = String(hoy.getMonth() + 1).padStart(2, '0');
  const aSol = String(hoy.getFullYear());

  const html = solicitud.tipo === 'VC'
    ? htmlCompraVac({ nombre, dni, cargo, area, empresa, fecIngreso, solicitud })
    : htmlSolicitudVac({ nombre, dni, cargo, empresa, sede, fecIngreso, dSol, mSol, aSol, solicitud });

  const win = window.open('', '_blank', 'width=860,height=1000');
  if (!win) {
    alert('Habilita las ventanas emergentes en tu navegador para imprimir el formulario.');
    return;
  }
  win.document.write(html);
  win.document.close();
  win.focus();
}
