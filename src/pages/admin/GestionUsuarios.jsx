import { useEffect, useState, useCallback } from 'react';
import {
  getEmpresas,
  getUsuarios,
  crearUsuario,
  editarUsuario,
  toggleActivo,
  cambiarPassword,
} from '../../api/usuarios';

const ROJO = '#B11A1A';
const GRIS = '#8B8889';

// ── Helpers ────────────────────────────────────────────────────────────────
function cls(...args) {
  return args.filter(Boolean).join(' ');
}

// ── Spinner ────────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="w-8 h-8 rounded-full border-4 border-gray-200 border-t-red-700 animate-spin" />
    </div>
  );
}

// ── Badge estado ───────────────────────────────────────────────────────────
function BadgeActivo({ activo }) {
  return (
    <span
      className={cls(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold',
        activo ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
      )}
    >
      <span className={cls('w-1.5 h-1.5 rounded-full', activo ? 'bg-emerald-500' : 'bg-gray-400')} />
      {activo ? 'Activo' : 'Inactivo'}
    </span>
  );
}

// ── Toast ──────────────────────────────────────────────────────────────────
function Toast({ msg, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  const bg = type === 'error' ? 'bg-red-600' : 'bg-emerald-600';
  return (
    <div
      className={cls(
        'fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl text-white text-sm font-medium max-w-sm',
        bg
      )}
    >
      <span className="flex-1">{msg}</span>
      <button onClick={onClose} className="shrink-0 opacity-70 hover:opacity-100">✕</button>
    </div>
  );
}

// ── Modal base ─────────────────────────────────────────────────────────────
function Modal({ title, onClose, children, footer }) {
  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100 flex items-center justify-between shrink-0">
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
          >
            ✕
          </button>
        </div>
        {/* Body */}
        <div className="px-6 py-5 overflow-y-auto flex-1">{children}</div>
        {/* Footer */}
        {footer && (
          <div className="px-6 pb-6 pt-2 border-t border-gray-100 shrink-0 flex gap-3 justify-end">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Campo de formulario ────────────────────────────────────────────────────
function Field({ label, error, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}

function Input({ error, ...props }) {
  return (
    <input
      {...props}
      className={cls(
        'w-full px-3 py-2.5 rounded-xl border text-sm outline-none transition-colors',
        error
          ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-200'
          : 'border-gray-200 focus:border-red-400 focus:ring-1 focus:ring-red-100'
      )}
    />
  );
}

function Select({ error, children, ...props }) {
  return (
    <select
      {...props}
      className={cls(
        'w-full px-3 py-2.5 rounded-xl border text-sm outline-none bg-white transition-colors',
        error
          ? 'border-red-400 focus:border-red-500'
          : 'border-gray-200 focus:border-red-400'
      )}
    >
      {children}
    </select>
  );
}

// ── Modal Crear / Editar usuario ───────────────────────────────────────────
const FORM_INIT = {
  empresa_id: '',
  cod_personal: '',
  dni: '',
  usuario: '',
  password: '',
  password_confirmation: '',
  foto_url: '',
  activo: true,
};

function ModalUsuario({ modo, usuario, empresas, onClose, onGuardado }) {
  const [form, setForm] = useState(
    modo === 'editar'
      ? {
          empresa_id: usuario.empresa_id ?? '',
          cod_personal: usuario.cod_personal ?? '',
          dni: usuario.dni ?? '',
          usuario: usuario.usuario ?? '',
          password: '',
          password_confirmation: '',
          foto_url: usuario.foto_url ?? '',
          activo: usuario.activo ?? true,
        }
      : FORM_INIT
  );
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const set = (key) => (e) =>
    setForm((p) => ({ ...p, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.empresa_id)    e.empresa_id    = 'Selecciona una empresa.';
    if (!form.cod_personal.trim()) e.cod_personal = 'Campo requerido.';
    if (!form.dni.trim())         e.dni          = 'Campo requerido.';
    if (!form.usuario.trim())     e.usuario      = 'Campo requerido.';
    if (modo === 'crear') {
      if (!form.password)           e.password      = 'Campo requerido.';
      else if (form.password.length < 6) e.password = 'Mínimo 6 caracteres.';
      if (form.password !== form.password_confirmation) e.password_confirmation = 'Las contraseñas no coinciden.';
    }
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }

    setLoading(true);
    try {
      const payload = { ...form };
      if (modo === 'editar') { delete payload.password; delete payload.password_confirmation; }
      if (!payload.foto_url) delete payload.foto_url;

      if (modo === 'crear') {
        await crearUsuario(payload);
      } else {
        await editarUsuario(usuario.id, payload);
      }
      onGuardado();
    } catch (err) {
      const apiErrors = err.response?.data?.errors ?? {};
      setErrors(
        Object.keys(apiErrors).length
          ? Object.fromEntries(Object.entries(apiErrors).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]))
          : { general: err.response?.data?.message ?? 'Error al guardar.' }
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={modo === 'crear' ? 'Nuevo usuario' : 'Editar usuario'}
      onClose={onClose}
      footer={
        <>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-5 py-2 rounded-xl text-sm font-semibold text-white transition-colors disabled:opacity-60"
            style={{ background: ROJO }}
          >
            {loading ? 'Guardando…' : 'Guardar'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {errors.general && (
          <p className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2">{errors.general}</p>
        )}

        <Field label="Empresa" error={errors.empresa_id}>
          <Select value={form.empresa_id} onChange={set('empresa_id')} error={errors.empresa_id}>
            <option value="">Selecciona empresa…</option>
            {empresas.map((e) => (
              <option key={e.id} value={e.id}>{e.nombre}</option>
            ))}
          </Select>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Cód. Personal" error={errors.cod_personal}>
            <Input value={form.cod_personal} onChange={set('cod_personal')} placeholder="000101" error={errors.cod_personal} />
          </Field>
          <Field label="DNI" error={errors.dni}>
            <Input value={form.dni} onChange={set('dni')} placeholder="12345678" error={errors.dni} />
          </Field>
        </div>

        <Field label="Usuario" error={errors.usuario}>
          <Input value={form.usuario} onChange={set('usuario')} placeholder="j.apellido" autoComplete="off" error={errors.usuario} />
        </Field>

        {modo === 'crear' && (
          <>
            <Field label="Contraseña" error={errors.password}>
              <Input type="password" value={form.password} onChange={set('password')} autoComplete="new-password" error={errors.password} />
            </Field>
            <Field label="Confirmar contraseña" error={errors.password_confirmation}>
              <Input type="password" value={form.password_confirmation} onChange={set('password_confirmation')} autoComplete="new-password" error={errors.password_confirmation} />
            </Field>
          </>
        )}

        <Field label="Foto URL (opcional)" error={errors.foto_url}>
          <Input value={form.foto_url} onChange={set('foto_url')} placeholder="https://…" error={errors.foto_url} />
        </Field>

        <label className="flex items-center gap-2.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={form.activo}
            onChange={set('activo')}
            className="w-4 h-4 rounded accent-red-700"
          />
          <span className="text-sm text-gray-700 font-medium">Usuario activo</span>
        </label>
      </div>
    </Modal>
  );
}

// ── Modal Cambiar contraseña ───────────────────────────────────────────────
function ModalPassword({ usuario, onClose, onGuardado }) {
  const [form, setForm] = useState({ password: '', password_confirmation: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const set = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }));

  const handleSubmit = async () => {
    const e = {};
    if (!form.password || form.password.length < 6) e.password = 'Mínimo 6 caracteres.';
    if (form.password !== form.password_confirmation) e.password_confirmation = 'No coinciden.';
    if (Object.keys(e).length) { setErrors(e); return; }

    setLoading(true);
    try {
      await cambiarPassword(usuario.id, form);
      onGuardado();
    } catch (err) {
      setErrors({ general: err.response?.data?.message ?? 'Error al cambiar contraseña.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={`Cambiar contraseña — ${usuario.usuario}`}
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800">
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-5 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
            style={{ background: ROJO }}
          >
            {loading ? 'Guardando…' : 'Cambiar'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {errors.general && (
          <p className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2">{errors.general}</p>
        )}
        <Field label="Nueva contraseña" error={errors.password}>
          <Input type="password" value={form.password} onChange={set('password')} autoComplete="new-password" error={errors.password} />
        </Field>
        <Field label="Confirmar contraseña" error={errors.password_confirmation}>
          <Input type="password" value={form.password_confirmation} onChange={set('password_confirmation')} autoComplete="new-password" error={errors.password_confirmation} />
        </Field>
      </div>
    </Modal>
  );
}

// ── Página principal ───────────────────────────────────────────────────────
export default function GestionUsuarios() {
  const [usuarios, setUsuarios]   = useState([]);
  const [empresas, setEmpresas]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [toast, setToast]         = useState(null);

  // Filtros
  const [filtroEmpresa, setFiltroEmpresa] = useState('');
  const [filtroBuscar,  setFiltroBuscar]  = useState('');
  const [filtroActivo,  setFiltroActivo]  = useState('');

  // Modales
  const [modalCrear,    setModalCrear]    = useState(false);
  const [modalEditar,   setModalEditar]   = useState(null);  // usuario seleccionado
  const [modalPassword, setModalPassword] = useState(null);  // usuario seleccionado

  const showToast = (msg, type = 'ok') => setToast({ msg, type });

  // Carga inicial de empresas (una sola vez)
  useEffect(() => {
    getEmpresas()
      .then(({ data }) => setEmpresas(data.data ?? []))
      .catch(() => {});
  }, []);

  const cargarUsuarios = useCallback(() => {
    setLoading(true);
    const params = {};
    if (filtroEmpresa) params.empresa_id = filtroEmpresa;
    if (filtroBuscar)  params.buscar     = filtroBuscar;
    if (filtroActivo !== '') params.activo = filtroActivo;

    getUsuarios(params)
      .then(({ data }) => setUsuarios(data.data ?? []))
      .catch(() => showToast('Error al cargar usuarios.', 'error'))
      .finally(() => setLoading(false));
  }, [filtroEmpresa, filtroBuscar, filtroActivo]);

  useEffect(() => {
    cargarUsuarios();
  }, [cargarUsuarios]);

  const handleToggle = async (u) => {
    try {
      await toggleActivo(u.id);
      showToast(`Usuario ${u.activo ? 'desactivado' : 'activado'} correctamente.`);
      cargarUsuarios();
    } catch {
      showToast('Error al cambiar estado.', 'error');
    }
  };

  const handleGuardado = (msg) => {
    setModalCrear(false);
    setModalEditar(null);
    setModalPassword(null);
    showToast(msg ?? 'Guardado correctamente.');
    cargarUsuarios();
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-5">
      {/* ── Encabezado ── */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h1>
          <p className="text-sm mt-0.5" style={{ color: GRIS }}>
            Administra los accesos a la intranet
          </p>
        </div>
        <button
          onClick={() => setModalCrear(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white shadow-sm hover:opacity-90 active:scale-95 transition-all shrink-0"
          style={{ background: ROJO }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo
        </button>
      </div>

      {/* ── Filtros ── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-wrap gap-3">
        {/* Empresa */}
        <select
          value={filtroEmpresa}
          onChange={(e) => setFiltroEmpresa(e.target.value)}
          className="px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 bg-white focus:border-red-400 focus:ring-1 focus:ring-red-100 outline-none min-w-[160px]"
        >
          <option value="">Todas las empresas</option>
          {empresas.map((e) => (
            <option key={e.id} value={e.id}>{e.nombre}</option>
          ))}
        </select>

        {/* Búsqueda */}
        <div className="flex-1 min-w-[180px] relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={filtroBuscar}
            onChange={(e) => setFiltroBuscar(e.target.value)}
            placeholder="Buscar usuario, DNI, cód.personal…"
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 text-sm focus:border-red-400 focus:ring-1 focus:ring-red-100 outline-none"
          />
        </div>

        {/* Estado */}
        <select
          value={filtroActivo}
          onChange={(e) => setFiltroActivo(e.target.value)}
          className="px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 bg-white focus:border-red-400 focus:ring-1 focus:ring-red-100 outline-none"
        >
          <option value="">Todos los estados</option>
          <option value="1">Solo activos</option>
          <option value="0">Solo inactivos</option>
        </select>
      </div>

      {/* ── Tabla / lista ── */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <Spinner />
        ) : usuarios.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-sm">
            No se encontraron usuarios.
          </div>
        ) : (
          <>
            {/* Vista desktop — tabla */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left">
                    {['Usuario', 'Empresa', 'Cód. Personal', 'DNI', 'Estado', ''].map((h) => (
                      <th key={h} className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider" style={{ color: GRIS }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {usuarios.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                            style={{ background: ROJO }}
                          >
                            {u.usuario?.charAt(0)?.toUpperCase() ?? 'U'}
                          </div>
                          <span className="font-medium text-gray-800">{u.usuario}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-gray-600 max-w-[180px] truncate">{u.empresa_nombre}</td>
                      <td className="px-5 py-3.5 text-gray-600 font-mono">{u.cod_personal}</td>
                      <td className="px-5 py-3.5 text-gray-600">{u.dni}</td>
                      <td className="px-5 py-3.5"><BadgeActivo activo={u.activo} /></td>
                      <td className="px-5 py-3.5">
                        <AccionesRow u={u} onEditar={() => setModalEditar(u)} onPassword={() => setModalPassword(u)} onToggle={() => handleToggle(u)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Vista móvil — cards */}
            <div className="md:hidden divide-y divide-gray-50">
              {usuarios.map((u) => (
                <div key={u.id} className="p-4 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                        style={{ background: ROJO }}
                      >
                        {u.usuario?.charAt(0)?.toUpperCase() ?? 'U'}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-800 truncate">{u.usuario}</p>
                        <p className="text-xs truncate" style={{ color: GRIS }}>{u.empresa_nombre}</p>
                      </div>
                    </div>
                    <BadgeActivo activo={u.activo} />
                  </div>
                  <div className="flex gap-4 text-xs text-gray-500 pl-12">
                    <span><span className="font-medium text-gray-700">Cód:</span> {u.cod_personal}</span>
                    <span><span className="font-medium text-gray-700">DNI:</span> {u.dni}</span>
                  </div>
                  <div className="pl-12">
                    <AccionesRow u={u} onEditar={() => setModalEditar(u)} onPassword={() => setModalPassword(u)} onToggle={() => handleToggle(u)} />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Footer con conteo */}
        {!loading && usuarios.length > 0 && (
          <div className="px-5 py-3 border-t border-gray-50 text-xs" style={{ color: GRIS }}>
            {usuarios.length} {usuarios.length === 1 ? 'usuario' : 'usuarios'} encontrados
          </div>
        )}
      </div>

      {/* ── Modales ── */}
      {modalCrear && (
        <ModalUsuario
          modo="crear"
          empresas={empresas}
          onClose={() => setModalCrear(false)}
          onGuardado={() => handleGuardado('Usuario creado correctamente.')}
        />
      )}
      {modalEditar && (
        <ModalUsuario
          modo="editar"
          usuario={modalEditar}
          empresas={empresas}
          onClose={() => setModalEditar(null)}
          onGuardado={() => handleGuardado('Usuario actualizado correctamente.')}
        />
      )}
      {modalPassword && (
        <ModalPassword
          usuario={modalPassword}
          onClose={() => setModalPassword(null)}
          onGuardado={() => handleGuardado('Contraseña actualizada correctamente.')}
        />
      )}

      {/* ── Toast ── */}
      {toast && (
        <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}

// ── Botones de acción por fila ─────────────────────────────────────────────
function AccionesRow({ u, onEditar, onPassword, onToggle }) {
  return (
    <div className="flex items-center gap-1">
      {/* Editar */}
      <button
        onClick={onEditar}
        title="Editar"
        className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      </button>

      {/* Cambiar contraseña */}
      <button
        onClick={onPassword}
        title="Cambiar contraseña"
        className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
        </svg>
      </button>

      {/* Activar / Desactivar */}
      <button
        onClick={onToggle}
        title={u.activo ? 'Desactivar' : 'Activar'}
        className={cls(
          'w-8 h-8 rounded-lg flex items-center justify-center transition-colors',
          u.activo
            ? 'text-gray-400 hover:text-red-600 hover:bg-red-50'
            : 'text-gray-400 hover:text-emerald-600 hover:bg-emerald-50'
        )}
      >
        {u.activo ? (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
      </button>
    </div>
  );
}
