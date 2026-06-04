import { useEffect, useState } from 'react';
import { getTrabajador } from '../../api/erp';
import { useAuth } from '../../hooks/useAuth';
import { formatDateFromISO } from '../../utils/formatters';

const ROJO = '#B11A1A';
const GRIS = '#8B8889';

// ── Helpers ────────────────────────────────────────────────────────────────
function nombreCompleto(p) {
  if (!p) return '—';
  const ap = [p.APE_PATERNO, p.APE_MATERNO].filter(Boolean).join(' ');
  return ap ? `${ap}, ${p.NOM_TRABAJADOR ?? ''}`.trim() : (p.NOM_TRABAJADOR ?? '—');
}

function iniciales(p) {
  if (!p) return '?';
  const ap = p.APE_PATERNO?.charAt(0) ?? '';
  const nom = p.NOM_TRABAJADOR?.charAt(0) ?? '';
  return (ap + nom).toUpperCase() || '?';
}

// ── Skeleton de carga ──────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="animate-pulse space-y-4">
      {/* Avatar card */}
      <div className="bg-white rounded-3xl p-8 border border-gray-100 flex items-center gap-6">
        <div className="w-20 h-20 rounded-full bg-gray-200 shrink-0" />
        <div className="flex-1 space-y-3">
          <div className="h-5 bg-gray-200 rounded-xl w-3/4" />
          <div className="h-4 bg-gray-100 rounded-xl w-1/2" />
          <div className="h-6 bg-gray-100 rounded-full w-28" />
        </div>
      </div>
      {/* Data cards */}
      {[8, 4].map((rows, i) => (
        <div key={i} className="bg-white rounded-3xl p-6 border border-gray-100 space-y-3">
          <div className="h-3 bg-gray-200 rounded w-32" />
          {Array.from({ length: rows }).map((_, j) => (
            <div key={j} className="h-4 bg-gray-100 rounded-xl" />
          ))}
        </div>
      ))}
    </div>
  );
}

// ── Fila de dato ──────────────────────────────────────────────────────────
function InfoRow({ label, value, icon }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-50 last:border-0">
      {icon && (
        <span className="mt-0.5 shrink-0 text-gray-300">{icon}</span>
      )}
      <div className="flex-1 flex justify-between items-start gap-4 min-w-0">
        <span className="text-xs font-semibold uppercase tracking-wide shrink-0" style={{ color: GRIS }}>
          {label}
        </span>
        <span className="text-sm text-gray-800 text-right font-medium truncate max-w-xs">
          {value ?? '—'}
        </span>
      </div>
    </div>
  );
}

// ── Sección con título ─────────────────────────────────────────────────────
function Section({ title, children }) {
  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
      <h3 className="text-xs font-bold uppercase tracking-widest mb-4 pb-2 border-b border-gray-100" style={{ color: GRIS }}>
        {title}
      </h3>
      {children}
    </div>
  );
}

// ── Badge ──────────────────────────────────────────────────────────────────
function Badge({ label }) {
  return (
    <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold text-white mt-2" style={{ background: ROJO }}>
      {label}
    </span>
  );
}

// ── Página ─────────────────────────────────────────────────────────────────
export default function MiPerfil() {
  const { empresa } = useAuth();
  const [perfil,  setPerfil]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    getTrabajador()
      .then(({ data }) => setPerfil(data.data))
      .catch(() => setError('No se pudo cargar los datos del perfil.'))
      .finally(() => setLoading(false));
  }, []);

  const empresaNombre = typeof empresa === 'string' ? empresa : empresa?.nombre;

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-4">

      {/* Encabezado de página */}
      <div className="mb-2">
        <h1 className="text-2xl font-bold text-gray-900">Mi Perfil</h1>
        <p className="text-sm mt-0.5" style={{ color: GRIS }}>
          Información de tu contrato y datos personales
        </p>
      </div>

      {/* ── Estados ── */}
      {loading && <Skeleton />}

      {error && !loading && (
        <div className="bg-white rounded-3xl p-8 border border-red-100 text-center">
          <svg className="w-12 h-12 mx-auto mb-3 text-red-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-red-500 font-medium">{error}</p>
          <button
            onClick={() => { setError(''); setLoading(true); getTrabajador().then(({ data }) => setPerfil(data.data)).catch(() => setError('No se pudo cargar los datos del perfil.')).finally(() => setLoading(false)); }}
            className="mt-3 text-sm font-semibold underline"
            style={{ color: ROJO }}
          >
            Reintentar
          </button>
        </div>
      )}

      {!loading && !error && perfil && (
        <>
          {/* ── Tarjeta principal: avatar + nombre ── */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-5">
              {/* Avatar */}
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-black shrink-0 shadow-md"
                style={{ background: ROJO }}
              >
                {iniciales(perfil)}
              </div>

              {/* Nombre + cargo */}
              <div className="min-w-0">
                <h2 className="text-xl font-bold text-gray-900 leading-tight">
                  {nombreCompleto(perfil)}
                </h2>
                <p className="text-sm mt-0.5 font-medium" style={{ color: GRIS }}>
                  {perfil.DES_CARGO ?? '—'}
                </p>
                <Badge label={empresaNombre ?? 'Sin empresa'} />
              </div>
            </div>

            {/* Stat pills */}
            <div className="mt-5 pt-5 border-t border-gray-50 grid grid-cols-2 sm:grid-cols-3 gap-3">
              <StatPill
                label="Cód. Personal"
                value={perfil.COD_PERSONAL}
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2" />
                  </svg>
                }
              />
              <StatPill
                label="Ingreso"
                value={formatDateFromISO(perfil.FEC_INGRESO)}
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                }
              />
              <StatPill
                label="Área"
                value={perfil.DES_AREAS}
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                }
              />
            </div>
          </div>

          {/* ── Datos laborales ── */}
          <Section title="Datos Laborales">
            <InfoRow label="Empresa"        value={empresaNombre} />
            <InfoRow label="Área"           value={perfil.DES_AREAS} />
            <InfoRow label="Cargo"          value={perfil.DES_CARGO} />
            <InfoRow label="Categoría"      value={perfil.DES_CATEGORIA} />
            <InfoRow label="Tipo Planilla"  value={perfil.DES_TIPO_PLANILLA} />
            <InfoRow label="Profesión"      value={perfil.DES_PROFESION} />
            <InfoRow label="Zona"           value={perfil.DES_ZONA} />
            <InfoRow label="Fecha Ingreso"  value={formatDateFromISO(perfil.FEC_INGRESO)} />
          </Section>

          {/* ── Datos personales ── */}
          <Section title="Datos Personales">
            <InfoRow label="Apellido Paterno" value={perfil.APE_PATERNO} />
            <InfoRow label="Apellido Materno" value={perfil.APE_MATERNO} />
            <InfoRow label="Nombres"          value={perfil.NOM_TRABAJADOR} />
            <InfoRow label="Tipo Documento"   value={perfil.TIP_DOC_IDENTIDAD} />
            <InfoRow label="N° Documento"     value={perfil.NUM_DOC_IDENTIDAD} />
            <InfoRow label="Teléfono"         value={perfil.NUM_TELEFONO} />
          </Section>
        </>
      )}
    </div>
  );
}

// ── Mini stat pill ─────────────────────────────────────────────────────────
function StatPill({ label, value, icon }) {
  return (
    <div className="flex items-start gap-2 bg-gray-50 rounded-2xl px-3 py-3">
      <span className="mt-0.5 shrink-0" style={{ color: ROJO }}>{icon}</span>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wide truncate" style={{ color: GRIS }}>{label}</p>
        <p className="text-sm font-semibold text-gray-800 truncate">{value ?? '—'}</p>
      </div>
    </div>
  );
}
