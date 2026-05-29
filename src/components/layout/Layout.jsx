import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Bloquear scroll del body cuando el drawer móvil está abierto
  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isSidebarOpen]);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* ── Header móvil ── solo visible en < md ──────────────── */}
        <header className="md:hidden shrink-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
          {/* Botón hamburguesa */}
          <button
            onClick={() => setIsSidebarOpen(true)}
            aria-label="Abrir menú"
            className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5" style={{ color: '#8B8889' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Logo / marca */}
          <div className="flex items-center gap-2 flex-1">
            <img
              src="/clinica_la_luz_isotipo.png"
              alt=""
              className="h-7 w-7 object-contain"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            <span className="font-bold text-base" style={{ color: '#B11A1A' }}>
              Clínica La Luz
            </span>
          </div>
        </header>

        {/* ── Contenido principal ───────────────────────────────── */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>

      </div>
    </div>
  );
}
