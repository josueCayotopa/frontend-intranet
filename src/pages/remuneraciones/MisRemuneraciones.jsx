import { useEffect, useState, useCallback } from 'react';
import { getPeriodos, getBoleta, getBoletasVistas, registrarVisBoleta } from '../../api/erp';
import { formatCurrency, formatDateFromISO, MESES } from '../../utils/formatters';

const ROJO = '#B11A1A';
const GRIS = '#8B8889';

// Color por año — se repite cíclicamente si hay más de 5 años
const PALETA_AÑOS = [
  { bg: '#fdf2f2', border: '#fca5a5', texto: '#B11A1A', badge: '#B11A1A' }, // rojo
  { bg: '#eff6ff', border: '#93c5fd', texto: '#1d4ed8', badge: '#1d4ed8' }, // azul
  { bg: '#f0fdf4', border: '#86efac', texto: '#15803d', badge: '#15803d' }, // verde
  { bg: '#faf5ff', border: '#c4b5fd', texto: '#6d28d9', badge: '#6d28d9' }, // violeta
  { bg: '#fff7ed', border: '#fdba74', texto: '#c2410c', badge: '#c2410c' }, // naranja
];

function colorDeAnio(anio, añosOrdenados) {
  const idx = añosOrdenados.indexOf(String(anio));
  return PALETA_AÑOS[idx % PALETA_AÑOS.length];
}

// ── Helpers ────────────────────────────────────────────────────────────────
function nombreMes(mes) {
  const n = parseInt(mes, 10);
  return (n >= 1 && n <= 12) ? MESES[n] : '—';
}

function periodoLabel(anio, mes) {
  return `${nombreMes(mes)} ${anio}`;
}

// ── Skeleton ───────────────────────────────────────────────────────────────
function SkeletonPeriodos() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 animate-pulse">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-20 bg-gray-100 rounded-2xl" />
      ))}
    </div>
  );
}

function SkeletonBoleta() {
  return (
    <div className="animate-pulse space-y-3">
      <div className="h-24 bg-gray-100 rounded-2xl" />
      <div className="h-32 bg-gray-100 rounded-2xl" />
      <div className="h-48 bg-gray-100 rounded-2xl" />
    </div>
  );
}

// ── Modal de la boleta ─────────────────────────────────────────────────────
function ModalBoleta({ periodo, onClose }) {
  const [boleta,  setBoleta]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    getBoleta(periodo)
      .then(({ data }) => setBoleta(data.data))
      .catch((err) => setError(err.response?.data?.message ?? 'No se pudo cargar la boleta.'))
      .finally(() => setLoading(false));
  }, [periodo]);

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center p-3 md:p-6 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl my-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-800">
            Boleta de Remuneración — {periodoLabel(periodo.slice(0,4), periodo.slice(4,6))}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
          >✕</button>
        </div>

        {/* Contenido */}
        <div className="p-4 md:p-6">
          {loading && <SkeletonBoleta />}
          {error   && (
            <div className="text-center py-10 text-red-500 font-medium">{error}</div>
          )}
          {!loading && !error && boleta && (
            <BoletaContent boleta={boleta} />
          )}
        </div>
      </div>
    </div>
  );
}

// ── Contenido completo de la boleta (fiel al formato impreso) ───────────────
function BoletaContent({ boleta }) {
  const { cabecera: c, ingresos, descuentos, aportaciones, totales } = boleta;

  const maxRows = Math.max(ingresos.length, descuentos.length, aportaciones.length, 1);
  const rows = Array.from({ length: maxRows }, (_, i) => ({
    ingreso:    ingresos[i]    ?? null,
    descuento:  descuentos[i]  ?? null,
    aportacion: aportaciones[i] ?? null,
  }));

  return (
    <div className="text-xs md:text-sm font-mono space-y-0 print:text-[10px]">

      {/* ── Encabezado empresa ── */}
      <div className="border border-gray-300 rounded-t-xl p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {/* Logo */}
          <div className="shrink-0">
            <img
              src="/logo.png"
              alt="Clínica La Luz"
              className="h-14 object-contain"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          </div>
          {/* Empresa info */}
          <div className="flex-1 space-y-0.5">
            <p className="font-bold text-sm text-gray-900">{c.empresa_nombre}</p>
            <p className="text-gray-600">{c.empresa_direccion}</p>
            <p className="text-gray-600">RUC N°: <span className="font-semibold">{c.empresa_ruc}</span></p>
            <p className="text-gray-600">CODIGO&nbsp;&nbsp;&nbsp;<span className="font-semibold">{c.cod_personal}</span></p>
          </div>
          {/* Periodo */}
          <div className="text-right shrink-0 space-y-1">
            <p className="text-gray-600">MES &nbsp;&nbsp;&nbsp;: <span className="font-semibold">
              {/* RANGO_FECHA = "DEL 01/03/2026 AL 31/03/2026" → [1]="01/03/2026" → split('/')[1]="03" */}
              {nombreMes(c.rango_fecha?.split(' ')?.[1]?.split('/')?.[1] ?? '')}
            </span></p>
            <p className="text-gray-600">PERIODO : <span className="font-semibold">{c.rango_fecha}</span></p>
          </div>
        </div>

        <div className="mt-3 text-center border-t border-gray-200 pt-2">
          <p className="font-black text-base tracking-wider text-gray-900">BOLETA DE REMUNERACION MENSUAL</p>
        </div>
      </div>

      {/* ── Datos del trabajador ── */}
      <div className="border border-t-0 border-gray-300 p-4 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1">
        {/* Columna izquierda */}
        <div className="space-y-1">
          <DatoRow label="Apellidos y Nombres" value={c.trabajador} />
          <DatoRow label="DNI"                 value={c.dni} />
          <DatoRow label="Fecha de Ingreso"    value={formatDateFromISO(c.fecha_ingreso)} />
          <DatoRow label="Area"                value={c.area} />
          <DatoRow label="Cargo"               value={c.cargo} />
          <DatoRow label="Personal de Confianza" value={c.per_confianza ? 'SI' : 'NO'} />
          <DatoRow label="AFP / ONP"           value={c.afp ?? 'NINGUNA'} />
          <DatoRow label="CUSPP"               value={c.cuspp ?? 'X'} />
          <DatoRow label="Cuenta de Haberes"   value={c.cuenta_haberes} />
        </div>
        {/* Columna derecha */}
        <div className="space-y-1">
          <DatoRow label="Tipo de trabajador"  value={c.tipo_empleado} />
          <DatoRow label="Sueldo Básico"       value={formatCurrency(c.sueldo)} />
          <DatoRow label="Horas de trabajo"    value={c.horas_trabajadas} />
          <DatoRow label="Días laborados"      value={c.num_dias} />
          <DatoRow label="Días No Laborados"   value={c.num_dias_mes != null && c.num_dias != null ? (c.num_dias_mes - c.num_dias) || '' : ''} />
          <DatoRow label="Días Subsidiados"    value="" />
          <DatoRow label="Días de Vacaciones"  value={c.dias_vac} />
          <DatoRow label="Hor.Extras 25%"      value={`${c.hextra ?? '0.00'}`} />
        </div>
      </div>

      {/* ── Tabla de conceptos ── */}
      <div className="border border-t-0 border-gray-300 overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-300 bg-gray-50">
              <th className="text-left px-3 py-2 font-bold border-r border-gray-200 w-1/3">Ingresos</th>
              <th className="text-right px-3 py-2 font-bold border-r border-gray-200 w-[10%]">Importe</th>
              <th className="text-left px-3 py-2 font-bold border-r border-gray-200 w-1/3">Descuentos</th>
              <th className="text-right px-3 py-2 font-bold border-r border-gray-200 w-[10%]">Importe</th>
              <th className="text-left px-3 py-2 font-bold border-r border-gray-200 w-[18%]">Aportaciones</th>
              <th className="text-right px-3 py-2 font-bold w-[10%]">Importe</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-b border-gray-100 last:border-0">
                <td className="px-3 py-1.5 border-r border-gray-100 truncate max-w-[200px]">
                  {row.ingreso?.concepto ?? ''}
                </td>
                <td className="px-3 py-1.5 text-right border-r border-gray-100 tabular-nums">
                  {row.ingreso ? formatCurrency(row.ingreso.importe) : ''}
                </td>
                <td className="px-3 py-1.5 border-r border-gray-100 truncate max-w-[200px]">
                  {row.descuento?.concepto ?? ''}
                </td>
                <td className="px-3 py-1.5 text-right border-r border-gray-100 tabular-nums">
                  {row.descuento ? formatCurrency(row.descuento.importe) : ''}
                </td>
                <td className="px-3 py-1.5 border-r border-gray-100 truncate max-w-[150px]">
                  {row.aportacion?.concepto ?? ''}
                </td>
                <td className="px-3 py-1.5 text-right tabular-nums">
                  {row.aportacion ? formatCurrency(row.aportacion.importe) : ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Totales ── */}
      <div className="border border-t-0 border-gray-300 rounded-b-xl p-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <TotalBox label="TOTAL INGRESOS"   value={totales.ingresos}   color="text-gray-800" />
          <TotalBox label="TOTAL DESCUENTOS" value={totales.descuentos} color="text-gray-800" />
          <TotalBox label="TOTAL APORTES"    value={totales.aportes}    color="text-gray-800" />
          <div className="text-right">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">TOTAL NETO</p>
            <p
              className="text-2xl font-black tabular-nums"
              style={{ color: ROJO }}
            >
              {formatCurrency(totales.neto)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function DatoRow({ label, value }) {
  return (
    <div className="flex gap-2 text-xs">
      <span className="text-gray-500 shrink-0 w-44">{label}</span>
      <span className="text-gray-400">:</span>
      <span className="font-semibold text-gray-800 truncate">{value ?? ''}</span>
    </div>
  );
}

function TotalBox({ label, value, color }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">{label}</p>
      <p className={`text-lg font-bold tabular-nums ${color}`}>{formatCurrency(value)}</p>
    </div>
  );
}

// ── Modal de confirmación: primera vez que se ve la boleta ─────────────────
function ModalPrimeraVez({ periodo, onConfirmar, onCancelar, onSaltarRegistro, cargando, errorLog }) {
  const anio    = periodo.slice(0, 4);
  const mes     = parseInt(periodo.slice(4, 6), 10);
  const hayError = Boolean(errorLog);

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 flex flex-col items-center gap-4">

        {/* Ícono */}
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ background: '#fef2f2' }}
        >
          <svg className="w-8 h-8" fill="none" stroke={ROJO} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>

        {/* Texto */}
        <div className="text-center">
          <h3 className="text-lg font-bold text-gray-900">
            Boleta de {nombreMes(mes)} {anio}
          </h3>
          {!hayError && (
            <p className="text-sm text-gray-500 mt-2 leading-relaxed">
              Al continuar quedará registrado que has recibido
              notificación de tu remuneración de este período.
            </p>
          )}
        </div>

        {/* Bloque de error — visible solo cuando falla el registro */}
        {hayError && (
          <div className="w-full rounded-xl px-4 py-3 text-xs border"
            style={{ background: '#fef2f2', borderColor: '#fecaca', color: '#991b1b' }}>
            <p className="font-bold mb-1">No se pudo registrar la visualización:</p>
            <p className="font-mono break-all">{errorLog}</p>
            <p className="mt-2 text-gray-500">Puedes ver la boleta de todos modos o cancelar.</p>
          </div>
        )}

        {/* Botones — cambian según si hay error */}
        {!hayError ? (
          <div className="flex gap-3 w-full mt-1">
            <button
              onClick={onCancelar}
              disabled={cargando}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold border transition"
              style={{ borderColor: '#e5e7eb', color: GRIS }}
            >
              Cancelar
            </button>
            <button
              onClick={onConfirmar}
              disabled={cargando}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition active:scale-95 disabled:opacity-60"
              style={{ background: ROJO }}
            >
              {cargando ? 'Registrando…' : 'Ver boleta'}
            </button>
          </div>
        ) : (
          <div className="flex gap-3 w-full">
            <button
              onClick={onCancelar}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold border transition"
              style={{ borderColor: '#e5e7eb', color: GRIS }}
            >
              Cancelar
            </button>
            <button
              onClick={onSaltarRegistro}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition active:scale-95"
              style={{ background: ROJO }}
            >
              Ver sin registrar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Página principal ───────────────────────────────────────────────────────
export default function MisRemuneraciones() {
  const [periodos,            setPeriodos]   = useState([]);
  const [periodosVistos,      setPVis]       = useState(new Set());
  const [loading,             setLoading]    = useState(true);
  const [error,               setError]      = useState('');
  const [errorLog,            setErrorLog]   = useState(''); // error al registrar visualización
  const [periodoSeleccionado, setPeriodoSel] = useState(null);
  const [periodoConfirmar,    setConfirmar]  = useState(null); // modal 1ª vez
  const [cargandoLog,         setCargandoLog] = useState(false);
  const [anioFiltro,          setAnioFiltro] = useState('todos');

  const cargar = useCallback(() => {
    setLoading(true);
    Promise.all([
      getPeriodos(36),
      getBoletasVistas().catch(() => ({ data: { data: [] } })),
    ])
      .then(([resPeriodos, resVistas]) => {
        setPeriodos(resPeriodos.data.data ?? []);
        const vistos = new Set((resVistas.data.data ?? []).map((v) => v.periodo));
        setPVis(vistos);
      })
      .catch(() => setError('No se pudieron cargar los períodos de boletas.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  // Abrir un período: primera vez → modal de confirmación; ya visto → directo
  const abrirPeriodo = (clave) => {
    if (periodosVistos.has(clave)) {
      setPeriodoSel(clave);
    } else {
      setConfirmar(clave);
    }
  };

  // El usuario confirmó en el modal → registrar + abrir boleta
  const confirmarPrimeraVez = async () => {
    setCargandoLog(true);
    setErrorLog('');
    try {
      await registrarVisBoleta({ periodo: periodoConfirmar });
      setPVis((prev) => new Set([...prev, periodoConfirmar]));
      setPeriodoSel(periodoConfirmar);
      setConfirmar(null);
    } catch (err) {
      console.error('[boleta-vis] Error al registrar:', err?.response?.data ?? err.message);
      setErrorLog(err?.response?.data?.message ?? 'No se pudo registrar. Verifica que el SP esté instalado.');
    } finally {
      setCargandoLog(false);
    }
  };

  // Abrir boleta sin registrar (cuando el registro falla y el usuario quiere continuar)
  const abrirSinRegistrar = () => {
    setPeriodoSel(periodoConfirmar);
    setConfirmar(null);
    setErrorLog('');
  };

  // Años únicos ordenados de más reciente a más antiguo
  const años = [...new Set(periodos.map((p) => String(p.ANO_PROCESO)))].sort((a, b) => b - a);

  const periodosFiltrados = anioFiltro === 'todos'
    ? periodos
    : periodos.filter((p) => String(p.ANO_PROCESO) === anioFiltro);

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-5">

      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mis Remuneraciones</h1>
        <p className="text-sm mt-0.5" style={{ color: GRIS }}>
          Selecciona un período para ver tu boleta de pago
        </p>
      </div>

      {loading && <SkeletonPeriodos />}

      {error && !loading && (
        <div className="bg-white rounded-2xl border border-red-100 p-8 text-center">
          <p className="text-red-500 font-medium mb-3">{error}</p>
          <button onClick={cargar} className="text-sm font-semibold underline" style={{ color: ROJO }}>Reintentar</button>
        </div>
      )}

      {!loading && !error && periodos.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-400">
          No se encontraron boletas disponibles.
        </div>
      )}

      {!loading && !error && periodos.length > 0 && (
        <>
          {/* ── Filtro por año ── */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setAnioFiltro('todos')}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={anioFiltro === 'todos'
                ? { background: ROJO, color: '#fff' }
                : { background: '#f3f4f6', color: GRIS }}
            >
              Todos
            </button>
            {años.map((anio) => {
              const col = colorDeAnio(anio, años);
              const activo = anioFiltro === anio;
              return (
                <button
                  key={anio}
                  onClick={() => setAnioFiltro(anio)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all border"
                  style={activo
                    ? { background: col.badge, color: '#fff', borderColor: col.badge }
                    : { background: col.bg, color: col.texto, borderColor: col.border }}
                >
                  {anio}
                </button>
              );
            })}
          </div>

          {/* ── Leyenda de colores ── */}
          {anioFiltro === 'todos' && años.length > 1 && (
            <div className="flex items-center gap-3 flex-wrap">
              {años.map((anio) => {
                const col = colorDeAnio(anio, años);
                return (
                  <div key={anio} className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: col.badge }} />
                    <span className="text-xs font-medium" style={{ color: GRIS }}>{anio}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Grilla de períodos ── */}
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {periodosFiltrados.map((p) => {
              const clave  = p.periodo_clave ?? (String(p.ANO_PROCESO) + String(p.MES_PROCESO).padStart(2, '0'));
              const anio   = String(p.ANO_PROCESO);
              const mes    = p.MES_PROCESO;
              const col    = colorDeAnio(anio, años);
              const vista  = periodosVistos.has(clave);
              return (
                <button
                  key={clave}
                  onClick={() => abrirPeriodo(clave)}
                  className="group rounded-xl border p-3 text-left active:scale-95 transition-all hover:shadow-md relative"
                  style={{ background: col.bg, borderColor: vista ? '#86efac' : col.border }}
                >
                  {/* Indicador "Vista" */}
                  {vista && (
                    <span
                      className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full flex items-center justify-center"
                      title="Ya visualizada"
                      style={{ background: '#dcfce7' }}
                    >
                      <svg className="w-2.5 h-2.5" fill="none" stroke="#16a34a" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                  )}

                  {/* Año badge */}
                  <span
                    className="inline-block text-[10px] font-bold px-1.5 py-0.5 rounded-md mb-1.5"
                    style={{ background: col.badge, color: '#fff' }}
                  >
                    {anio}
                  </span>

                  {/* Nombre completo del mes */}
                  <p className="text-xs font-bold leading-tight" style={{ color: col.texto }}>
                    {nombreMes(mes)}
                  </p>

                  {/* Estado */}
                  <div className="mt-2 flex items-center gap-1" style={{ color: vista ? '#16a34a' : col.texto }}>
                    {vista ? (
                      <>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        <span className="text-[10px] font-semibold">Vista</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-3 h-3 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="text-[10px] font-semibold opacity-70">Ver boleta</span>
                      </>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* Modal confirmación primera vez */}
      {periodoConfirmar && !periodoSeleccionado && (
        <ModalPrimeraVez
          periodo={periodoConfirmar}
          cargando={cargandoLog}
          errorLog={errorLog}
          onConfirmar={confirmarPrimeraVez}
          onCancelar={() => { setConfirmar(null); setErrorLog(''); }}
          onSaltarRegistro={abrirSinRegistrar}
        />
      )}

      {/* Modal boleta (pasa la boleta al callback de log via prop) */}
      {periodoSeleccionado && (
        <ModalBoleta
          periodo={periodoSeleccionado}
          onClose={() => setPeriodoSel(null)}
        />
      )}
    </div>
  );
}
