import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getDashboard } from '../../api/erp';
import { useAuth } from '../../hooks/useAuth';
import { formatCurrency, formatDateFromISO, MESES } from '../../utils/formatters';
import WelcomeModal from '../../components/ui/WelcomeModal';

const ROJO = '#B11A1A';
const GRIS = '#8B8889';

const BACKEND_URL = (import.meta.env.VITE_API_V1_URL ?? 'http://127.0.0.1:8000/api/v1')
  .replace(/\/api\/v1\/?$/, '');

function resolverFotoUrl(url) {
  if (!url) return null;
  return url.startsWith('http') ? url : BACKEND_URL + url;
}

const DIAS = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];

function hoyLabel() {
  const d = new Date();
  return `${DIAS[d.getDay()]}, ${d.getDate()} de ${MESES[d.getMonth() + 1]}`;
}

function periodoLabel(periodo) {
  if (!periodo || periodo.length < 6) return periodo ?? '—';
  const mes = parseInt(periodo.slice(4, 6), 10);
  return `${MESES[mes] ?? mes} ${periodo.slice(0, 4)}`;
}

function Skel({ w = 'w-24', h = 'h-4', extra = '' }) {
  return <div className={`${w} ${h} ${extra} bg-gray-100 rounded-xl animate-pulse`} />;
}

function Card({ to, children, className = '' }) {
  return (
    <Link
      to={to}
      className={`bg-white rounded-3xl shadow-sm border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all ${className}`}
    >
      {children}
    </Link>
  );
}

function StatMini({ label, value, loading }) {
  return (
    <div className="bg-gray-50 rounded-2xl p-4">
      <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: GRIS }}>{label}</p>
      {loading ? <Skel w="w-20" h="h-4" /> : (
        <p className="text-sm font-semibold text-gray-800 truncate">{value ?? '—'}</p>
      )}
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(false);

  const [showWelcome, setShowWelcome] = useState(
    () => !sessionStorage.getItem('welcomed')
  );

  function cerrarWelcome() {
    sessionStorage.setItem('welcomed', '1');
    setShowWelcome(false);
  }

  useEffect(() => {
    getDashboard()
      .then(({ data: res }) => setData(res.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  // Datos ERP (secundarios — solo para cargo/área/boleta/vacaciones)
  const t   = data?.trabajador;
  const b   = data?.ultima_boleta;
  const vac = data?.vacaciones;

  // ── Nombre: SIEMPRE desde UsuarioIntranet (user de AuthContext) ──────────
  // El ERP (t) se usa solo como último recurso si los campos del usuario son null
  const primerNombre = (
    user?.nom_trabajador ??
    t?.NOM_TRABAJADOR    ??
    user?.usuario        ??
    'Usuario'
  ).split(' ')[0];

  const nombreCompleto = user?.nombre_completo
    || (user?.nom_trabajador
        ? `${user.ape_paterno ?? ''} ${user.ape_materno ?? ''}, ${user.nom_trabajador}`.trim()
        : null)
    || t?.NOM_TRABAJADOR
    || user?.usuario
    || 'Usuario';

  const inicialAvatar = primerNombre.charAt(0).toUpperCase();
  const fotoUrl       = resolverFotoUrl(user?.foto_url);

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">

      {/* ── Encabezado ── */}
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inicio</h1>
          <p className="text-sm mt-0.5" style={{ color: GRIS }}>{hoyLabel()}</p>
        </div>
        <Link
          to="/perfil"
          className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-gray-100 hover:ring-gray-300 transition-all"
        >
          {fotoUrl ? (
            <img src={fotoUrl} alt="Foto" className="w-full h-full object-cover" />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center text-white text-sm font-bold"
              style={{ background: ROJO }}
            >
              {inicialAvatar}
            </div>
          )}
        </Link>
      </header>

      {/* ── Bento grid ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 auto-rows-[minmax(140px,auto)]">

        {/* ── Perfil 2×2 ── */}
        <Card to="/perfil" className="col-span-2 row-span-2 p-6 flex flex-col justify-between">
          <div>
            <span
              className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide text-white mb-4"
              style={{ background: ROJO }}
            >
              Mi Perfil
            </span>

            <div className="flex items-center gap-4">
              {/* Foto o iniciales */}
              {fotoUrl ? (
                <img
                  src={fotoUrl}
                  alt="Foto de perfil"
                  className="w-30 h-30 rounded-2xl object-cover shadow-md shrink-0"
                />
              ) : (
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-md shrink-0"
                  style={{ background: ROJO }}
                >
                  {inicialAvatar}
                </div>
              )}

              <div className="min-w-0">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">
                  Hola, {primerNombre}
                </h2>
                <p className="text-xs font-semibold uppercase tracking-wide mt-0.5 truncate" style={{ color: GRIS }}>
                  {nombreCompleto}
                </p>
                {loading ? (
                  <Skel w="w-40" h="h-4" extra="mt-2" />
                ) : (
                  <p className="text-sm mt-1 font-medium truncate" style={{ color: GRIS }}>
                    {t?.DES_CARGO ?? 'Sin cargo asignado'}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Área + Fecha ingreso — del ERP */}
          <div className="grid grid-cols-2 gap-3 mt-4">
            <StatMini label="Área"    value={t?.DES_AREAS}                     loading={loading} />
            <StatMini label="Ingreso" value={formatDateFromISO(t?.FEC_INGRESO)} loading={loading} />
          </div>
        </Card>

        {/* ── Última Boleta ── */}
        <Card to="/remuneraciones" className="col-span-1 row-span-1 p-5 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 rounded-t-3xl" style={{ background: ROJO, opacity: 0.15 }} />
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: GRIS }}>Última boleta</p>
          {loading ? (
            <div className="space-y-1.5 mt-2">
              <Skel w="w-20" h="h-3" />
              <Skel w="w-24" h="h-6" />
            </div>
          ) : b ? (
            <div>
              <p className="text-xs font-medium text-gray-500 mt-1">{periodoLabel(b.periodo)}</p>
              <p className="text-xl font-black mt-1" style={{ color: ROJO }}>
                {formatCurrency(b.neto)}
              </p>
            </div>
          ) : (
            <p className="text-sm text-gray-400 mt-2">Sin boletas</p>
          )}
        </Card>

        {/* ── Vacaciones días gozados ── */}
        <Card to="/vacaciones" className="col-span-1 row-span-1 p-5 flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 rounded-t-3xl" style={{ background: ROJO, opacity: 0.15 }} />
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: GRIS }}>
            Días gozados
          </p>
          {loading ? (
            <Skel w="w-12" h="h-10" extra="mt-1" />
          ) : (
            <p className="text-5xl font-black" style={{ color: ROJO }}>
              {vac?.dias_gozados ?? vac?.DIAS_GOZADOS ?? '—'}
            </p>
          )}
          <p className="text-xs mt-1 font-medium" style={{ color: GRIS }}>
            {new Date().getFullYear()}
          </p>
        </Card>

        {/* ── Solicitudes pendientes ── */}
        <Link
          to="/vacaciones"
          className="col-span-2 row-span-1 rounded-3xl p-6 flex flex-col justify-center relative overflow-hidden group"
          style={{ background: ROJO }}
        >
          <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full opacity-20 bg-white" />
          <div className="absolute -bottom-6 right-16 w-24 h-24 rounded-full opacity-10 bg-white" />
          <h3 className="text-white text-sm font-bold relative z-10">Solicitudes pendientes</h3>
          {loading ? (
            <div className="h-4 bg-white/20 rounded-xl w-1/2 mt-2 animate-pulse z-10" />
          ) : (
            <p className="text-white/80 text-xs mt-1.5 relative z-10">
              {(vac?.dias_pendientes ?? vac?.DIAS_PENDIENTES)
                ? `Tienes ${vac.dias_pendientes ?? vac.DIAS_PENDIENTES} día(s) pendientes de aprobación.`
                : 'No tienes solicitudes de vacaciones pendientes.'}
            </p>
          )}
          <span className="mt-3 text-white/70 text-xs font-semibold flex items-center gap-1 relative z-10 group-hover:text-white transition-colors w-fit">
            Ver mis trámites
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </span>
        </Link>

      </div>

      {error && (
        <div className="mt-4 text-center text-sm text-gray-400">
          No se pudo cargar los datos del ERP. Tu información de cuenta sigue disponible.
        </div>
      )}

      {showWelcome && (
        <WelcomeModal
          nombre={user?.nom_trabajador ?? user?.usuario}
          onClose={cerrarWelcome}
        />
      )}
    </div>
  );
}
