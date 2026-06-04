import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const ROJO = '#B11A1A';
const GRIS = '#8B8889';

export default function Login() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [form, setForm]     = useState({ usuario: '', password: '' });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.usuario.trim() || !form.password) {
      setError('Por favor completa todos los campos.');
      return;
    }
    setLoading(true);
    try {
      await login(form.usuario.trim(), form.password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.errors?.usuario?.[0] ||
        'Credenciales incorrectas. Intenta nuevamente.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const focusStyle = { boxShadow: `0 0 0 3px ${ROJO}30` };

  return (
    <div className="min-h-screen flex">

      {/* ── Panel izquierdo decorativo ── */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center p-12 relative overflow-hidden"
        style={{ background: ROJO }}
      >
        <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full opacity-10 bg-white" />
        <div className="absolute -bottom-32 -right-16 w-96 h-96 rounded-full opacity-10 bg-white" />
        <div className="absolute top-1/3 right-8 w-32 h-32 rounded-full opacity-10 bg-white" />

        <div className="relative z-10 text-center">
          <img
            src="/logo.png"
            alt="Clínica La Luz"
            className="h-24 object-contain mx-auto mb-8 drop-shadow-lg"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <h2 className="text-white text-3xl font-bold mb-3">Portal del Empleado</h2>
          <p className="text-white/70 text-base max-w-xs">
            Accede a tus boletas, vacaciones y toda la información de tu contrato en un solo lugar.
          </p>
        </div>
      </div>

      {/* ── Panel derecho — formulario ── */}
      <div className="flex-1 flex items-center justify-center bg-gray-50 p-6">
        <div className="w-full max-w-sm">

          {/* Logo móvil */}
          <div className="lg:hidden flex justify-center mb-8">
            <img
              src="/logo.png"
              alt="Clínica La Luz"
              className="h-16 object-contain"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Bienvenido</h1>
            <p className="text-sm mt-1" style={{ color: GRIS }}>
              Ingresa con tus credenciales del sistema
            </p>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-7">
            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Usuario */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: GRIS }}>
                  Usuario
                </label>
                <input
                  type="text"
                  name="usuario"
                  value={form.usuario}
                  onChange={handleChange}
                  placeholder="Ej: j.garcia"
                  autoComplete="username"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-800 placeholder-gray-300 focus:outline-none transition"
                  onFocus={(e) => Object.assign(e.target.style, focusStyle)}
                  onBlur={(e) => { e.target.style.boxShadow = 'none'; }}
                />
              </div>

              {/* Contraseña */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: GRIS }}>
                  Contraseña
                </label>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-800 placeholder-gray-300 focus:outline-none transition"
                  onFocus={(e) => Object.assign(e.target.style, focusStyle)}
                  onBlur={(e) => { e.target.style.boxShadow = 'none'; }}
                />
              </div>

              {error && (
                <div className="rounded-xl px-4 py-3 text-sm border" style={{ background: '#fdf2f2', borderColor: '#fecaca', color: ROJO }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 text-white text-sm font-bold rounded-xl disabled:opacity-60 disabled:cursor-not-allowed transition-all active:scale-95"
                style={{ background: loading ? GRIS : ROJO }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Ingresando...
                  </span>
                ) : 'Ingresar'}
              </button>
            </form>
          </div>

          <p className="text-center text-xs mt-6" style={{ color: GRIS }}>
            Grupo Clínica La Luz &copy; {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
}
