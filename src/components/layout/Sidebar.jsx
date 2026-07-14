import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

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
];

// ─────────────────────────────────────────────────────────────────────────────
// Contenido del sidebar (compartido entre desktop y drawer móvil)
// ─────────────────────────────────────────────────────────────────────────────
function SidebarContent({ onClose }) {
  const { user, empresa, logout } = useAuth();
  const navigate = useNavigate();

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
        {navItems.map((item) => (
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
