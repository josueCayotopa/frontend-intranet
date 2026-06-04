import { useEffect, useState, useRef } from 'react';
import { getVacaciones, crearSolicitudVac, cancelarVac } from '../../api/erp';

// ── Brand ──────────────────────────────────────────────────────────────────
const ROJO = '#B11A1A';
const GRIS = '#8B8889';
const ROSA = '#fde8e8';

// ── Helpers ────────────────────────────────────────────────────────────────
const calcDias = (ini, fin) => {
  if (!ini || !fin) return 0;
  const diff = Math.round((new Date(fin) - new Date(ini)) / 86400000) + 1;
  return diff > 0 ? diff : 0;
};

const addDay = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  d.setDate(d.getDate() + 1);
  return d.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const fmtPE = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const hoy = () => {
  const d = new Date();
  return {
    dia:  String(d.getDate()).padStart(2, '0'),
    mes:  String(d.getMonth() + 1).padStart(2, '0'),
    anio: String(d.getFullYear()),
  };
};

// ── Estado badge ───────────────────────────────────────────────────────────
const ESTADO_CLASE = {
  pendiente:       'bg-yellow-100 text-yellow-700',
  aprobado_jefe:   'bg-blue-100 text-blue-700',
  rechazado_jefe:  'bg-red-100 text-red-700',
  aprobado_rh:     'bg-emerald-100 text-emerald-700',
  rechazado_rh:    'bg-red-100 text-red-700',
  cancelado:       'bg-gray-100 text-gray-500',
};

// ── Logo Clínica La Luz ────────────────────────────────────────────────────
function Logo({ size = 'md' }) {
  const h = size === 'sm' ? 'h-10' : 'h-14';
  return (
    <img
      src="/logo.png"
      alt="Clínica La Luz"
      className={`${h} object-contain`}
      onError={(e) => {
        e.target.style.display = 'none';
        e.target.nextSibling.style.display = 'flex';
      }}
    />
  );
}

function LogoFallback({ size = 'md' }) {
  return (
    <div className="hidden items-center gap-1">
      <img src="/clinica_la_luz_isotipo.png" alt="" className="h-10 object-contain" />
      <div>
        <div style={{ color: GRIS, fontSize: 10 }}>Clínica</div>
        <div style={{ color: ROJO, fontWeight: 800, fontSize: size === 'sm' ? 18 : 22 }}>La Luz</div>
      </div>
    </div>
  );
}

// ── Celda de tabla del formulario oficial ──────────────────────────────────
const Td = ({ label, value, children, colSpan = 1, rowSpan = 1, noPad }) => (
  <td
    colSpan={colSpan}
    rowSpan={rowSpan}
    style={{ border: '1px solid #000', padding: noPad ? 0 : '3px 6px', verticalAlign: 'top' }}
  >
    {label && (
      <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', color: '#111', lineHeight: 1.2 }}>
        {label}
      </div>
    )}
    {value !== undefined && (
      <div style={{ fontSize: 11, minHeight: 18, paddingTop: 1 }}>{value}</div>
    )}
    {children}
  </td>
);

const ThSection = ({ children, colSpan = 1 }) => (
  <td
    colSpan={colSpan}
    style={{
      border: '1px solid #000',
      background: ROSA,
      textAlign: 'center',
      fontWeight: 700,
      fontSize: 10,
      padding: '4px 6px',
      color: '#000',
      textTransform: 'uppercase',
    }}
  >
    {children}
  </td>
);

// ── FORMULARIO GOZADAS ─────────────────────────────────────────────────────
function FormGozadas({ perfil, onClose, onSuccess }) {
  const [form, setForm] = useState({ fec_inicio: '', fec_final: '' });
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const printRef = useRef();
  const { dia, mes, anio } = hoy();

  const dias = calcDias(form.fec_inicio, form.fec_final);
  const fecReanudacion = addDay(form.fec_final);

  const handlePrint = () => {
    const css = `
      @media print {
        body > *:not(#vac-print-gozadas) { display: none !important; }
        #vac-print-gozadas { display: block !important; position: fixed; top:0; left:0; width:100%; }
        @page { size: A4; margin: 15mm; }
      }
    `;
    const style = document.createElement('style');
    style.innerHTML = css;
    document.head.appendChild(style);
    window.print();
    document.head.removeChild(style);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.fec_inicio || !form.fec_final) { setError('Completa las fechas.'); return; }
    if (dias <= 0) { setError('La fecha de fin debe ser posterior al inicio.'); return; }
    setEnviando(true);
    setError('');
    try {
      await crearSolicitudVac({ tipo: 'VG', fec_inicio: form.fec_inicio, fec_final: form.fec_final });
      onSuccess('Solicitud de vacaciones enviada correctamente.');
      onClose();
    } catch (err) {
      setError(err.response?.data?.message ?? 'Error al enviar la solicitud.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 overflow-y-auto py-6 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl">
        {/* Barra superior del modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: '#eee' }}>
          <h2 className="font-bold text-lg" style={{ color: ROJO }}>Solicitud de Vacaciones Gozadas</h2>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold border transition"
              style={{ borderColor: GRIS, color: GRIS }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Imprimir
            </button>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 font-bold">✕</button>
          </div>
        </div>

        {/* Inputs de fecha */}
        <div className="px-6 py-4 bg-gray-50 border-b flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: GRIS }}>Fecha de inicio</label>
            <input
              type="date"
              value={form.fec_inicio}
              onChange={e => setForm(f => ({ ...f, fec_inicio: e.target.value }))}
              className="px-3 py-2 rounded-xl border text-sm"
              style={{ borderColor: '#ddd' }}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: GRIS }}>Fecha de fin</label>
            <input
              type="date"
              value={form.fec_final}
              onChange={e => setForm(f => ({ ...f, fec_final: e.target.value }))}
              className="px-3 py-2 rounded-xl border text-sm"
              style={{ borderColor: '#ddd' }}
            />
          </div>
          {dias > 0 && (
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold" style={{ color: ROJO }}>{dias}</span>
              <span className="text-sm pb-1" style={{ color: GRIS }}>días</span>
            </div>
          )}
          <button
            onClick={handleSubmit}
            disabled={enviando || dias <= 0}
            className="ml-auto px-6 py-2 rounded-xl text-sm font-bold text-white disabled:opacity-50 transition"
            style={{ background: ROJO }}
          >
            {enviando ? 'Enviando…' : 'Registrar solicitud'}
          </button>
        </div>
        {error && <div className="px-6 py-2 text-sm text-red-600 bg-red-50">{error}</div>}

        {/* Formulario oficial imprimible */}
        <div id="vac-print-gozadas" ref={printRef} className="px-6 py-5" style={{ fontFamily: 'Arial, sans-serif' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <tbody>
              {/* Header */}
              <tr>
                <td colSpan={3} style={{ border: '1px solid #000', padding: '6px 10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Logo size="sm" />
                    <LogoFallback size="sm" />
                  </div>
                </td>
                <td colSpan={2} style={{ border: '1px solid #000', padding: '4px 6px', textAlign: 'center' }}>
                  <div style={{ fontSize: 9, fontWeight: 700 }}>FECHA DE SOLICITUD</div>
                  <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginTop: 4 }}>
                    {[dia, mes, anio].map((v, i) => (
                      <div key={i} style={{ border: '1px solid #000', padding: '2px 6px', minWidth: 28, textAlign: 'center', fontSize: 11 }}>{v}</div>
                    ))}
                  </div>
                </td>
              </tr>

              {/* Título */}
              <tr>
                <td colSpan={5} style={{ border: '1px solid #000', textAlign: 'center', fontWeight: 700, fontSize: 14, padding: '8px 0' }}>
                  SOLICITUD DE VACACIONES
                </td>
              </tr>

              {/* Datos personales */}
              <tr><ThSection colSpan={5}>Datos Personales</ThSection></tr>
              <tr>
                <Td label="Apellidos y Nombres" value={perfil?.nombre_completo?.trim()} colSpan={5} />
              </tr>
              <tr>
                <Td label="N° DNI" value={perfil?.dni} colSpan={2} />
                <Td label="Cargo que desempeña" value={perfil?.cargo} colSpan={3} />
              </tr>

              {/* Datos generales */}
              <tr><ThSection colSpan={5}>Datos Generales</ThSection></tr>
              <tr>
                <Td label="Empresa" value={perfil?.empresa} colSpan={5} />
              </tr>
              <tr>
                <Td label="Sede / Área" value={perfil?.area} colSpan={2} />
                <Td label="Fecha de ingreso" value={perfil?.fecha_ingreso ? fmtPE(perfil.fecha_ingreso) : ''} colSpan={3} />
              </tr>

              {/* Solicitud */}
              <tr>
                <td colSpan={5} style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'center', fontWeight: 600, fontSize: 11 }}>
                  POR MEDIO DE LA PRESENTE, SOLICITO{' '}
                  <span style={{ display: 'inline-block', borderBottom: '1px solid #000', minWidth: 40, textAlign: 'center', fontWeight: 700, color: ROJO }}>
                    {dias > 0 ? dias : '___'}
                  </span>{' '}
                  DÍA(S) A CUENTA DE MIS VACACIONES
                </td>
              </tr>
              <tr>
                <Td label="Fecha de inicio de goce de vacaciones" value={form.fec_inicio ? fmtPE(form.fec_inicio) : ''} colSpan={2} />
                <Td label="Fecha de finalización de vacaciones" value={form.fec_final ? fmtPE(form.fec_final) : ''} colSpan={2} />
                <Td label="Fecha reanudación de labores" value={fecReanudacion} colSpan={1} />
              </tr>

              {/* RRHH */}
              <tr><ThSection colSpan={5}>Para llenado exclusivo de RRHH</ThSection></tr>
              <tr>
                <td colSpan={5} style={{ border: '1px solid #000', padding: '4px 8px' }}>
                  <span style={{ fontWeight: 700, fontSize: 10 }}>PERIODO VACACIONAL: </span>
                  <span style={{ display: 'inline-block', minHeight: 22, minWidth: 200 }} />
                </td>
              </tr>
            </tbody>
          </table>

          {/* Nota */}
          <p style={{ fontSize: 9, marginTop: 12, fontStyle: 'italic', color: '#444' }}>
            Este formulario debe ser <strong>ENTREGADO</strong> a la oficina de Recursos Humanos, antes del día que el colaborador{' '}
            <strong>INICIE</strong> su periodo vacacional, caso contrario se tomará como faltas y se procederá al descuento respectivo.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── FORMULARIO COMPRA ──────────────────────────────────────────────────────
function FormCompra({ perfil, onClose, onSuccess }) {
  const [form, setForm] = useState({ fec_inicio: '', fec_final: '', num_dias: '' });
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');

  const handlePrint = () => {
    const css = `
      @media print {
        body > *:not(#vac-print-compra) { display: none !important; }
        #vac-print-compra { display: block !important; position: fixed; top:0; left:0; width:100%; }
        @page { size: A4; margin: 15mm; }
      }
    `;
    const style = document.createElement('style');
    style.innerHTML = css;
    document.head.appendChild(style);
    window.print();
    document.head.removeChild(style);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.fec_inicio || !form.fec_final || !form.num_dias) { setError('Completa todos los campos.'); return; }
    if (parseInt(form.num_dias) < 1 || parseInt(form.num_dias) > 15) { setError('Los días deben estar entre 1 y 15.'); return; }
    setEnviando(true);
    setError('');
    try {
      await crearSolicitudVac({ tipo: 'VC', fec_inicio: form.fec_inicio, fec_final: form.fec_final });
      onSuccess('Solicitud de compra de vacaciones enviada correctamente.');
      onClose();
    } catch (err) {
      setError(err.response?.data?.message ?? 'Error al enviar la solicitud.');
    } finally {
      setEnviando(false);
    }
  };

  const periodoTexto = form.fec_inicio && form.fec_final
    ? `${fmtPE(form.fec_inicio)} al ${fmtPE(form.fec_final)}`
    : '';

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 overflow-y-auto py-6 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl">
        {/* Barra */}
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: '#eee' }}>
          <h2 className="font-bold text-lg" style={{ color: ROJO }}>Compra de Vacaciones</h2>
          <div className="flex gap-2">
            <button onClick={handlePrint} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold border transition" style={{ borderColor: GRIS, color: GRIS }}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Imprimir
            </button>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 font-bold">✕</button>
          </div>
        </div>

        {/* Inputs */}
        <div className="px-6 py-4 bg-gray-50 border-b flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: GRIS }}>Período: Desde</label>
            <input type="date" value={form.fec_inicio} onChange={e => setForm(f => ({ ...f, fec_inicio: e.target.value }))} className="px-3 py-2 rounded-xl border text-sm" style={{ borderColor: '#ddd' }} />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: GRIS }}>Hasta</label>
            <input type="date" value={form.fec_final} onChange={e => setForm(f => ({ ...f, fec_final: e.target.value }))} className="px-3 py-2 rounded-xl border text-sm" style={{ borderColor: '#ddd' }} />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: GRIS }}>Días a vender (máx. 15)</label>
            <input type="number" min={1} max={15} value={form.num_dias} onChange={e => setForm(f => ({ ...f, num_dias: e.target.value }))} placeholder="0" className="px-3 py-2 rounded-xl border text-sm w-24" style={{ borderColor: '#ddd' }} />
          </div>
          <button onClick={handleSubmit} disabled={enviando} className="ml-auto px-6 py-2 rounded-xl text-sm font-bold text-white disabled:opacity-50 transition" style={{ background: ROJO }}>
            {enviando ? 'Enviando…' : 'Registrar solicitud'}
          </button>
        </div>
        {error && <div className="px-6 py-2 text-sm text-red-600 bg-red-50">{error}</div>}

        {/* Formulario oficial imprimible */}
        <div id="vac-print-compra" className="px-6 py-5" style={{ fontFamily: 'Arial, sans-serif' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <tbody>
              {/* Header */}
              <tr>
                <td colSpan={2} style={{ border: '1px solid #000', padding: '8px 12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Logo size="sm" /><LogoFallback size="sm" />
                    <span style={{ fontWeight: 800, fontSize: 18, color: ROJO, marginLeft: 8 }}>COMPRA DE VACACIONES</span>
                  </div>
                </td>
              </tr>

              {/* Campos */}
              <tr><Td label="Empresa" value={perfil?.empresa} colSpan={2} /></tr>
              <tr><Td label="Apellidos y Nombres" value={perfil?.nombre_completo?.trim()} colSpan={2} /></tr>
              <tr><Td label="Cargo" value={perfil?.cargo} colSpan={2} /></tr>
              <tr>
                <Td label="Área / Sede" value={perfil?.area} />
                <Td label="Fecha de ingreso" value={perfil?.fecha_ingreso ? fmtPE(perfil.fecha_ingreso) : ''} />
              </tr>
              <tr>
                <Td label="Cantidad de días vendidos" value={form.num_dias || ''} colSpan={2} />
              </tr>
              <tr>
                <Td label="Período" value={periodoTexto} colSpan={2} />
              </tr>

              {/* Montos — llenado por RRHH */}
              <tr>
                <td colSpan={2} style={{ border: '1px solid #000', padding: '4px 8px' }}>
                  <span style={{ fontWeight: 700, fontSize: 10 }}>MONTO TOTAL A VENDER: S/.</span>
                  <span style={{ display: 'inline-block', minWidth: 120 }} />
                </td>
              </tr>
              <tr>
                <td colSpan={2} style={{ border: '1px solid #000', padding: '4px 8px' }}>
                  <span style={{ fontWeight: 700, fontSize: 10 }}>DESCUENTO AFP/ONP: S/.</span>
                  <span style={{ display: 'inline-block', minWidth: 120 }} />
                </td>
              </tr>
              <tr>
                <td colSpan={2} style={{ border: '1px solid #000', padding: '4px 8px' }}>
                  <span style={{ fontWeight: 700, fontSize: 10 }}>MONTO A RECIBIR: S/.</span>
                  <span style={{ display: 'inline-block', minWidth: 120 }} />
                </td>
              </tr>

              {/* Aprobaciones */}
              <tr>
                <td colSpan={2} style={{ border: '1px solid #000', background: '#f0f0f0', textAlign: 'center', fontWeight: 700, fontSize: 10, padding: '4px' }}>
                  APROBACIONES
                </td>
              </tr>
              <tr>
                <td colSpan={2} style={{ border: '1px solid #000', padding: '30px 8px 8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-around', fontSize: 9, textAlign: 'center' }}>
                    <div><div style={{ borderTop: '1px solid #000', width: 140, marginBottom: 4 }} /><div>Firma del Trabajador</div><div>DNI:</div></div>
                    <div><div style={{ borderTop: '1px solid #000', width: 140, marginBottom: 4 }} /><div>VB Jefe Inmediato</div></div>
                    <div><div style={{ borderTop: '1px solid #000', width: 140, marginBottom: 4 }} /><div>VB RRHH</div></div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── COMPONENTE PRINCIPAL ───────────────────────────────────────────────────
export default function MisVacaciones() {
  const [vacData, setVacData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // 'gozadas' | 'compra' | null
  const [mensaje, setMensaje] = useState(null);

  // Los datos del empleado vienen dentro de /api/vacaciones — una sola llamada
  const empleado = vacData?.empleado ?? null;

  const cargar = () => {
    setLoading(true);
    getVacaciones()
      .then(({ data }) => setVacData(data?.data ?? null))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { cargar(); }, []);

  const onSuccess = (msg) => {
    setMensaje(msg);
    cargar();
    setTimeout(() => setMensaje(null), 5000);
  };

  const cancelarSolicitud = async (cod) => {
    if (!confirm('¿Cancelar esta solicitud?')) return;
    try {
      await cancelarVac(cod);
      onSuccess('Solicitud cancelada correctamente.');
    } catch {
      setMensaje('No se pudo cancelar la solicitud.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header con color de marca */}
      <div className="px-6 py-6 md:px-10" style={{ background: ROJO }}>
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Mis Vacaciones</h1>
            <p className="text-red-200 text-sm mt-0.5">Gestiona tus solicitudes de vacaciones</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setModal('gozadas')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-white transition hover:bg-red-50"
              style={{ color: ROJO }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Solicitar Gozadas
            </button>
            <button
              onClick={() => setModal('compra')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white border-2 border-white transition hover:bg-white/10"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Compra de Vacaciones
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-10 py-6 space-y-5">
        {/* Mensaje */}
        {mensaje && (
          <div className="rounded-2xl px-5 py-3 text-sm font-medium border" style={{ background: '#f0fdf4', borderColor: '#bbf7d0', color: '#166534' }}>
            {mensaje}
          </div>
        )}

        {/* Resumen */}
        {!loading && vacData && (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 text-center">
              <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: GRIS }}>Días gozados {vacData.ano_actual}</p>
              <p className="text-5xl font-bold" style={{ color: ROJO }}>{vacData.dias_gozados_anio}</p>
            </div>
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 text-center">
              <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: GRIS }}>Días pendientes aprobación</p>
              <p className="text-5xl font-bold text-yellow-500">{vacData.dias_pendientes}</p>
            </div>
          </div>
        )}

        {/* Historial */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wide" style={{ color: GRIS }}>Historial de Solicitudes</h2>
          </div>

          {loading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="h-14 bg-gray-50 rounded-xl animate-pulse" />)}
            </div>
          ) : !vacData?.historial?.length ? (
            <div className="p-12 text-center text-gray-400">No hay solicitudes registradas.</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {vacData.historial.map((v) => (
                <div key={`${v.cod_corr_vac}-${v.ano_proceso}`} className="px-6 py-4 flex items-center justify-between gap-3 hover:bg-gray-50 transition">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: v.tipo === 'VG' ? ROJO : GRIS }}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800">
                        {v.fec_inicio} — {v.fec_final}
                        <span className="text-gray-400 font-normal ml-2">({v.num_dias} días)</span>
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: GRIS }}>{v.tipo_label} · {v.ano_proceso}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${ESTADO_CLASE[v.estado] ?? 'bg-gray-100 text-gray-500'}`}>
                      {v.estado_label}
                    </span>
                    {v.cancelable && (
                      <button onClick={() => cancelarSolicitud(v.cod_corr_vac)} className="text-xs font-medium hover:opacity-80" style={{ color: ROJO }}>
                        Cancelar
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modales — los datos del empleado vienen de vacData.empleado */}
      {modal === 'gozadas' && (
        <FormGozadas perfil={empleado} onClose={() => setModal(null)} onSuccess={onSuccess} />
      )}
      {modal === 'compra' && (
        <FormCompra perfil={empleado} onClose={() => setModal(null)} onSuccess={onSuccess} />
      )}
    </div>
  );
}
