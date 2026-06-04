import { useEffect, useState, useCallback } from 'react';
import { getPeriodos, getBoleta } from '../../api/erp';
import { formatCurrency, formatDateFromISO, MESES } from '../../utils/formatters';

const ROJO = '#B11A1A';
const GRIS = '#8B8889';

// ── Helpers ────────────────────────────────────────────────────────────────
function nombreMes(mes) {
  return MESES[parseInt(mes, 10)] ?? mes;
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
            <p className="text-gray-600">MES &nbsp;&nbsp;&nbsp;: <span className="font-semibold">{nombreMes(c.rango_fecha?.split(' ')?.[1] ?? '')}</span></p>
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

// ── Página principal ───────────────────────────────────────────────────────
export default function MisRemuneraciones() {
  const [periodos,        setPeriodos]        = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [error,           setError]           = useState('');
  const [periodoSeleccionado, setPeriodoSel]  = useState(null);

  const cargar = useCallback(() => {
    setLoading(true);
    getPeriodos(18)
      .then(({ data }) => setPeriodos(data.data ?? []))
      .catch(() => setError('No se pudieron cargar los períodos de boletas.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-5">

      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mis Remuneraciones</h1>
        <p className="text-sm mt-0.5" style={{ color: GRIS }}>
          Selecciona un mes para ver tu boleta de pago
        </p>
      </div>

      {/* Estados */}
      {loading && <SkeletonPeriodos />}

      {error && !loading && (
        <div className="bg-white rounded-2xl border border-red-100 p-8 text-center">
          <p className="text-red-500 font-medium mb-3">{error}</p>
          <button onClick={cargar} className="text-sm font-semibold underline" style={{ color: ROJO }}>
            Reintentar
          </button>
        </div>
      )}

      {!loading && !error && periodos.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-400">
          No se encontraron boletas disponibles.
        </div>
      )}

      {/* Grilla de períodos */}
      {!loading && !error && periodos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {periodos.map((p) => {
            const clave = p.periodo_clave ?? (p.ANO_PROCESO + p.MES_PROCESO);
            const anio  = p.ANO_PROCESO;
            const mes   = p.MES_PROCESO;
            return (
              <button
                key={clave}
                onClick={() => setPeriodoSel(clave)}
                className="group bg-white rounded-2xl border border-gray-100 p-4 text-left hover:border-red-200 hover:shadow-md active:scale-95 transition-all"
              >
                <p
                  className="text-2xl font-black leading-none group-hover:text-red-700 transition-colors"
                  style={{ color: ROJO }}
                >
                  {nombreMes(mes).slice(0, 3).toUpperCase()}
                </p>
                <p className="text-sm font-semibold text-gray-700 mt-1">{nombreMes(mes)}</p>
                <p className="text-xs font-medium mt-0.5" style={{ color: GRIS }}>{anio}</p>
                <div className="mt-3 flex items-center gap-1 text-xs font-semibold" style={{ color: ROJO }}>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Ver boleta
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Modal boleta */}
      {periodoSeleccionado && (
        <ModalBoleta
          periodo={periodoSeleccionado}
          onClose={() => setPeriodoSel(null)}
        />
      )}
    </div>
  );
}
