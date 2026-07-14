import { useEffect, useRef, useState } from 'react';
import {
  getEmpresasAdmin,
  crearEmpresa,
  editarEmpresa,
  toggleActivoEmpresa,
  probarConexionEmpresa,
  subirLogoEmpresa,
} from '../../api/empresas';

const ROJO = '#B11A1A';
const GRIS = '#8B8889';

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

// ── Badges ─────────────────────────────────────────────────────────────────
function BadgeActivo({ activo }) {
  return (
    <span
      className={cls(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold',
        activo ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
      )}
    >
      <span className={cls('w-1.5 h-1.5 rounded-full', activo ? 'bg-emerald-500' : 'bg-gray-400')} />
      {activo ? 'Activa' : 'Inactiva'}
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
        className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 pt-6 pb-4 border-b border-gray-100 flex items-center justify-between shrink-0">
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
          >
            ✕
          </button>
        </div>
        <div className="px-6 py-5 overflow-y-auto flex-1">{children}</div>
        {footer && (
          <div className="px-6 pb-6 pt-2 border-t border-gray-100 shrink-0 flex gap-3 justify-end">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Campos de formulario ───────────────────────────────────────────────────
function Field({ label, hint, error, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
      {hint && !error && <p className="text-xs mt-1" style={{ color: GRIS }}>{hint}</p>}
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

// ── Modal Crear / Editar empresa ───────────────────────────────────────────
const FORM_INIT = {
  codigo: '',
  nombre: '',
  ruc: '',
  cod_erp: '',
  activo: true,
  db_host: '',
  db_port: '1433',
  db_name: '',
  db_user: '',
  db_password: '',
};

function ModalEmpresa({ modo, empresa, onClose, onGuardado, onToast }) {
  const [form, setForm] = useState(
    modo === 'editar'
      ? {
          codigo:      empresa.codigo      ?? '',
          nombre:      empresa.nombre      ?? '',
          ruc:         empresa.ruc         ?? '',
          cod_erp:     empresa.cod_erp     ?? '',
          activo:      empresa.activo      ?? true,
          db_host:     '',
          db_port:     '',
          db_name:     '',
          db_user:     '',
          db_password: '',
        }
      : FORM_INIT
  );
  const [errors,   setErrors]   = useState({});
  const [loading,  setLoading]  = useState(false);
  const [probando, setProbando] = useState(false);
  const [logoUrl,  setLogoUrl]  = useState(empresa?.logo_url ?? null);
  const [subiendoLogo, setSubiendoLogo] = useState(false);
  const logoRef = useRef(null);

  const set = (key) => (e) =>
    setForm((p) => ({ ...p, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.codigo.trim()) e.codigo = 'Campo requerido.';
    if (!form.nombre.trim()) e.nombre = 'Campo requerido.';
    if (!form.ruc.trim() || form.ruc.trim().length !== 11) e.ruc = 'Debe tener 11 dígitos.';
    if (modo === 'crear') {
      if (!form.db_host.trim())     e.db_host     = 'Campo requerido.';
      if (!form.db_port.trim())     e.db_port     = 'Campo requerido.';
      if (!form.db_name.trim())     e.db_name     = 'Campo requerido.';
      if (!form.db_user.trim())     e.db_user     = 'Campo requerido.';
      if (!form.db_password.trim()) e.db_password = 'Campo requerido.';
    }
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }

    setLoading(true);
    try {
      const payload = { ...form };
      if (!payload.cod_erp) delete payload.cod_erp;
      if (modo === 'editar') {
        if (!payload.db_host)     delete payload.db_host;
        if (!payload.db_port)     delete payload.db_port;
        if (!payload.db_name)     delete payload.db_name;
        if (!payload.db_user)     delete payload.db_user;
        if (!payload.db_password) delete payload.db_password;
      }
      if (payload.db_port) payload.db_port = Number(payload.db_port);

      if (modo === 'crear') {
        await crearEmpresa(payload);
      } else {
        await editarEmpresa(empresa.id, payload);
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

  const handleProbarConexion = async () => {
    setProbando(true);
    try {
      const { data } = await probarConexionEmpresa(empresa.id);
      onToast(data.message ?? 'Conexión exitosa.');
    } catch (err) {
      onToast(err.response?.data?.message ?? 'No se pudo conectar.', 'error');
    } finally {
      setProbando(false);
    }
  };

  const handleLogoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSubiendoLogo(true);
    const fd = new FormData();
    fd.append('logo', file);
    try {
      const { data } = await subirLogoEmpresa(empresa.id, fd);
      setLogoUrl(data.data?.logo_url);
      onToast('Logo actualizado.');
    } catch {
      onToast('No se pudo subir el logo.', 'error');
    } finally {
      setSubiendoLogo(false);
      e.target.value = '';
    }
  };

  return (
    <Modal
      title={modo === 'crear' ? 'Nueva empresa' : 'Editar empresa'}
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

        {modo === 'editar' && (
          <Field label="Logo">
            <div className="flex items-center gap-4">
              <div className="w-24 h-16 rounded-xl border border-dashed border-gray-200 flex items-center justify-center bg-gray-50 overflow-hidden shrink-0">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
                ) : (
                  <span className="text-[10px] text-gray-400 text-center px-1">Sin logo</span>
                )}
              </div>
              <button
                type="button"
                onClick={() => logoRef.current?.click()}
                disabled={subiendoLogo}
                className="text-sm font-semibold px-4 py-2 rounded-xl transition-all disabled:opacity-50"
                style={{ background: '#fdf2f2', color: ROJO }}
              >
                {subiendoLogo ? 'Subiendo…' : (logoUrl ? 'Cambiar logo' : 'Subir logo')}
              </button>
              <input
                ref={logoRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleLogoChange}
              />
            </div>
          </Field>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Field label="Código" error={errors.codigo}>
            <Input value={form.codigo} onChange={set('codigo')} placeholder="0001" error={errors.codigo} />
          </Field>
          <Field label="Cód. ERP" error={errors.cod_erp} hint="COD_EMPRESA en el ERP">
            <Input value={form.cod_erp} onChange={set('cod_erp')} placeholder="0001" error={errors.cod_erp} />
          </Field>
        </div>

        <Field label="Nombre" error={errors.nombre}>
          <Input value={form.nombre} onChange={set('nombre')} placeholder="Clínica La Luz" error={errors.nombre} />
        </Field>

        <Field label="RUC" error={errors.ruc}>
          <Input value={form.ruc} onChange={set('ruc')} placeholder="20123456789" maxLength={11} error={errors.ruc} />
        </Field>

        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <input type="checkbox" checked={form.activo} onChange={set('activo')} className="w-4 h-4 rounded" />
          Empresa activa
        </label>

        <div className="pt-2 border-t border-gray-100">
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: GRIS }}>
            Conexión a BD del ERP
          </p>
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <Field
                  label="Host"
                  error={errors.db_host}
                  hint={modo === 'editar' ? 'Dejar en blanco para no modificar.' : undefined}
                >
                  <Input value={form.db_host} onChange={set('db_host')} placeholder="192.168.1.10" error={errors.db_host} />
                </Field>
              </div>
              <Field label="Puerto" error={errors.db_port}>
                <Input value={form.db_port} onChange={set('db_port')} placeholder="1433" error={errors.db_port} />
              </Field>
            </div>
            <Field
              label="Base de datos"
              error={errors.db_name}
              hint={modo === 'editar' ? 'Dejar en blanco para no modificar.' : undefined}
            >
              <Input value={form.db_name} onChange={set('db_name')} placeholder="BDV0004" error={errors.db_name} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field
                label="Usuario BD"
                error={errors.db_user}
                hint={modo === 'editar' ? 'Dejar en blanco para no modificar.' : undefined}
              >
                <Input value={form.db_user} onChange={set('db_user')} error={errors.db_user} />
              </Field>
              <Field
                label="Contraseña BD"
                error={errors.db_password}
                hint={modo === 'editar' ? 'Dejar en blanco para no modificar.' : undefined}
              >
                <Input type="password" value={form.db_password} onChange={set('db_password')} error={errors.db_password} />
              </Field>
            </div>
          </div>

          {modo === 'editar' && (
            <button
              type="button"
              onClick={handleProbarConexion}
              disabled={probando}
              className="mt-4 text-sm font-semibold px-4 py-2 rounded-xl border transition-all disabled:opacity-50"
              style={{ color: ROJO, borderColor: '#fecaca' }}
            >
              {probando ? 'Probando…' : 'Probar conexión'}
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}

// ── Página principal ───────────────────────────────────────────────────────
export default function GestionEmpresas() {
  const [empresas, setEmpresas] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [toast,    setToast]    = useState(null);

  const [modalCrear,  setModalCrear]  = useState(false);
  const [modalEditar, setModalEditar] = useState(null);

  const showToast = (msg, type = 'ok') => setToast({ msg, type });

  const cargarEmpresas = () => {
    setLoading(true);
    getEmpresasAdmin()
      .then(({ data }) => setEmpresas(data.data ?? []))
      .catch(() => showToast('Error al cargar empresas.', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { cargarEmpresas(); }, []);

  const handleToggle = async (e) => {
    try {
      await toggleActivoEmpresa(e.id);
      showToast(`Empresa ${e.activo ? 'desactivada' : 'activada'} correctamente.`);
      cargarEmpresas();
    } catch {
      showToast('Error al cambiar estado.', 'error');
    }
  };

  const handleGuardado = (msg) => {
    setModalCrear(false);
    setModalEditar(null);
    showToast(msg ?? 'Guardado correctamente.');
    cargarEmpresas();
  };

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Empresas</h1>
          <p className="text-sm mt-0.5" style={{ color: GRIS }}>
            Administra las empresas registradas y su conexión al ERP
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
          Nueva
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <Spinner />
        ) : empresas.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-sm">
            No se encontraron empresas.
          </div>
        ) : (
          <>
            {/* Vista desktop — tabla */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left">
                    {['Logo', 'Nombre', 'Código', 'RUC', 'Cód. ERP', 'Estado', ''].map((h) => (
                      <th key={h} className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider" style={{ color: GRIS }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {empresas.map((e) => (
                    <tr key={e.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="w-10 h-10 rounded-lg border border-gray-100 flex items-center justify-center bg-gray-50 overflow-hidden">
                          {e.logo_url ? (
                            <img src={e.logo_url} alt="" className="max-w-full max-h-full object-contain" />
                          ) : (
                            <span className="text-[9px] text-gray-300">—</span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 font-medium text-gray-800">{e.nombre}</td>
                      <td className="px-5 py-3.5 text-gray-600 font-mono">{e.codigo}</td>
                      <td className="px-5 py-3.5 text-gray-600 font-mono">{e.ruc}</td>
                      <td className="px-5 py-3.5 text-gray-600 font-mono">{e.cod_erp ?? '—'}</td>
                      <td className="px-5 py-3.5"><BadgeActivo activo={e.activo} /></td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setModalEditar(e)}
                            className="text-xs font-medium px-3 py-1.5 rounded-lg border transition hover:bg-gray-50"
                            style={{ color: GRIS, borderColor: '#e5e7eb' }}
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleToggle(e)}
                            className="text-xs font-medium px-3 py-1.5 rounded-lg border transition hover:bg-red-50"
                            style={{ color: ROJO, borderColor: '#fecaca' }}
                          >
                            {e.activo ? 'Desactivar' : 'Activar'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Vista móvil — cards */}
            <div className="md:hidden divide-y divide-gray-50">
              {empresas.map((e) => (
                <div key={e.id} className="p-4 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg border border-gray-100 flex items-center justify-center bg-gray-50 overflow-hidden shrink-0">
                        {e.logo_url ? (
                          <img src={e.logo_url} alt="" className="max-w-full max-h-full object-contain" />
                        ) : (
                          <span className="text-[9px] text-gray-300">—</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-800 truncate">{e.nombre}</p>
                        <p className="text-xs truncate" style={{ color: GRIS }}>{e.codigo} · RUC {e.ruc}</p>
                      </div>
                    </div>
                    <BadgeActivo activo={e.activo} />
                  </div>
                  <div className="flex items-center gap-2 pl-12">
                    <button
                      onClick={() => setModalEditar(e)}
                      className="text-xs font-medium px-3 py-1.5 rounded-lg border transition hover:bg-gray-50"
                      style={{ color: GRIS, borderColor: '#e5e7eb' }}
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleToggle(e)}
                      className="text-xs font-medium px-3 py-1.5 rounded-lg border transition hover:bg-red-50"
                      style={{ color: ROJO, borderColor: '#fecaca' }}
                    >
                      {e.activo ? 'Desactivar' : 'Activar'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {modalCrear && (
        <ModalEmpresa
          modo="crear"
          onClose={() => setModalCrear(false)}
          onGuardado={() => handleGuardado('Empresa creada correctamente.')}
          onToast={showToast}
        />
      )}
      {modalEditar && (
        <ModalEmpresa
          modo="editar"
          empresa={modalEditar}
          onClose={() => setModalEditar(null)}
          onGuardado={() => handleGuardado('Empresa actualizada correctamente.')}
          onToast={showToast}
        />
      )}

      {toast && (
        <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
