import { useCallback, useEffect, useState } from 'react';
import {
  adjuntarDocPermiso, cancelarPermiso, getPermiso, getPermisoEquipo, quitarDocPermiso, resolverPermisoEquipo, verDocumentoPermiso,
} from '../../api/permisos';
import SubirArchivo from '../../components/SubirArchivo';
import { imprimirPermiso } from '../../utils/formularioPermiso';
import { ROJO, fecha, nombrePropio } from '../equipo/evaluacionUtils';
import { ETAPAS, EXTENSIONES, archivoValido, horario, si } from './permisosUtils';

export function Etapa({ s }) {
  const et = ETAPAS[s.etapa] ?? { texto: s.etapa, clase: 'bg-gray-100 text-gray-600' };
  const texto = s.etapa === 'RECHAZADA' && si(s.rechazo_jefe) ? 'Rechazado por el jefe' : et.texto;
  return <span className={`rounded-full px-3 py-1 text-xs font-bold whitespace-nowrap ${et.clase}`}>{texto}</span>;
}

function Dato({ label, children }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">{label}</p>
      <p className="font-semibold text-gray-800 break-words">{children || '—'}</p>
    </div>
  );
}

/**
 * Detalle de una solicitud de permiso.
 *   modo 'propio'  el trabajador: adjuntar / quitar documentos y cancelar mientras el jefe no decida
 *   modo 'equipo'  el jefe: autorizar o rechazar
 */
export function DetallePermiso({ modo, empresa, id, logoUrl, tiposDocumento, onCerrar, onCambio }) {
  const [det, setDet] = useState(null);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState(null);
  const [ocupado, setOcupado] = useState(false);
  const [obs, setObs] = useState('');
  const [rechazando, setRechazando] = useState(false);
  const [nuevoTipo, setNuevoTipo] = useState('');
  const [nuevoOtro, setNuevoOtro] = useState('');
  const [nuevoArchivo, setNuevoArchivo] = useState(null);

  const cargar = useCallback(() => (modo === 'equipo' ? getPermisoEquipo(empresa, id) : getPermiso(id))
    .then(({ data }) => setDet(data.data))
    .catch((e) => setError(e.response?.data?.message ?? 'No se pudo cargar la solicitud.')), [modo, empresa, id]);

  useEffect(() => { cargar(); }, [cargar]);

  async function accion(fn, mensaje) {
    setOcupado(true);
    setAviso(null);
    try {
      const { data } = await fn();
      setAviso({ error: false, texto: data?.message ?? mensaje });
      await cargar();
      onCambio?.();
      window.dispatchEvent(new Event('equipo:actualizado'));
      return true;
    } catch (e) {
      setAviso({ error: true, texto: e.response?.data?.message ?? e.message ?? 'No se pudo completar la acción.' });
      return false;
    } finally {
      setOcupado(false);
    }
  }

  const s = det?.solicitud;
  const pendienteJefe = s?.etapa === 'PENDIENTE_JEFE';
  const editable = modo === 'propio' && s?.estado === 'pendiente';
  const tiposDoc = det?.requeridos ?? [];

  async function adjuntar() {
    const f = nuevoArchivo;
    const err = archivoValido(f) || (!nuevoTipo ? 'Elija el tipo de documento.' : '');
    if (err) { setAviso({ error: true, texto: err }); return; }
    const fd = new FormData();
    fd.append('archivo', f);
    fd.append('id_tipo', nuevoTipo);
    if (nuevoOtro.trim()) fd.append('des_otro', nuevoOtro.trim());
    if (await accion(() => adjuntarDocPermiso(id, fd), 'Documento adjuntado.')) {
      setNuevoArchivo(null);
      setNuevoOtro('');
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-3 md:p-6 overflow-y-auto" onClick={onCerrar}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl my-4" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="titulo-permiso">
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-gray-100">
          <h2 id="titulo-permiso" className="text-base font-bold text-gray-900">Solicitud de permiso {s ? `N° ${s.id}` : ''}</h2>
          <button type="button" onClick={onCerrar} aria-label="Cerrar" className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200">✕</button>
        </div>

        <div className="p-6 space-y-5">
          {error && <p role="alert" className="bg-red-50 text-red-700 rounded-2xl px-4 py-3 text-sm font-semibold">{error}</p>}
          {!s && !error && <div className="h-40 bg-gray-100 rounded-2xl animate-pulse" />}

          {s && (
            <>
              <div className="flex flex-wrap items-start gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900">{nombrePropio(s.nombre_completo)}</p>
                  <p className="text-xs text-gray-500">{nombrePropio([s.cargo, s.area].filter(Boolean).join(' · '))} · {nombrePropio(s.empresa_nombre)}</p>
                </div>
                <Etapa s={s} />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div className="col-span-2 md:col-span-3">
                  <Dato label="Tipo de permiso">{s.des_motivo}{s.des_otro_motivo ? `: ${s.des_otro_motivo}` : ''}{s.ind_provincia === 'S' ? ' (provincia)' : ''}</Dato>
                </div>
                <Dato label="Fechas">{fecha(s.fecha_inicio)} al {fecha(s.fecha_fin)}</Dato>
                <Dato label="Días">{s.dias_solicitados}</Dato>
                <Dato label="Horario">{horario(s)}</Dato>
                <div className="col-span-2 md:col-span-3"><Dato label="Motivo / justificación">{s.justificacion}</Dato></div>
                {s.afecta_salario === 'S' && <p className="col-span-2 md:col-span-3 text-xs font-semibold text-amber-700">Este tipo de permiso es sin goce de haber.</p>}
              </div>

              <div className="rounded-2xl border border-gray-100 p-4 space-y-2 text-sm">
                <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Seguimiento</p>
                <p>Solicitado el {fecha(s.fecha_solicitud)}{si(s.ind_conforme_trab) ? ' con conformidad del trabajador' : ''}.</p>
                {s.est_jefe !== 'P' && (
                  <p>{s.est_jefe === 'A' ? 'Autorizado' : 'Rechazado'} por {nombrePropio(s.nom_jefe)} el {fecha(s.fec_jefe)}{s.obs_jefe ? ` — ${s.obs_jefe}` : ''}.</p>
                )}
                {s.est_jefe === 'P' && s.etapa === 'PENDIENTE_JEFE' && <p className="text-gray-500">Espera la autorización de {s.jefe_nombre ? nombrePropio(s.jefe_nombre) : 'su jefe'}.</p>}
                {s.fecha_aprobacion_rh && <p>{s.etapa === 'APROBADA' ? 'Aprobado' : s.etapa === 'CANCELADA' ? 'Anulado' : 'Revisado'} por RR.HH. el {fecha(s.fecha_aprobacion_rh)}{s.obs_rrhh ? ` — ${s.obs_rrhh}` : ''}.</p>}
              </div>

              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Documentación adjunta</p>
                {tiposDoc.filter((r) => r.ind_obligatorio === 'S' && !si(r.cargado)).map((r) => (
                  <p key={r.id_documento} className="text-xs font-semibold text-red-700">Falta: {r.des_tipo} (obligatorio)</p>
                ))}
                {det.documentos.length === 0 && <p className="text-sm text-gray-500">Sin documentos.</p>}
                <ul className="space-y-1.5">
                  {det.documentos.map((d) => (
                    <li key={d.id} className="flex flex-wrap items-center gap-2 rounded-xl bg-gray-50 px-3 py-2 text-sm">
                      <span className="flex-1 min-w-0 truncate"><b>{d.des_tipo}{d.des_otro ? `: ${d.des_otro}` : ''}</b> · {d.nombre_documento}</span>
                      <button type="button" className="text-xs font-bold text-blue-700 hover:underline"
                        onClick={() => verDocumentoPermiso(d.id, modo === 'equipo' ? { empresa, id } : null).catch((e) => setAviso({ error: true, texto: e.message }))}>Ver</button>
                      {editable && (
                        <button type="button" disabled={ocupado} className="text-xs font-bold text-red-700 hover:underline"
                          onClick={() => accion(() => quitarDocPermiso(d.id), 'Documento quitado.')}>Quitar</button>
                      )}
                    </li>
                  ))}
                </ul>
                {editable && (
                  <div className="space-y-2 rounded-2xl border border-gray-100 p-3">
                    <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Adjuntar otro documento</p>
                    <select className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm" value={nuevoTipo} onChange={(e) => setNuevoTipo(e.target.value)} aria-label="Tipo de documento">
                      <option value="">Tipo de documento…</option>
                      {(tiposDocumento ?? tiposDoc.map((r) => ({ id: r.id_documento, des_tipo: r.des_tipo }))).map((t) => (
                        <option key={t.id} value={t.id}>{t.des_tipo}</option>
                      ))}
                    </select>
                    <SubirArchivo accept={EXTENSIONES} archivo={nuevoArchivo} onCambio={setNuevoArchivo}
                      error={nuevoArchivo ? archivoValido(nuevoArchivo) : ''} />
                    <div className="flex flex-wrap gap-2">
                      <input className="rounded-xl border border-gray-200 px-3 py-2 text-sm flex-1 min-w-40" placeholder="Detalle (si es Otro)" maxLength={200}
                        value={nuevoOtro} onChange={(e) => setNuevoOtro(e.target.value)} />
                      <button type="button" disabled={ocupado || !nuevoArchivo || !nuevoTipo} onClick={adjuntar}
                        className="px-4 py-2 rounded-xl text-sm font-bold text-white disabled:opacity-50" style={{ background: ROJO }}>
                        {ocupado ? 'Subiendo…' : 'Adjuntar'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {modo === 'equipo' && pendienteJefe && (
                <div className="rounded-2xl border border-gray-100 p-4 space-y-3">
                  <label className="block">
                    <span className="text-xs font-bold uppercase tracking-wide text-gray-500">Observaciones {rechazando ? '(obligatorio para rechazar)' : '(opcional)'}</span>
                    <textarea className="mt-1 w-full rounded-2xl border border-gray-200 px-3 py-2 text-sm" rows={2} maxLength={500} value={obs} onChange={(e) => setObs(e.target.value)} />
                  </label>
                  <p className="text-xs text-gray-500">Al autorizar firma como Administrador de Sede con la firma digital de su perfil.</p>
                </div>
              )}

              {aviso && <p role={aviso.error ? 'alert' : 'status'} className={`rounded-2xl px-4 py-3 text-sm font-semibold ${aviso.error ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>{aviso.texto}</p>}

              <div className="flex flex-wrap justify-end gap-2">
                <button type="button" onClick={() => { if (!imprimirPermiso(det, logoUrl)) setAviso({ error: true, texto: 'Habilite las ventanas emergentes para imprimir.' }); }}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50">Imprimir formato</button>
                {modo === 'propio' && pendienteJefe && (
                  <button type="button" disabled={ocupado} onClick={() => accion(() => cancelarPermiso(id), 'Solicitud cancelada.')}
                    className="px-4 py-2 rounded-xl border text-sm font-bold disabled:opacity-60" style={{ borderColor: ROJO, color: ROJO }}>Cancelar solicitud</button>
                )}
                {modo === 'equipo' && pendienteJefe && (
                  <>
                    <button type="button" disabled={ocupado} className="px-4 py-2 rounded-xl border text-sm font-bold disabled:opacity-60" style={{ borderColor: ROJO, color: ROJO }}
                      onClick={() => {
                        setRechazando(true);
                        if (!obs.trim()) { setAviso({ error: true, texto: 'Escriba el motivo del rechazo en Observaciones.' }); return; }
                        accion(() => resolverPermisoEquipo(empresa, id, 'rechazar', obs.trim()), 'Permiso rechazado.');
                      }}>Rechazar</button>
                    <button type="button" disabled={ocupado} onClick={() => accion(() => resolverPermisoEquipo(empresa, id, 'autorizar', obs.trim() || null), 'Permiso autorizado.')}
                      className="px-5 py-2 rounded-xl text-sm font-bold text-white disabled:opacity-60" style={{ background: '#059669' }}>
                      {ocupado ? 'Guardando…' : 'Autorizar'}
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
