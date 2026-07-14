import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { getTrabajador } from '../../api/erp';
import { getSesionesRequest, cerrarSesionRequest, subirFotoRequest, subirFirmaRequest } from '../../api/auth';
import { useAuth } from '../../hooks/useAuth';
import { formatDateFromISO } from '../../utils/formatters';

const ROJO = '#B11A1A';
const GRIS = '#8B8889';

// Construye URL absoluta de foto (maneja tanto relativas como absolutas ya guardadas)
const BACKEND_URL = (import.meta.env.VITE_API_V1_URL ?? 'http://127.0.0.1:8000/api/v1')
  .replace(/\/api\/v1\/?$/, '');

function resolverFotoUrl(url) {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return BACKEND_URL + url;
}

// ── Helpers ────────────────────────────────────────────────────────────────
function buildNombreCompleto(erp, user) {
  if (erp) {
    const aps = [erp.APE_PATERNO, erp.APE_MATERNO].filter(Boolean).join(' ');
    return aps ? `${aps}, ${erp.NOM_TRABAJADOR ?? ''}`.trim() : (erp.NOM_TRABAJADOR ?? '—');
  }
  if (user?.nom_trabajador) {
    const aps = [user.ape_paterno, user.ape_materno].filter(Boolean).join(' ');
    return aps ? `${aps}, ${user.nom_trabajador}`.trim() : user.nom_trabajador;
  }
  return user?.usuario ?? '—';
}

function buildIniciales(erp, user) {
  const ap  = erp?.APE_PATERNO?.charAt(0)  ?? user?.ape_paterno?.charAt(0)  ?? '';
  const nom = erp?.NOM_TRABAJADOR?.charAt(0) ?? user?.nom_trabajador?.charAt(0) ?? user?.usuario?.charAt(0) ?? '?';
  return (ap + nom).toUpperCase() || '?';
}

// ── Componentes de UI ──────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="bg-white rounded-3xl p-6 border border-gray-100 flex items-center gap-5">
        <div className="w-20 h-20 rounded-full bg-gray-200 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-5 bg-gray-200 rounded-xl w-3/4" />
          <div className="h-4 bg-gray-100 rounded-xl w-1/2" />
          <div className="h-6 bg-gray-100 rounded-full w-28" />
        </div>
      </div>
      {[6, 4, 3].map((rows, i) => (
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

function InfoRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-gray-50 last:border-0">
      <span className="text-xs font-semibold uppercase tracking-wide shrink-0" style={{ color: GRIS }}>
        {label}
      </span>
      <span className="text-sm text-gray-800 text-right font-medium truncate max-w-xs">
        {value ?? '—'}
      </span>
    </div>
  );
}

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

// ── Sección de sesiones activas ────────────────────────────────────────────
function MisSesiones() {
  const [sesiones,  setSesiones]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [cerrando,  setCerrando]  = useState(null);

  const cargar = () => {
    setLoading(true);
    getSesionesRequest()
      .then(({ data }) => setSesiones(data.data ?? []))
      .catch(() => setSesiones([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { cargar(); }, []);

  const cerrar = async (id) => {
    setCerrando(id);
    try {
      await cerrarSesionRequest(id);
      setSesiones((prev) => prev.map((s) => s.id === id ? { ...s, activo: false } : s));
    } catch { /* silencioso */ }
    finally { setCerrando(null); }
  };

  const iconoDispositivo = (d) => {
    if (d === 'Móvil') return (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    );
    if (d === 'Tablet') return (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    );
    return (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    );
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between pb-2 border-b border-gray-100 mb-4">
        <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: GRIS }}>
          Mis Sesiones
        </h3>
        <button
          onClick={cargar}
          className="text-xs font-semibold px-3 py-1 rounded-lg hover:bg-gray-50 transition-all"
          style={{ color: GRIS }}
        >
          Actualizar
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map((i) => (
            <div key={i} className="animate-pulse h-16 bg-gray-100 rounded-2xl" />
          ))}
        </div>
      ) : sesiones.length === 0 ? (
        <p className="text-sm text-center text-gray-400 py-4">No hay sesiones registradas.</p>
      ) : (
        <div className="space-y-2">
          {sesiones.map((s) => (
            <div
              key={s.id}
              className={`rounded-2xl p-4 border transition-all ${
                s.es_actual
                  ? 'border-red-200 bg-red-50'
                  : s.activo
                  ? 'border-gray-100 bg-gray-50'
                  : 'border-gray-100 bg-white opacity-60'
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Icono dispositivo */}
                <div
                  className="mt-0.5 shrink-0 w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: s.es_actual ? '#fdf2f2' : '#f3f4f6', color: s.es_actual ? ROJO : GRIS }}
                >
                  {iconoDispositivo(s.dispositivo)}
                </div>

                {/* Info principal */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-gray-800 truncate">
                      {s.navegador ?? 'Navegador desconocido'}
                    </span>
                    {s.es_actual && (
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white shrink-0"
                        style={{ background: ROJO }}
                      >
                        Esta sesión
                      </span>
                    )}
                    {!s.activo && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-200 text-gray-500 shrink-0">
                        Cerrada
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-gray-500 mt-0.5">
                    {s.sistema_operativo ?? '—'} · {s.dispositivo}
                  </p>

                  {/* IP y hostname */}
                  <p className="text-xs mt-1 font-mono" style={{ color: GRIS }}>
                    {s.ip_address ?? '—'}
                    {s.hostname && s.hostname !== s.ip_address && (
                      <span className="ml-1 text-gray-400">({s.hostname})</span>
                    )}
                  </p>

                  {/* Fechas */}
                  <div className="flex gap-3 mt-1.5 flex-wrap">
                    <span className="text-[10px] text-gray-400">
                      Login: {s.fec_login ?? '—'}
                    </span>
                    {s.fec_ultimo_acceso && (
                      <span className="text-[10px] text-gray-400">
                        Último acceso: {s.fec_ultimo_acceso}
                      </span>
                    )}
                    {s.fec_logout && (
                      <span className="text-[10px] text-gray-400">
                        Logout: {s.fec_logout}
                      </span>
                    )}
                  </div>
                </div>

                {/* Botón cerrar */}
                {s.activo && !s.es_actual && (
                  <button
                    onClick={() => cerrar(s.id)}
                    disabled={cerrando === s.id}
                    className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-xl border border-red-200 transition-all active:scale-95 disabled:opacity-50"
                    style={{ color: ROJO, background: '#fdf2f2' }}
                  >
                    {cerrando === s.id ? '…' : 'Cerrar'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Página ─────────────────────────────────────────────────────────────────
export default function MiPerfil() {
  const { user, empresa, updateUser } = useAuth();

  const [erp,        setErp]        = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [fotoUrl,    setFotoUrl]    = useState(resolverFotoUrl(user?.foto_url));
  const [subiendo,   setSubiendo]   = useState(false);
  const [fotoError,  setFotoError]  = useState('');
  const fileRef = useRef(null);

  const [firmaUrl,     setFirmaUrl]     = useState(resolverFotoUrl(user?.firma_url));
  const [subiendoFirma, setSubiendoFirma] = useState(false);
  const [firmaError,   setFirmaError]   = useState('');
  const firmaFileRef = useRef(null);

  const cargarPerfil = () => {
    setLoading(true);
    setError('');
    getTrabajador()
      .then(({ data }) => setErp(data.data))
      .catch(() => setError('No se pudieron cargar los datos del ERP.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { cargarPerfil(); }, []);

  const handleFotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFotoError('');
    setSubiendo(true);
    const fd = new FormData();
    fd.append('foto', file);
    try {
      const { data } = await subirFotoRequest(fd);
      const nuevaUrl = data.data?.foto_url;
      const urlResuelta = resolverFotoUrl(nuevaUrl);
      setFotoUrl(urlResuelta);
      updateUser?.({ foto_url: nuevaUrl });
    } catch {
      setFotoError('No se pudo subir la foto.');
    } finally {
      setSubiendo(false);
      e.target.value = '';
    }
  };

  const handleFirmaChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFirmaError('');
    setSubiendoFirma(true);
    const fd = new FormData();
    fd.append('firma', file);
    try {
      const { data } = await subirFirmaRequest(fd);
      const nuevaUrl = data.data?.firma_url;
      const urlResuelta = resolverFotoUrl(nuevaUrl);
      setFirmaUrl(urlResuelta);
      updateUser?.({ firma_url: nuevaUrl });
    } catch {
      setFirmaError('No se pudo subir la firma.');
    } finally {
      setSubiendoFirma(false);
      e.target.value = '';
    }
  };

  const empresaNombre = typeof empresa === 'string' ? empresa : empresa?.nombre;
  const nombreCompleto = buildNombreCompleto(erp, user);
  const iniciales = buildIniciales(erp, user);

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-4">

      <div className="mb-2">
        <h1 className="text-2xl font-bold text-gray-900">Mi Perfil</h1>
        <p className="text-sm mt-0.5" style={{ color: GRIS }}>
          Información laboral y configuración de tu cuenta
        </p>
      </div>

      {loading && <Skeleton />}

      {!loading && (
        <>
          {/* ── Hero card: banner rojo + avatar flotante ── */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Banner */}
            <div className="h-28 w-full" style={{ background: `linear-gradient(135deg, ${ROJO} 0%, #7f0f0f 100%)` }} />

            {/* Contenido sobre el banner */}
            <div className="px-6 pb-6">
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 -mt-10">

                {/* Avatar */}
                <div className="relative w-fit">
                  {fotoUrl ? (
                    <img
                      src={fotoUrl}
                      alt="Foto de perfil"
                      className="w-24 h-24 rounded-2xl object-cover border-4 border-white shadow-lg"
                    />
                  ) : (
                    <div
                      className="w-24 h-24 rounded-2xl flex items-center justify-center text-white text-3xl font-black border-4 border-white shadow-lg"
                      style={{ background: ROJO }}
                    >
                      {iniciales}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={subiendo}
                    className="absolute bottom-1 right-1 w-7 h-7 rounded-full border-2 border-white flex items-center justify-center shadow transition-opacity hover:opacity-90 disabled:opacity-50"
                    style={{ background: ROJO }}
                    title="Cambiar foto"
                  >
                    {subiendo ? (
                      <svg className="w-3.5 h-3.5 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                    ) : (
                      <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
                      </svg>
                    )}
                  </button>
                  <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFotoChange} />
                </div>

                {/* Nombre y cargo */}
                <div className="flex-1 min-w-0 sm:mb-1">
                  <h2 className="text-xl font-bold text-gray-900 leading-tight truncate">{nombreCompleto}</h2>
                  <p className="text-sm font-medium mt-0.5 truncate" style={{ color: GRIS }}>{erp?.DES_CARGO ?? 'Sin cargo asignado'}</p>
                  {fotoError && <p className="text-xs mt-1" style={{ color: ROJO }}>{fotoError}</p>}
                </div>

                {/* Badge empresa */}
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white shrink-0 self-start sm:self-auto sm:mb-1" style={{ background: ROJO }}>
                  {empresaNombre ?? 'Sin empresa'}
                </span>
              </div>

              {/* Stats */}
              <div className="mt-5 pt-5 border-t border-gray-50 grid grid-cols-3 gap-3">
                <StatPill label="Cód. Personal" value={user?.cod_personal}
                  icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0" /></svg>}
                />
                <StatPill label="Fecha Ingreso" value={formatDateFromISO(erp?.FEC_INGRESO)}
                  icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
                />
                <StatPill label="Área" value={erp?.DES_AREAS}
                  icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1" /></svg>}
                />
              </div>
            </div>
          </div>

          {/* ── Grid 2 columnas ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            {/* Col izquierda */}
            <div className="space-y-4">
              {error ? (
                <div className="bg-white rounded-3xl p-8 border border-red-100 text-center">
                  <p className="text-red-500 font-medium text-sm">{error}</p>
                  <button onClick={cargarPerfil} className="mt-3 text-sm font-semibold underline" style={{ color: ROJO }}>Reintentar</button>
                </div>
              ) : erp ? (
                <Section title="Datos Laborales">
                  <InfoRow label="Empresa"       value={empresaNombre} />
                  <InfoRow label="Área"          value={erp.DES_AREAS} />
                  <InfoRow label="Cargo"         value={erp.DES_CARGO} />
                  <InfoRow label="Categoría"     value={erp.DES_CATEGORIA} />
                  <InfoRow label="Tipo Planilla" value={erp.DES_TIPO_PLANILLA} />
                  <InfoRow label="Profesión"     value={erp.DES_PROFESION} />
                  <InfoRow label="Zona"          value={erp.DES_ZONA} />
                  <InfoRow label="Fecha Ingreso" value={formatDateFromISO(erp.FEC_INGRESO)} />
                </Section>
              ) : (
                <div className="bg-white rounded-3xl p-6 border border-gray-100 text-center text-sm text-gray-400">
                  No se encontraron datos en el ERP.
                </div>
              )}

              {erp && (
                <Section title="Datos Personales">
                  <InfoRow label="Apellido Paterno" value={erp.APE_PATERNO} />
                  <InfoRow label="Apellido Materno" value={erp.APE_MATERNO} />
                  <InfoRow label="Nombres"          value={erp.NOM_TRABAJADOR} />
                  <InfoRow label="Tipo Documento"   value={erp.TIP_DOC_IDENTIDAD} />
                  <InfoRow label="N° Documento"     value={erp.NUM_DOC_IDENTIDAD} />
                  <InfoRow label="Teléfono"         value={erp.NUM_TELEFONO} />
                </Section>
              )}
            </div>

            {/* Col derecha */}
            <div className="space-y-4">
              <Section title="Cuenta Intranet">
                <InfoRow label="Usuario"       value={user?.usuario} />
                <InfoRow label="Cód. Personal" value={user?.cod_personal} />
                <InfoRow label="DNI"           value={user?.dni} />
                <InfoRow label="Rol"           value={user?.rol ?? 'EMPLEADO'} />
                <InfoRow label="Empresa"       value={empresaNombre} />
                <div className="pt-4">
                  <Link
                    to="/cambiar-password"
                    className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl transition-all active:scale-95"
                    style={{ background: '#fdf2f2', color: ROJO }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                    Cambiar contraseña
                  </Link>
                </div>
              </Section>

              <Section title="Firma Digital">
                <div className="flex items-center gap-4">
                  <div
                    className="w-32 h-20 rounded-xl border border-dashed border-gray-200 flex items-center justify-center bg-gray-50 shrink-0 overflow-hidden"
                  >
                    {firmaUrl ? (
                      <img src={firmaUrl} alt="Firma digital" className="max-w-full max-h-full object-contain" />
                    ) : (
                      <span className="text-[10px] text-gray-400 text-center px-2">Sin firma registrada</span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-xs mb-2" style={{ color: GRIS }}>
                      Sube una imagen de tu firma para usarla en tus documentos y formularios.
                    </p>
                    <button
                      type="button"
                      onClick={() => firmaFileRef.current?.click()}
                      disabled={subiendoFirma}
                      className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl transition-all active:scale-95 disabled:opacity-50"
                      style={{ background: '#fdf2f2', color: ROJO }}
                    >
                      {subiendoFirma ? 'Subiendo…' : (firmaUrl ? 'Cambiar firma' : 'Subir firma')}
                    </button>
                    {firmaError && <p className="text-xs mt-1.5" style={{ color: ROJO }}>{firmaError}</p>}
                    <input
                      ref={firmaFileRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={handleFirmaChange}
                    />
                  </div>
                </div>
              </Section>

              <MisSesiones />
            </div>

          </div>
        </>
      )}
    </div>
  );
}
