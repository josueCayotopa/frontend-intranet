import { createContext, useState, useCallback, useEffect, useRef } from 'react';
import { loginRequest, meRequest, pingRequest, logoutRequest } from '../api/auth';

export const AuthContext = createContext(null);

const INACTIVITY_MS  = 30 * 60 * 1000; // 30 minutos
const WARNING_MS     = 25 * 60 * 1000; // aviso a los 25 minutos
const PING_MS        = 5  * 60 * 1000; // ping al backend cada 5 minutos
const PING_IDLE_GATE = 6  * 60 * 1000; // no pingar si el usuario estuvo inactivo >6 min

function readSession(key) {
  try { return JSON.parse(sessionStorage.getItem(key)); } catch { return null; }
}

// ── Modal de advertencia de inactividad ───────────────────────────────────────
function InactivityWarning({ secondsLeft, onContinue, onLogout }) {
  const ROJO = '#B11A1A';
  const [secs, setSecs] = useState(secondsLeft);

  useEffect(() => {
    const id = setInterval(() => setSecs((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, []);

  const mm = String(Math.floor(secs / 60)).padStart(2, '0');
  const ss = String(secs % 60).padStart(2, '0');

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full mx-4 text-center">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ background: '#fdf2f2' }}
        >
          <svg className="w-8 h-8" fill="none" stroke={ROJO} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Sesión por expirar</h2>
        <p className="text-sm text-gray-500 mb-4">
          Tu sesión se cerrará automáticamente por inactividad en:
        </p>
        <p className="text-4xl font-black mb-6" style={{ color: ROJO }}>
          {mm}:{ss}
        </p>
        <div className="flex gap-3">
          <button
            onClick={onLogout}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all"
          >
            Cerrar sesión
          </button>
          <button
            onClick={onContinue}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all active:scale-95"
            style={{ background: ROJO }}
          >
            Continuar
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Provider ──────────────────────────────────────────────────────────────────
export function AuthProvider({ children }) {
  const [token,   setToken]   = useState(() => sessionStorage.getItem('token'));
  const [user,    setUser]    = useState(() => readSession('user'));
  const [empresa, setEmpresa] = useState(() => readSession('empresa'));
  const [showWarning, setShowWarning] = useState(false);

  const lastActivityRef = useRef(Date.now());
  const warningTimerRef = useRef(null);
  const logoutTimerRef  = useRef(null);
  const pingTimerRef    = useRef(null);

  // ── Limpiar sesión ─────────────────────────────────────────────────────────
  const clearSession = useCallback(() => {
    ['token', 'user', 'empresa'].forEach((k) => sessionStorage.removeItem(k));
    setToken(null);
    setUser(null);
    setEmpresa(null);
    setShowWarning(false);
    clearTimeout(warningTimerRef.current);
    clearTimeout(logoutTimerRef.current);
    clearInterval(pingTimerRef.current);
  }, []);

  // ── Escuchar evento 401 del interceptor axios ──────────────────────────────
  useEffect(() => {
    window.addEventListener('auth:expired', clearSession);
    return () => window.removeEventListener('auth:expired', clearSession);
  }, [clearSession]);

  // ── Refrescar datos del usuario al montar (si hay sesión activa) ───────────
  useEffect(() => {
    if (!token) return;
    meRequest()
      .then(({ data }) => {
        const payload = data.data;
        sessionStorage.setItem('user',    JSON.stringify(payload.usuario));
        sessionStorage.setItem('empresa', JSON.stringify(payload.empresa));
        setUser(payload.usuario);
        setEmpresa(payload.empresa);
      })
      .catch(() => {
        // 401 ya lo maneja el interceptor; otros errores conservan la sesión
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Reiniciar contadores de inactividad ────────────────────────────────────
  const resetTimers = useCallback(() => {
    lastActivityRef.current = Date.now();
    setShowWarning(false);

    clearTimeout(warningTimerRef.current);
    clearTimeout(logoutTimerRef.current);

    warningTimerRef.current = setTimeout(() => setShowWarning(true), WARNING_MS);
    logoutTimerRef.current  = setTimeout(() => {
      logoutRequest().catch(() => {}).finally(() => clearSession());
    }, INACTIVITY_MS);
  }, [clearSession]);

  // ── Escuchar actividad del usuario ─────────────────────────────────────────
  useEffect(() => {
    if (!token) return;

    const EVENTS = ['mousemove', 'keydown', 'mousedown', 'touchstart', 'scroll'];
    const onActivity = () => resetTimers();
    EVENTS.forEach((ev) => window.addEventListener(ev, onActivity, { passive: true }));

    resetTimers(); // arrancar los timers al iniciar sesión

    return () => {
      EVENTS.forEach((ev) => window.removeEventListener(ev, onActivity));
      clearTimeout(warningTimerRef.current);
      clearTimeout(logoutTimerRef.current);
    };
  }, [token, resetTimers]);

  // ── Ping periódico al backend (actualiza fec_ultimo_acceso) ───────────────
  useEffect(() => {
    if (!token) return;

    pingTimerRef.current = setInterval(() => {
      const idleMs = Date.now() - lastActivityRef.current;
      if (idleMs < PING_IDLE_GATE) {
        pingRequest().catch(() => {});
      }
    }, PING_MS);

    return () => clearInterval(pingTimerRef.current);
  }, [token]);

  // ── Login ──────────────────────────────────────────────────────────────────
  const login = useCallback(async (usuario, password) => {
    const { data } = await loginRequest(usuario, password);
    const payload = data.data;

    sessionStorage.setItem('token',   payload.token);
    sessionStorage.setItem('user',    JSON.stringify(payload.usuario));
    sessionStorage.setItem('empresa', JSON.stringify(payload.empresa));

    setToken(payload.token);
    setUser(payload.usuario);
    setEmpresa(payload.empresa);

    return payload;
  }, []);

  // ── Logout ─────────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    logoutRequest().catch(() => {}).finally(() => clearSession());
  }, [clearSession]);

  // ── Actualizar datos del usuario en contexto ───────────────────────────────
  const updateUser = useCallback((changes) => {
    setUser((prev) => {
      const updated = { ...prev, ...changes };
      sessionStorage.setItem('user', JSON.stringify(updated));
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{ token, user, empresa, login, logout, updateUser, isAuthenticated: !!token }}
    >
      {children}
      {showWarning && token && (
        <InactivityWarning
          secondsLeft={300}
          onContinue={resetTimers}
          onLogout={logout}
        />
      )}
    </AuthContext.Provider>
  );
}
