import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { cambiarPasswordRequest } from '../../api/auth';

const ROJO = '#B11A1A';
const GRIS = '#8B8889';

function EyeIcon({ open }) {
  return open ? (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  );
}

function PasswordInput({ name, value, onChange, placeholder, autoComplete }) {
  const [visible, setVisible] = useState(false);
  const focusStyle = { boxShadow: `0 0 0 3px ${ROJO}30` };

  return (
    <div className="relative">
      <input
        type={visible ? 'text' : 'password'}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="w-full px-4 py-3 pr-10 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-800 placeholder-gray-300 focus:outline-none transition"
        onFocus={(e) => Object.assign(e.target.style, focusStyle)}
        onBlur={(e)  => { e.target.style.boxShadow = 'none'; }}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
        tabIndex={-1}
      >
        <EyeIcon open={visible} />
      </button>
    </div>
  );
}

export default function CambiarPassword() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    password_actual:             '',
    password_nuevo:              '',
    password_nuevo_confirmation: '',
  });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.password_actual) {
      setError('Ingresa tu contraseña actual.');
      return;
    }
    if (form.password_nuevo.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (form.password_nuevo !== form.password_nuevo_confirmation) {
      setError('Las contraseñas nuevas no coinciden.');
      return;
    }
    if (form.password_nuevo === form.password_actual) {
      setError('La nueva contraseña debe ser diferente a la actual.');
      return;
    }

    setLoading(true);
    try {
      await cambiarPasswordRequest(form);
      updateUser({ debe_cambiar_password: false });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Error al cambiar la contraseña. Verifica que la contraseña actual sea correcta.'
      );
    } finally {
      setLoading(false);
    }
  };

  const nombre = user?.nombre_completo || user?.usuario || 'Usuario';

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
          <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-white text-3xl font-bold mb-3">Seguridad de cuenta</h2>
          <p className="text-white/70 text-base max-w-xs">
            Elige una contraseña segura que solo tú conozcas para proteger tu información.
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
            <h1 className="text-2xl font-bold text-gray-900">Crea tu contraseña</h1>
            <p className="text-sm mt-1" style={{ color: GRIS }}>
              Hola <strong>{nombre}</strong>, es tu primer acceso.
              Por seguridad debes elegir una contraseña personal.
            </p>
          </div>

          {/* Aviso informativo */}
          <div className="mb-5 rounded-xl px-4 py-3 text-sm border flex gap-2 items-start"
            style={{ background: '#fef9f0', borderColor: '#fde68a', color: '#92400e' }}>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Tu contraseña actual es la que te proporcionó el administrador (generalmente tu DNI).</span>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-7">
            <form onSubmit={handleSubmit} className="space-y-5">

              <div>
                <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: GRIS }}>
                  Contraseña actual
                </label>
                <PasswordInput
                  name="password_actual"
                  value={form.password_actual}
                  onChange={handleChange}
                  placeholder="Tu contraseña actual"
                  autoComplete="current-password"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: GRIS }}>
                  Nueva contraseña
                </label>
                <PasswordInput
                  name="password_nuevo"
                  value={form.password_nuevo}
                  onChange={handleChange}
                  placeholder="Mínimo 6 caracteres"
                  autoComplete="new-password"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: GRIS }}>
                  Confirmar nueva contraseña
                </label>
                <PasswordInput
                  name="password_nuevo_confirmation"
                  value={form.password_nuevo_confirmation}
                  onChange={handleChange}
                  placeholder="Repite la nueva contraseña"
                  autoComplete="new-password"
                />
              </div>

              {/* Indicador de coincidencia */}
              {form.password_nuevo && form.password_nuevo_confirmation && (
                <p className={`text-xs font-medium ${
                  form.password_nuevo === form.password_nuevo_confirmation
                    ? 'text-green-600'
                    : 'text-red-500'
                }`}>
                  {form.password_nuevo === form.password_nuevo_confirmation
                    ? '✓ Las contraseñas coinciden'
                    : '✗ Las contraseñas no coinciden'}
                </p>
              )}

              {error && (
                <div className="rounded-xl px-4 py-3 text-sm border"
                  style={{ background: '#fdf2f2', borderColor: '#fecaca', color: ROJO }}>
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
                    Guardando...
                  </span>
                ) : 'Guardar contraseña'}
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
