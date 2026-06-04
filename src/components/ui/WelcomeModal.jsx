import { useEffect, useState, useRef } from 'react';

const ROJO  = '#B11A1A';
const DURACION_MS = 5000;

// ── Animaciones via <style> inyectado ─────────────────────────────────────
const CSS = `
@keyframes wm-backdrop { from { opacity:0 } to { opacity:1 } }
@keyframes wm-card     { from { opacity:0; transform:scale(.88) translateY(24px) }
                           to { opacity:1; transform:scale(1)   translateY(0)    } }
@keyframes wm-texto    { from { opacity:0; transform:translateY(12px) }
                           to { opacity:1; transform:translateY(0)    } }
@keyframes wm-barra    { from { width:0% } to { width:100% } }
@keyframes wm-pulse-dot{ 0%,100%{ transform:scale(1) } 50%{ transform:scale(1.3) } }

.wm-backdrop { animation: wm-backdrop 0.35s ease both }
.wm-card     { animation: wm-card     0.45s cubic-bezier(.22,1,.36,1) 0.05s both }
.wm-t1       { animation: wm-texto    0.4s ease 0.3s  both }
.wm-t2       { animation: wm-texto    0.4s ease 0.45s both }
.wm-t3       { animation: wm-texto    0.4s ease 0.6s  both }
.wm-t4       { animation: wm-texto    0.4s ease 0.75s both }
.wm-barra    { animation: wm-barra    ${DURACION_MS}ms linear 0.9s both }
.wm-dot      { animation: wm-pulse-dot 1.6s ease-in-out infinite }
`;

export default function WelcomeModal({ nombre, onClose }) {
  const [saliendo, setSaliendo] = useState(false);
  const timerRef  = useRef(null);
  const barraRef  = useRef(null);

  // Auto-cierre después de DURACION_MS
  useEffect(() => {
    timerRef.current = setTimeout(cerrar, DURACION_MS + 900);
    return () => clearTimeout(timerRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function cerrar() {
    if (saliendo) return;
    setSaliendo(true);
    clearTimeout(timerRef.current);
    setTimeout(onClose, 380);
  }

  // Saludo según hora
  const hora = new Date().getHours();
  const saludo = hora < 12 ? 'Buenos días' : hora < 19 ? 'Buenas tardes' : 'Buenas noches';

  const primerNombre = nombre
    ? nombre.split(' ')[0].charAt(0).toUpperCase() + nombre.split(' ')[0].slice(1).toLowerCase()
    : 'Colaborador';

  return (
    <>
      <style>{CSS}</style>

      {/* Backdrop */}
      <div
        className="wm-backdrop fixed inset-0 z-[200] flex items-center justify-center p-4"
        style={{
          background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(6px)',
          opacity: saliendo ? 0 : undefined,
          transition: saliendo ? 'opacity 0.35s ease' : undefined,
        }}
        onClick={cerrar}
      >
        {/* Card */}
        <div
          className="wm-card relative bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden"
          style={{
            opacity: saliendo ? 0 : undefined,
            transform: saliendo ? 'scale(.9) translateY(16px)' : undefined,
            transition: saliendo ? 'opacity .35s ease, transform .35s ease' : undefined,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Barra de color en la parte superior */}
          <div className="h-1.5 w-full" style={{ background: ROJO }} />

          {/* Cuerpo */}
          <div className="px-8 pt-8 pb-6 text-center">

            {/* Logo */}
            <div className="wm-t1 flex justify-center mb-5">
              <img
                src="/logo.png"
                alt="Clínica La Luz"
                className="h-14 object-contain"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              {/* Fallback si no hay logo */}
              <div
                className="hidden w-14 h-14 rounded-full items-center justify-center text-white font-black text-xl"
                style={{ background: ROJO }}
              >
                CL
              </div>
            </div>

            {/* Dot animado */}
            <div className="wm-t1 flex justify-center gap-1.5 mb-4">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="wm-dot w-1.5 h-1.5 rounded-full"
                  style={{ background: ROJO, animationDelay: `${i * 0.2}s` }}
                />
              ))}
            </div>

            {/* Saludo */}
            <p className="wm-t2 text-sm font-semibold uppercase tracking-widest text-gray-400 mb-1">
              {saludo}
            </p>

            {/* Nombre */}
            <h1 className="wm-t2 text-4xl font-black leading-none mb-2" style={{ color: ROJO }}>
              {primerNombre}
            </h1>

            {/* Subtítulo */}
            <p className="wm-t3 text-base font-semibold text-gray-700 mb-4">
              Bienvenido/a a tu Intranet
              <br />
              <span className="font-black" style={{ color: ROJO }}>Clínica La Luz</span>
            </p>

            {/* Mensaje */}
            <p className="wm-t4 text-sm text-gray-500 leading-relaxed mb-7 max-w-xs mx-auto">
              Aquí encontrarás tus boletas de pago, solicitudes de vacaciones
              y toda tu información laboral en un solo lugar.
            </p>

            {/* Botón principal */}
            <button
              onClick={cerrar}
              className="wm-t4 w-full py-3.5 rounded-2xl text-white font-bold text-sm tracking-wide transition-all active:scale-95 hover:opacity-90 shadow-md"
              style={{ background: ROJO }}
            >
              Comenzar
            </button>

          </div>

          {/* Barra de progreso auto-cierre */}
          <div className="h-1 w-full bg-gray-100">
            <div
              ref={barraRef}
              className="wm-barra h-full"
              style={{ background: ROJO }}
            />
          </div>
        </div>
      </div>
    </>
  );
}
