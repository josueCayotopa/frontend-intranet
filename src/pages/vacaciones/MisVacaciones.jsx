import { useEffect, useState } from 'react';
import { getVacaciones, getSolicitudesVac, crearSolicitudVac, cancelarSolVac, getConfigVac } from '../../api/erp';
import { useAuth } from '../../hooks/useAuth';
import { imprimirFormularioVac } from '../../utils/formulariosVac';

const ROJO  = '#B11A1A';
const VERDE = '#059669';
const GRIS  = '#8B8889';

const TIPO_LABEL = {
  VG: 'Vacaciones Gozadas',
  VC: 'Compra de Vacaciones',
  VN: 'Vacaciones Normales',
};

const TIPO_COLOR = {
  VG: { bg: '#fef2f2', text: ROJO },
  VC: { bg: '#eff6ff', text: '#1d4ed8' },
  VN: { bg: '#f0fdf4', text: '#065f46' },
};

const ESTADO_STYLE = {
  pendiente:      { bg: '#fef9c3', text: '#854d0e' },
  aprobado_jefe:  { bg: '#dbeafe', text: '#1e40af' },
  rechazado_jefe: { bg: '#fee2e2', text: '#991b1b' },
  aprobado_rh:    { bg: '#d1fae5', text: '#065f46' },
  rechazado_rh:   { bg: '#fee2e2', text: '#991b1b' },
  cancelado:      { bg: '#f3f4f6', text: '#6b7280' },
};

const ESTADO_LABEL = {
  pendiente:      'Pendiente',
  aprobado_jefe:  'Aprobado por Jefe',
  rechazado_jefe: 'Rechazado por Jefe',
  aprobado_rh:    'Aprobado por RRHH',
  rechazado_rh:   'Rechazado por RRHH',
  cancelado:      'Cancelado',
};

// ── Cálculo de vacaciones (30 días por cada año completo cumplido; el año en curso no acumula días hasta completarse) ─
function calcularVac(fechaIngresoRaw, historial) {
  if (!fechaIngresoRaw) return null;
  const ingreso = new Date(fechaIngresoRaw);
  if (isNaN(ingreso)) return null;

  const hoy   = new Date();
  let anios   = hoy.getFullYear() - ingreso.getFullYear();
  let meses   = hoy.getMonth()    - ingreso.getMonth();
  if (hoy.getDate() < ingreso.getDate()) meses--;
  if (meses < 0) { anios--; meses += 12; }
  anios = Math.max(0, anios);

  const diasAcumulados = anios * 30;
  const diasUsados     = (historial ?? []).reduce((s, v) => s + (v.num_dias || 0), 0);
  const saldo          = diasAcumulados - diasUsados;

  return { anios, meses, diasAcumulados, diasUsados, saldo };
}

function fmtFecha(raw) {
  if (!raw) return '—';
  const d = new Date(raw);
  if (isNaN(d)) return raw;
  return d.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

const calcDias = (ini, fin) => {
  if (!ini || !fin) return 0;
  const diff = Math.round((new Date(fin) - new Date(ini)) / 86400000) + 1;
  return diff > 0 ? diff : 0;
};

// ── Ui helpers ───────────────────────────────────────────────────────────────
function Skel({ h = 'h-14' }) {
  return <div className={`${h} bg-gray-50 rounded-xl animate-pulse`} />;
}

function Campo({ label, children }) {
  return (
    <div>
      <span className="block text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: GRIS }}>
        {label}
      </span>
      {children}
    </div>
  );
}

function DatoFijo({ label, value }) {
  return (
    <div className="bg-white rounded-xl px-3 py-2.5 border border-gray-100">
      <div className="text-[10px] font-bold uppercase tracking-wide mb-0.5" style={{ color: GRIS }}>{label}</div>
      <div className="text-sm font-medium text-gray-800 truncate">{value || '—'}</div>
    </div>
  );
}

function EstadoBadge({ estado }) {
  const s = ESTADO_STYLE[estado] ?? { bg: '#f3f4f6', text: '#6b7280' };
  return (
    <span
      className="text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap"
      style={{ background: s.bg, color: s.text }}
    >
      {ESTADO_LABEL[estado] ?? estado}
    </span>
  );
}

function FlujoEstado({ estado }) {
  const pasos = [
    { clave: 'pendiente',     label: 'Pendiente' },
    { clave: 'aprobado_jefe', label: 'Jefe' },
    { clave: 'aprobado_rh',   label: 'RRHH' },
  ];
  const rechazados = new Set(['rechazado_jefe', 'rechazado_rh', 'cancelado']);
  const idx = pasos.findIndex(p => p.clave === estado);
  const esRechazado = rechazados.has(estado);

  return (
    <div className="flex items-center gap-1">
      {pasos.map((paso, i) => {
        const activo = !esRechazado && i <= idx;
        const actual = !esRechazado && i === idx;
        return (
          <div key={paso.clave} className="flex items-center gap-1">
            <div
              className="w-2 h-2 rounded-full shrink-0"
              style={{ background: activo ? (actual ? ROJO : '#10b981') : '#d1d5db' }}
            />
            {i < pasos.length - 1 && (
              <div className="w-5 h-px" style={{ background: activo ? '#10b981' : '#e5e7eb' }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Calculadora + historial RRHH ─────────────────────────────────────────────
function SeccionVacAprobadas({ vacData, loading }) {
  if (loading) {
    return (
      <div className="p-5 space-y-3">
        <Skel h="h-32" />
        {[1, 2, 3].map(i => <Skel key={i} />)}
      </div>
    );
  }

  const historial    = vacData?.historial ?? [];
  const empleado     = vacData?.empleado  ?? {};
  const calc         = calcularVac(empleado.fecha_ingreso, historial);
  const saldoPositivo = (calc?.saldo ?? 0) >= 0;

  return (
    <div>
      {/* ── Calculadora ── */}
      <div className="p-5">
        <div className="rounded-2xl overflow-hidden border border-gray-100">

          {/* Fila superior: ingreso + tiempo */}
          <div className="grid grid-cols-2 divide-x divide-gray-100 bg-gray-50">
            <div className="px-5 py-4">
              <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: GRIS }}>
                Fecha de ingreso
              </p>
              <p className="text-base font-bold text-gray-800">{fmtFecha(empleado.fecha_ingreso)}</p>
            </div>
            <div className="px-5 py-4">
              <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: GRIS }}>
                Tiempo de servicio
              </p>
              {calc ? (
                <p className="text-base font-bold text-gray-800">
                  {calc.anios} año{calc.anios !== 1 ? 's' : ''}
                  {calc.meses > 0 && `, ${calc.meses} mes${calc.meses !== 1 ? 'es' : ''}`}
                </p>
              ) : (
                <p className="text-sm text-gray-400">Sin datos</p>
              )}
            </div>
          </div>

          {/* Fila inferior: los tres números clave */}
          <div className="grid grid-cols-3 divide-x divide-gray-100">

            {/* Días acumulados */}
            <div className="px-5 py-5 text-center">
              <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: GRIS }}>
                Acumulados
              </p>
              <p className="text-4xl font-black text-gray-800">
                {calc ? calc.diasAcumulados : '—'}
              </p>
              <p className="text-xs mt-1 font-medium" style={{ color: GRIS }}>días</p>
              <p className="text-[10px] mt-1" style={{ color: GRIS }}>30 días / año</p>
            </div>

            {/* Días gozados */}
            <div className="px-5 py-5 text-center">
              <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: GRIS }}>
                Gozados
              </p>
              <p className="text-4xl font-black" style={{ color: ROJO }}>
                {calc ? calc.diasUsados : '—'}
              </p>
              <p className="text-xs mt-1 font-medium" style={{ color: GRIS }}>días</p>
              <p className="text-[10px] mt-1" style={{ color: GRIS }}>registrados RRHH</p>
            </div>

            {/* Saldo */}
            <div
              className="px-5 py-5 text-center rounded-br-none"
              style={calc ? { background: saldoPositivo ? '#f0fdf4' : '#fef2f2' } : {}}
            >
              <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: GRIS }}>
                Saldo
              </p>
              <p
                className="text-4xl font-black"
                style={{ color: calc ? (saldoPositivo ? VERDE : ROJO) : GRIS }}
              >
                {calc ? Math.abs(calc.saldo) : '—'}
              </p>
              <p className="text-xs mt-1 font-medium" style={{ color: GRIS }}>días</p>
              {calc && (
                <p
                  className="text-[10px] mt-1 font-semibold"
                  style={{ color: saldoPositivo ? VERDE : ROJO }}
                >
                  {saldoPositivo ? '✓ disponible' : '● excedido'}
                </p>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* ── Historial RRHH ── */}
      <div className="border-t border-gray-100">
        <div className="px-5 py-3 flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-wide" style={{ color: GRIS }}>
            Registros validados por RRHH
          </p>
          {historial.length > 0 && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
              {historial.length} registro{historial.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {historial.length === 0 ? (
          <div className="py-10 text-center text-sm text-gray-400">
            No hay vacaciones registradas en planilla.
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {historial.map((v) => {
              const tc = TIPO_COLOR[v.tipo] ?? { bg: '#f9fafb', text: '#374151' };
              return (
                <div
                  key={`${v.cod_corr_vac}-${v.ano_proceso}`}
                  className="px-5 py-4 flex items-center gap-4 hover:bg-gray-50 transition"
                >
                  {/* Tipo pill */}
                  <span
                    className="text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0 uppercase tracking-wide"
                    style={{ background: tc.bg, color: tc.text }}
                  >
                    {v.tipo}
                  </span>

                  {/* Fechas + año */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800">
                      {v.fec_inicio} — {v.fec_final}
                    </p>
                    <p className="text-xs mt-0.5 font-medium" style={{ color: GRIS }}>
                      {TIPO_LABEL[v.tipo] ?? v.tipo}
                      {v.ano_proceso && ` · ${v.ano_proceso}/${String(v.mes_proceso).padStart(2,'0')}`}
                    </p>
                  </div>

                  {/* Días */}
                  <div className="text-right shrink-0">
                    <p className="text-xl font-black" style={{ color: ROJO }}>{v.num_dias}</p>
                    <p className="text-[10px] font-medium" style={{ color: GRIS }}>días</p>
                  </div>

                  {/* Importe si existe */}
                  {v.importe > 0 && (
                    <div className="text-right shrink-0 hidden sm:block">
                      <p className="text-sm font-semibold text-gray-700">S/. {v.importe.toFixed(2)}</p>
                      <p className="text-[10px]" style={{ color: GRIS }}>importe</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Icono impresora ───────────────────────────────────────────────────────────
function IconoPrint() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
    </svg>
  );
}

// ── Solicitudes intranet ─────────────────────────────────────────────────────
function SeccionSolicitudes({ solicitudes, loading, onCancelar, onImprimir }) {
  if (loading) return (
    <div className="p-4 space-y-2">
      {[1, 2, 3].map(i => <Skel key={i} />)}
    </div>
  );

  if (!solicitudes?.length) return (
    <div className="py-14 text-center text-sm text-gray-400">
      No tienes solicitudes registradas.
    </div>
  );

  return (
    <div className="divide-y divide-gray-50">
      {solicitudes.map((s) => (
        <div
          key={`${s.cod_corr_sol}-${s.ano_proceso}`}
          className="px-5 py-4 hover:bg-gray-50 transition"
        >
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold text-gray-800">
                  {s.fec_inicio} — {s.fec_final}
                </span>
                <span className="text-xs text-gray-400">
                  ({s.num_dias} día{s.num_dias !== 1 ? 's' : ''})
                </span>
              </div>
              <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                <span className="text-xs font-medium" style={{ color: GRIS }}>
                  {TIPO_LABEL[s.tipo] ?? s.tipo} · {s.ano_proceso}
                </span>
                <FlujoEstado estado={s.estado} />
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <EstadoBadge estado={s.estado} />

              {/* Botón imprimir formulario */}
              <button
                onClick={() => onImprimir(s)}
                title={s.tipo === 'VC' ? 'Descargar Compra de Vacaciones' : 'Descargar Solicitud de Vacaciones'}
                className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg border transition hover:bg-gray-100"
                style={{ color: GRIS, borderColor: '#e5e7eb' }}
              >
                <IconoPrint />
                <span className="hidden sm:inline">Descargar</span>
              </button>

              {s.cancelable && (
                <button
                  onClick={() => onCancelar(s.cod_corr_sol)}
                  className="text-xs font-medium px-3 py-1 rounded-lg border transition hover:bg-red-50"
                  style={{ color: ROJO, borderColor: '#fecaca' }}
                >
                  Cancelar
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Modal nueva solicitud ────────────────────────────────────────────────────
function SolicitudVacForm({ empleado, user, configVac, onClose, onSuccess }) {
  const [form, setForm] = useState({
    tipo:               'VG',
    fec_inicio:         '',
    fec_final:          '',
    imp_adelanto_vacac: '',
    descuento_afp:      '',
  });
  const [enviando, setEnviando] = useState(false);
  const [error,    setError]    = useState('');

  const set  = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));
  const dias = calcDias(form.fec_inicio, form.fec_final);

  const limiteAnio      = configVac?.limite_dias_anio ?? null;
  const diasUsadosAnio  = configVac?.dias_usados_anio ?? 0;
  const diasDisponibles = limiteAnio !== null ? Math.max(0, limiteAnio - diasUsadosAnio) : null;

  const nombreCompleto =
    empleado?.nombre_completo?.trim() ||
    [user?.ape_paterno, user?.ape_materno, user?.nom_trabajador].filter(Boolean).join(' ') ||
    user?.usuario || '—';

  const handleSubmit = async () => {
    if (!form.fec_inicio || !form.fec_final) { setError('Ingresa las fechas de inicio y fin.'); return; }
    if (dias <= 0) { setError('La fecha de fin debe ser igual o posterior a la de inicio.'); return; }
    if (diasDisponibles !== null && dias > diasDisponibles) {
      setError(`Superas el límite anual. Solo tienes ${diasDisponibles} día${diasDisponibles !== 1 ? 's' : ''} disponibles este año (${diasUsadosAnio} de ${limiteAnio} usados).`);
      return;
    }

    const d = new Date(form.fec_inicio + 'T00:00:00');
    const payload = {
      tipo:               form.tipo,
      fec_inicio:         form.fec_inicio,
      fec_final:          form.fec_final,
      ano_proceso:        d.getFullYear(),
      mes_proceso:        d.getMonth() + 1,
      imp_adelanto_vacac: form.imp_adelanto_vacac ? parseFloat(form.imp_adelanto_vacac) : undefined,
      descuento_afp:      form.descuento_afp      ? parseFloat(form.descuento_afp)      : undefined,
    };

    setEnviando(true);
    setError('');
    try {
      await crearSolicitudVac(payload);
      onSuccess('Solicitud registrada correctamente.');
      onClose();
    } catch (err) {
      setError(err.response?.data?.message ?? 'Error al registrar la solicitud.');
    } finally {
      setEnviando(false);
    }
  };

  const esVC = form.tipo === 'VC';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">

        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-base" style={{ color: ROJO }}>Nueva solicitud de vacaciones</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 text-sm font-bold"
          >
            ✕
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          <Campo label="Tipo de solicitud">
            <div className="flex gap-2">
              {[
                { val: 'VG', txt: 'Gozar' },
                { val: 'VC', txt: 'Comprar' },
              ].map(({ val, txt }) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, tipo: val }))}
                  className="px-4 py-2 rounded-xl text-sm font-semibold border transition"
                  style={form.tipo === val
                    ? { background: ROJO, color: '#fff', borderColor: ROJO }
                    : { background: '#fff', color: GRIS, borderColor: '#ddd' }}
                >
                  {txt}
                </button>
              ))}
            </div>
          </Campo>

          <div className="grid grid-cols-2 gap-2.5">
            <DatoFijo label="Nombre"  value={nombreCompleto} />
            <DatoFijo label="Cargo"   value={empleado?.cargo} />
            <DatoFijo label="Área"    value={empleado?.area} />
            <DatoFijo label="Empresa" value={empleado?.empresa} />
          </div>

          <div className="flex gap-4 items-end flex-wrap">
            <Campo label="Fecha inicio">
              <input
                type="date"
                value={form.fec_inicio}
                onChange={set('fec_inicio')}
                className="px-3 py-2 rounded-xl border text-sm"
                style={{ borderColor: '#ddd' }}
              />
            </Campo>
            <Campo label="Fecha fin">
              <input
                type="date"
                value={form.fec_final}
                min={form.fec_inicio || undefined}
                onChange={set('fec_final')}
                className="px-3 py-2 rounded-xl border text-sm"
                style={{ borderColor: '#ddd' }}
              />
            </Campo>
            {dias > 0 && (
              <div className="flex items-end gap-1 pb-0.5">
                <span className="text-3xl font-black" style={{ color: ROJO }}>{dias}</span>
                <span className="text-sm pb-0.5" style={{ color: GRIS }}>días</span>
              </div>
            )}
          </div>

          {esVC && (
            <div className="flex flex-wrap gap-4">
              <Campo label="Adelanto Vacac. S/.">
                <input
                  type="number" min={0} step="0.01"
                  value={form.imp_adelanto_vacac}
                  onChange={set('imp_adelanto_vacac')}
                  placeholder="0.00"
                  className="px-3 py-2 rounded-xl border text-sm w-28"
                  style={{ borderColor: '#ddd' }}
                />
              </Campo>
              <Campo label="Descuento AFP S/.">
                <input
                  type="number" min={0} step="0.01"
                  value={form.descuento_afp}
                  onChange={set('descuento_afp')}
                  placeholder="0.00"
                  className="px-3 py-2 rounded-xl border text-sm w-28"
                  style={{ borderColor: '#ddd' }}
                />
              </Campo>
            </div>
          )}

          {/* Límite anual si está configurado */}
          {limiteAnio !== null && (
            <div className="rounded-xl px-4 py-3 text-xs border" style={{ background: '#eff6ff', borderColor: '#bfdbfe', color: '#1e40af' }}>
              <div className="flex justify-between mb-1">
                <span>Límite anual</span>
                <span className="font-bold">
                  {diasUsadosAnio + (dias > 0 ? dias : 0)} / {limiteAnio} días
                  {dias > 0 && diasDisponibles !== null && dias <= diasDisponibles && (
                    <span className="ml-1 text-green-600">✓</span>
                  )}
                  {dias > 0 && diasDisponibles !== null && dias > diasDisponibles && (
                    <span className="ml-1" style={{ color: ROJO }}>excedido</span>
                  )}
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-blue-100 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, Math.round((diasUsadosAnio + (dias > 0 ? dias : 0)) / limiteAnio * 100))}%`,
                    background: (diasUsadosAnio + (dias > 0 ? dias : 0)) > limiteAnio ? ROJO : '#3b82f6',
                  }}
                />
              </div>
            </div>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold border transition"
              style={{ borderColor: '#ddd', color: GRIS }}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={enviando || dias <= 0 || (diasDisponibles !== null && dias > diasDisponibles)}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50 transition active:scale-95"
              style={{ background: ROJO }}
            >
              {enviando ? 'Registrando…' : 'Registrar solicitud'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Página principal ─────────────────────────────────────────────────────────
export default function MisVacaciones() {
  const { user, empresa } = useAuth();

  const [vacData,     setVacData]     = useState(null);
  const [solicitudes, setSolicitudes] = useState([]);
  const [configVac,   setConfigVac]   = useState({ habilitado: true, limite_dias_anio: null, dias_usados_anio: 0 });
  const [loadingVac,  setLoadingVac]  = useState(true);
  const [loadingSol,  setLoadingSol]  = useState(true);
  const [tab,         setTab]         = useState('aprobadas');
  const [modal,       setModal]       = useState(false);
  const [mensaje,     setMensaje]     = useState(null);
  const [exito,       setExito]       = useState(true);

  const empleado = vacData?.empleado ?? null;

  const cargarVac = () => {
    setLoadingVac(true);
    getVacaciones()
      .then(({ data }) => setVacData(data?.data ?? null))
      .catch(() => {})
      .finally(() => setLoadingVac(false));
  };

  const cargarSol = () => {
    setLoadingSol(true);
    getSolicitudesVac()
      .then(({ data }) => setSolicitudes(data?.data ?? []))
      .catch(() => setSolicitudes([]))
      .finally(() => setLoadingSol(false));
  };

  const cargarConfig = () => {
    getConfigVac()
      .then(({ data }) => setConfigVac(data?.data ?? { habilitado: true, limite_dias_anio: null, dias_usados_anio: 0 }))
      .catch(() => {});
  };

  useEffect(() => {
    cargarVac();
    cargarSol();
    cargarConfig();
  }, []);

  const mostrarMensaje = (msg, ok = true) => {
    setExito(ok);
    setMensaje(msg);
    setTimeout(() => setMensaje(null), 5000);
  };

  const onSuccess = (msg) => {
    mostrarMensaje(msg, true);
    cargarSol();
    cargarVac();
  };

  const cancelarSolicitud = async (codCorrSol) => {
    if (!confirm('¿Cancelar esta solicitud?')) return;
    try {
      await cancelarSolVac(codCorrSol);
      mostrarMensaje('Solicitud cancelada correctamente.', true);
      cargarSol();
      cargarVac();
    } catch (err) {
      mostrarMensaje(err.response?.data?.message ?? 'No se pudo cancelar la solicitud.', false);
    }
  };

  // Saldo rápido para el stat card superior
  const calc = calcularVac(empleado?.fecha_ingreso, vacData?.historial);

  const tabs = [
    { id: 'aprobadas',   label: 'Mis Vacaciones' },
    { id: 'solicitudes', label: 'Solicitudes',    count: solicitudes.length },
  ];

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Header ── */}
      <div className="px-6 py-6 md:px-10" style={{ background: ROJO }}>
        <div className="max-w-4xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Mis Vacaciones</h1>
            <p className="text-red-200 text-sm mt-0.5">
              {calc
                ? `${calc.saldo >= 0 ? calc.saldo + ' días disponibles' : Math.abs(calc.saldo) + ' días excedidos'} · ${calc.diasUsados} gozados`
                : 'Consulta tu saldo y solicitudes de vacaciones'}
            </p>
          </div>
          <button
            onClick={() => configVac.habilitado && setModal(true)}
            disabled={!configVac.habilitado}
            title={!configVac.habilitado ? 'No tienes habilitadas las solicitudes de vacaciones. Contacta a RRHH.' : undefined}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-white transition hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ color: ROJO }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nueva solicitud
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-10 py-6 space-y-5">

        {/* ── Alerta ── */}
        {mensaje && (
          <div
            className="rounded-2xl px-5 py-3 text-sm font-medium border"
            style={exito
              ? { background: '#f0fdf4', borderColor: '#bbf7d0', color: '#166534' }
              : { background: '#fef2f2', borderColor: '#fecaca', color: '#991b1b' }}
          >
            {mensaje}
          </div>
        )}

        {/* ── Aviso: vacaciones no habilitadas ── */}
        {!configVac.habilitado && (
          <div
            className="rounded-2xl px-5 py-3 text-sm font-medium border flex items-center gap-2"
            style={{ background: '#fffbeb', borderColor: '#fde68a', color: '#92400e' }}
          >
            <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            No tienes habilitadas las solicitudes de vacaciones. Contacta a RRHH para activar este permiso.
          </div>
        )}

        {/* ── Info: límite anual ── */}
        {configVac.habilitado && configVac.limite_dias_anio !== null && (
          <div
            className="rounded-2xl px-5 py-3 text-sm border"
            style={{ background: '#eff6ff', borderColor: '#bfdbfe', color: '#1e40af' }}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-semibold">Límite anual de vacaciones</span>
              <span className="font-bold">
                {configVac.dias_usados_anio} / {configVac.limite_dias_anio} días usados este año
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-blue-100 overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(100, Math.round(configVac.dias_usados_anio / configVac.limite_dias_anio * 100))}%`,
                  background: configVac.dias_usados_anio >= configVac.limite_dias_anio ? ROJO : '#3b82f6',
                }}
              />
            </div>
          </div>
        )}

        {/* ── Tabs + contenido ── */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">

          {/* Tab bar */}
          <div className="flex border-b border-gray-100">
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-4 text-sm font-semibold transition-colors relative"
                style={{ color: tab === t.id ? ROJO : GRIS }}
              >
                {t.label}
                {t.count != null && t.count > 0 && (
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                    style={tab === t.id
                      ? { background: '#fef2f2', color: ROJO }
                      : { background: '#f3f4f6', color: GRIS }}
                  >
                    {t.count}
                  </span>
                )}
                {tab === t.id && (
                  <span
                    className="absolute bottom-0 left-4 right-4 h-0.5 rounded-t-full"
                    style={{ background: ROJO }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* Tab content */}
          {tab === 'aprobadas' ? (
            <SeccionVacAprobadas
              vacData={vacData}
              loading={loadingVac}
            />
          ) : (
            <SeccionSolicitudes
              solicitudes={solicitudes}
              loading={loadingSol}
              onCancelar={cancelarSolicitud}
              onImprimir={(sol) => imprimirFormularioVac({ solicitud: sol, empleado, user, logoUrl: empresa?.logo_url, firmaUrl: user?.firma_url })}
            />
          )}
        </div>
      </div>

      {modal && (
        <SolicitudVacForm
          empleado={empleado}
          user={user}
          configVac={configVac}
          onClose={() => setModal(false)}
          onSuccess={onSuccess}
        />
      )}
    </div>
  );
}
