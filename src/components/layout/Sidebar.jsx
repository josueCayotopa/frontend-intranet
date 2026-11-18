import { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getEsJefe } from '../../api/equipo';

const ROJO = '#B11A1A';
const GRIS = '#8B8889';

const navItems = [
  {
    to: '/dashboard',
    label: 'Inicio',
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    to: '/perfil',
    label: 'Mi Perfil',
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    to: '/remuneraciones',
    label: 'Remuneraciones',
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    to: '/vacaciones',
    label: 'Vacaciones',
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
];

const adminItems = [
  {
    to: '/admin/usuarios',
    label: 'Usuarios',
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
  },
  {
    to: '/admin/empresas',
    label: 'Empresas',
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 4h1m4 0h1" />
      </svg>
    ),
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Contenido del sidebar (compartido entre desktop y drawer móvil)
// ─────────────────────────────────────────────────────────────────────────────
// Solo para aprobadores de evaluaciones (users.usuario = su login en alguna empresa).
const aprobacionesItem = {
  to: '/equipo/aprobaciones',
  label: 'Aprobar evaluaciones',
  icon: (
    <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),
};

// Solo para jefes: aprobar las solicitudes de vacaciones de su personal.
const vacacionesItem = {
  to: '/equipo/vacaciones',
  label: 'Aprobar vacaciones',
  icon: (
    <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2zm4-5l2 2 4-4" />
    </svg>
  ),
};

// Solo para jefes: personal a cargo en la intranet (COD_PERSONAL_JEFE).
const equipoItem = {
  to: '/equipo/evaluaciones',
  label: 'Evaluar a mi personal',
  icon: (
    <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  ),
};

function SidebarContent({ onClose }) {
  const { user, empresa, logout } = useAuth();
  const navigate = useNavigate();
  const [esJefe, setEsJefe] = useState(false);

  const [vacPendientes, setVacPendientes] = useState(0);
  const [esAprobador, setEsAprobador] = useState(false);
  const [aprobPendientes, setAprobPendientes] = useState(0);

  useEffect(() => {
    let vigente = true;
    const cargar = () => getEsJefe()
      .then(({ data }) => {
        if (!vigente) return;
        setEsJefe(Boolean(data.data?.es_jefe));
        setVacPendientes(Number(data.data?.vacaciones_pendientes ?? 0));
        setEsAprobador(Boolean(data.data?.es_aprobador));
        setAprobPendientes(Number(data.data?.aprobaciones_pendientes ?? 0));
      })
      .catch(() => {});
    cargar();
    // Las páginas del jefe y del aprobador avisan cuando deciden, para refrescar los contadores.
    window.addEventListener('equipo:actualizado', cargar);
    return () => { vigente = false; window.removeEventListener('equipo:actualizado', cargar); };
  }, []);

  const items = [
    ...navItems,
    ...(esJefe ? [vacacionesItem, equipoItem] : []),
    ...(esAprobador ? [aprobacionesItem] : []),
  ];
  const contador = (item) => (item === vacacionesItem ? vacPendientes : item === aprobacionesItem ? aprobPendientes : 0);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="h-full w-full flex flex-col bg-white">

      {/* Cabecera del sidebar */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <img
            src="/clinica_la_luz_isotipo.png"
            alt=""
            className="h-8 w-8 object-contain shrink-0"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-widest truncate" style={{ color: GRIS }}>
              Intranet
            </p>
            <h1 className="text-base font-bold leading-tight truncate" style={{ color: ROJO }}>
              Clínica La Luz
            </h1>
          </div>
        </div>

        {/* Botón cerrar — solo se renderiza en el drawer móvil */}
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Cerrar menú"
            className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Empresa */}
      {empresa && (
        <div className="px-5 py-2 border-b border-gray-50">
          <p className="text-xs truncate" style={{ color: GRIS }}>
            {typeof empresa === 'string' ? empresa : empresa.nombre}
          </p>
        </div>
      )}

      {/* Navegación */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onClose ?? undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all ${
                isActive ? '' : 'hover:bg-gray-50 active:scale-95'
              }`
            }
            style={({ isActive }) =>
              isActive
                ? { background: ROJO, color: '#fff' }
                : { color: '#374151' }
            }
          >
            {item.icon}
            <span className="flex-1">{item.label}</span>
            {contador(item) > 0 && (
              <span className="min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-bold flex items-center justify-center bg-amber-100 text-amber-800"
                aria-label={`${contador(item)} por atender`}>
                {contador(item)}
              </span>
            )}
          </NavLink>
        ))}

        {/* Sección Administración — solo visible para ADMIN */}
        {user?.rol === 'ADMIN' && (
          <>
            <div className="pt-3 pb-1">
              <p className="px-3 text-[10px] font-bold uppercase tracking-widest" style={{ color: GRIS }}>
                Administración
              </p>
            </div>

            {adminItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose ?? undefined}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive ? '' : 'hover:bg-gray-50 active:scale-95'
                  }`
                }
                style={({ isActive }) =>
                  isActive
                    ? { background: ROJO, color: '#fff' }
                    : { color: '#374151' }
                }
              >
                {item.icon}
                <span>{item.label}</span>
              </NavLink>
            ))}
          </>
        )}
      </nav>

      {/* Footer: usuario + logout */}
      <div className="px-4 py-4 border-t border-gray-100 shrink-0">
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
            style={{ background: ROJO }}
          >
            {(user?.nom_trabajador ?? user?.usuario ?? 'U').charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-800 truncate">
              {user?.nom_trabajador
                ? `${user.nom_trabajador} ${user.ape_paterno ?? ''}`.trim()
                : (user?.usuario ?? 'Usuario')}
            </p>
            <p className="text-xs truncate" style={{ color: GRIS }}>{user?.usuario}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2.5 text-sm rounded-xl hover:bg-red-50 active:bg-red-100 transition-colors font-medium"
          style={{ color: ROJO }}
        >
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sidebar principal — desktop fijo + drawer móvil
// ─────────────────────────────────────────────────────────────────────────────
export default function Sidebar({ isOpen = false, onClose }) {
  return (
    <>
      {/* ── Desktop (≥ md): panel fijo en el lado izquierdo ── */}
      <aside className="hidden md:flex md:flex-col md:w-64 md:shrink-0 border-r border-gray-100 h-full">
        <SidebarContent onClose={null} />
      </aside>

      {/* ── Móvil (< md): overlay oscuro ── */}
      <div
        role="presentation"
        aria-hidden="true"
        className="md:hidden fixed inset-0 z-40 bg-black/50 transition-opacity duration-300"
        style={{
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
        }}
        onClick={onClose}
      />

      {/* ── Móvil (< md): drawer deslizante ── */}
      <aside
        className="md:hidden fixed inset-y-0 left-0 z-50 w-72 shadow-2xl transition-transform duration-300 ease-in-out"
        style={{ transform: isOpen ? 'translateX(0)' : 'translateX(-100%)' }}
        aria-label="Menú de navegación"
      >
        <SidebarContent onClose={onClose} />
      </aside>
    </>
  );
}
