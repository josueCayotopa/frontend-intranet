import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { crearPermiso, getMisPermisos, getMotivosPermiso } from '../../api/permisos';
import { ROJO, fecha, nombrePropio } from '../equipo/evaluacionUtils';
import SubirArchivo from '../../components/SubirArchivo';
import { DetallePermiso, Etapa } from './DetallePermiso';
import { EXTENSIONES, MAX_MB, archivoValido, horario } from './permisosUtils';

const hoyIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const diasEntre = (a, b) => (a && b && b >= a ? Math.round((new Date(`${b}T00:00:00`) - new Date(`${a}T00:00:00`)) / 86400000) + 1 : 0);

function Seccion({ numero, titulo, children }) {
  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-black text-gray-900"><span style={{ color: ROJO }}>{numero}.</span> {titulo}</legend>
      {children}
    </fieldset>
  );
}

/** Formulario: secciones 1, 2, 3 y 5 del formato (la 4 la llena el jefe). */
function NuevaSolicitud({ catalogo, user, empresa, onCerrar, onHecho }) {
  const [motivo, setMotivo] = useState(null);
  const [f, setF] = useState({ fecha_inicio: hoyIso(), fecha_fin: hoyIso(), hora_inicio: '', hora_fin: '', des_otro: '', provincia: false, justificacion: '' });
  const [docs, setDocs] = useState({});          // id_tipo → File
  const [otroDoc, setOtroDoc] = useState({ archivo: null, des: '' });
  const [conforme, setConforme] = useState(false);
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  const docsMotivo = useMemo(() => (motivo ? catalogo.documentos.filter((d) => Number(d.id_motivo) === Number(motivo.id)) : []), [catalogo, motivo]);
  const tipoOtro = catalogo.tipos_documento.find((t) => t.des_tipo === 'Otro');
  const dias = diasEntre(f.fecha_inicio, f.fecha_fin);
  const tope = motivo ? (f.provincia && motivo.num_dias_max_prov ? Number(motivo.num_dias_max_prov) : motivo.num_dias_max ? Number(motivo.num_dias_max) : null) : null;
  const nombre = [user?.ape_paterno, user?.ape_materno].filter(Boolean).join(' ') + (user?.nom_trabajador ? `, ${user.nom_trabajador}` : '');
  const cambiar = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  async function enviar(e) {
    e.preventDefault();
    setError('');
    if (!motivo) return setError('Marque el tipo de permiso.');
    if (motivo.ind_especificar === 'S' && !f.des_otro.trim()) return setError('Especifique el tipo de permiso.');
    if (dias <= 0) return setError('La fecha final no puede ser anterior a la inicial.');
    if (tope && dias > tope) return setError(`Este permiso permite como máximo ${tope} días.`);
    if ((f.hora_inicio && !f.hora_fin) || (!f.hora_inicio && f.hora_fin)) return setError('Indique el horario completo (desde y hasta).');
    const faltan = docsMotivo.filter((d) => d.ind_obligatorio === 'S' && !docs[d.id_documento]);
    if (faltan.length) return setError(`Adjunte: ${faltan.map((d) => d.des_tipo).join(', ')}.`);
    for (const archivo of [...Object.values(docs), otroDoc.archivo].filter(Boolean)) {
      const err = archivoValido(archivo);
      if (err) return setError(`${archivo.name}: ${err}`);
    }
    if (otroDoc.archivo && !otroDoc.des.trim()) return setError('Indique qué documento adjunta en "Otro".');
    if (!conforme) return setError('Marque su conformidad (sección 5).');

    const fd = new FormData();
    fd.append('id_motivo', motivo.id);
    ['fecha_inicio', 'fecha_fin', 'hora_inicio', 'hora_fin', 'justificacion'].forEach((k) => { if (f[k]) fd.append(k, f[k]); });
    if (motivo.ind_especificar === 'S') fd.append('des_otro', f.des_otro.trim());
    if (f.provincia && motivo.num_dias_max_prov) fd.append('provincia', '1');
    let i = 0;
    Object.entries(docs).forEach(([tipo, archivo]) => {
      if (!archivo) return;
      fd.append(`documentos[${i}][archivo]`, archivo);
      fd.append(`documentos[${i}][id_tipo]`, tipo);
      i += 1;
    });
    if (otroDoc.archivo && tipoOtro) {
      fd.append(`documentos[${i}][archivo]`, otroDoc.archivo);
      fd.append(`documentos[${i}][id_tipo]`, tipoOtro.id);
      fd.append(`documentos[${i}][des_otro]`, otroDoc.des.trim());
    }

    setEnviando(true);
    try {
      const { data } = await crearPermiso(fd);
      onHecho(data.message ?? 'Solicitud enviada.');
    } catch (err) {
      setError(err.response?.data?.message ?? 'No se pudo enviar la solicitud.');
    } finally {
      setEnviando(false);
    }
    return undefined;
  }

  const campo = 'mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm';
  const etiqueta = 'text-xs font-bold uppercase tracking-wide text-gray-500';

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-3 md:p-6 overflow-y-auto" onClick={onCerrar}>
      <form className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl my-4" onClick={(e) => e.stopPropagation()} onSubmit={enviar}
        role="dialog" aria-modal="true" aria-labelledby="titulo-nuevo-permiso">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 id="titulo-nuevo-permiso" className="text-base font-bold text-gray-900">Autorización de permiso</h2>
            <p className="text-xs text-gray-500">Formato de autorización de permisos no sujetos a descuento</p>
          </div>
          <button type="button" onClick={onCerrar} aria-label="Cerrar" className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200">✕</button>
        </div>

        <div className="p-6 space-y-6">
          <Seccion numero="1" titulo="Datos del personal">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="col-span-2"><p className={etiqueta}>Nombre completo</p><p className="font-semibold">{nombrePropio(nombre) || user?.usuario}</p></div>
              <div><p className={etiqueta}>DNI</p><p className="font-semibold">{user?.dni || '—'}</p></div>
              <div><p className={etiqueta}>Empresa</p><p className="font-semibold">{nombrePropio(empresa?.nombre)}</p></div>
            </div>
            <p className="text-xs text-gray-500">El cargo y el área se toman de planilla al imprimir el formato.</p>
          </Seccion>

          <Seccion numero="2" titulo="Detalles del permiso">
            <div role="radiogroup" aria-label="Tipo de permiso" className="grid sm:grid-cols-2 gap-2">
              {catalogo.motivos.map((m) => {
                const activo = motivo && Number(motivo.id) === Number(m.id);
                return (
                  <button key={m.id} type="button" role="radio" aria-checked={activo} onClick={() => { setMotivo(m); setDocs({}); }}
                    className="flex items-start gap-2 rounded-2xl border px-3 py-2.5 text-left text-sm transition"
                    style={activo ? { borderColor: ROJO, background: '#fef2f2' } : { borderColor: '#e5e7eb' }}>
                    <span className="mt-0.5 w-4 h-4 shrink-0 rounded border-2 flex items-center justify-center text-[11px] font-black"
                      style={{ borderColor: activo ? ROJO : '#9ca3af', color: ROJO }}>{activo ? '✔' : ''}</span>
                    <span className="font-semibold text-gray-800">{m.des_motivo}{m.ind_afecta_salario === 'S' && <span className="block text-[11px] font-semibold text-amber-700">Sin goce de haber</span>}</span>
                  </button>
                );
              })}
            </div>
            {motivo?.ind_especificar === 'S' && (
              <label className="block"><span className={etiqueta}>Especificar</span>
                <input className={campo} maxLength={200} value={f.des_otro} onChange={cambiar('des_otro')} required /></label>
            )}
            {motivo?.num_dias_max_prov && (
              <label className="flex items-center gap-2 text-sm font-semibold">
                <input type="checkbox" checked={f.provincia} onChange={cambiar('provincia')} /> El familiar falleció en provincia ({motivo.num_dias_max_prov} días)
              </label>
            )}
            <div className="grid grid-cols-2 gap-3">
              <label className="block"><span className={etiqueta}>Desde</span>
                <input type="date" className={campo} value={f.fecha_inicio} onChange={cambiar('fecha_inicio')} required /></label>
              <label className="block"><span className={etiqueta}>Hasta</span>
                <input type="date" className={campo} min={f.fecha_inicio} value={f.fecha_fin} onChange={cambiar('fecha_fin')} required /></label>
            </div>
            <p className={`text-xs font-semibold ${tope && dias > tope ? 'text-red-700' : 'text-gray-500'}`}>
              {dias} {dias === 1 ? 'día' : 'días'}{tope ? ` · máximo ${tope}` : ''}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <label className="block"><span className={etiqueta}>Horario desde {motivo?.ind_horario === 'S' ? '(si aplica)' : '(opcional)'}</span>
                <input type="time" className={campo} value={f.hora_inicio} onChange={cambiar('hora_inicio')} /></label>
              <label className="block"><span className={etiqueta}>Horario hasta</span>
                <input type="time" className={campo} value={f.hora_fin} onChange={cambiar('hora_fin')} /></label>
            </div>
            <label className="block"><span className={etiqueta}>Motivo / justificación del permiso</span>
              <textarea className={campo} rows={3} maxLength={500} value={f.justificacion} onChange={cambiar('justificacion')} /></label>
          </Seccion>

          <Seccion numero="3" titulo="Documentación adjunta (si corresponde)">
            {!motivo && <p className="text-sm text-gray-500">Elija primero el tipo de permiso.</p>}
            {docsMotivo.map((d) => (
              <SubirArchivo key={d.id_documento} etiqueta={d.des_tipo} obligatorio={d.ind_obligatorio === 'S'} accept={EXTENSIONES}
                ayuda={`PDF, JPG o PNG · máx. ${MAX_MB} MB`} archivo={docs[d.id_documento] ?? null}
                error={docs[d.id_documento] ? archivoValido(docs[d.id_documento]) : ''}
                onCambio={(archivo) => setDocs({ ...docs, [d.id_documento]: archivo })} />
            ))}
            {motivo && tipoOtro && (
              <div className="space-y-2">
                <SubirArchivo etiqueta="Otro documento" accept={EXTENSIONES} ayuda={`PDF, JPG o PNG · máx. ${MAX_MB} MB`}
                  archivo={otroDoc.archivo} error={otroDoc.archivo ? archivoValido(otroDoc.archivo) : ''}
                  onCambio={(archivo) => setOtroDoc({ ...otroDoc, archivo })} />
                {otroDoc.archivo && (
                  <label className="block"><span className={etiqueta}>¿Qué documento es?</span>
                    <input className={campo} maxLength={200} required placeholder="Ej.: constancia de atención" value={otroDoc.des}
                      onChange={(e) => setOtroDoc({ ...otroDoc, des: e.target.value })} /></label>
                )}
              </div>
            )}
            {motivo && <p className="text-xs text-gray-500">Puede adjuntar más documentos después, mientras su jefe no revise la solicitud.</p>}
          </Seccion>

          <Seccion numero="5" titulo="Firma de conformidad del trabajador">
            <label className="flex items-start gap-2 text-sm">
              <input type="checkbox" className="mt-1" checked={conforme} onChange={(e) => setConforme(e.target.checked)} />
              <span>Declaro haber solicitado el presente permiso y estar conforme con los términos del mismo.</span>
            </label>
            {user?.firma_url
              ? <p className="text-xs text-gray-500">Se usará la firma digital de su perfil.</p>
              : <p className="text-xs text-amber-700">No tiene firma digital: el formato saldrá con la línea en blanco. Puede subirla en <Link to="/perfil" className="underline">Mi Perfil</Link>.</p>}
          </Seccion>

          {error && <p role="alert" className="bg-red-50 text-red-700 rounded-2xl px-4 py-3 text-sm font-semibold">{error}</p>}

          <div className="flex justify-end gap-2">
            <button type="button" onClick={onCerrar} className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600">Cerrar</button>
            <button type="submit" disabled={enviando} className="px-5 py-2 rounded-xl text-sm font-bold text-white disabled:opacity-60" style={{ background: ROJO }}>
              {enviando ? 'Enviando…' : 'Enviar a mi jefe'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

/** Mis permisos: el trabajador solicita y sigue sus permisos. */
export default function MisPermisos() {
  const { user, empresa } = useAuth();
  const [filas, setFilas] = useState([]);
  const [catalogo, setCatalogo] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [nueva, setNueva] = useState(false);
  const [detalle, setDetalle] = useState(null);
  const [aviso, setAviso] = useState('');

  const cargar = useCallback(() => getMisPermisos()
    .then(({ data }) => { setFilas(data.data ?? []); setError(''); })
    .catch((e) => setError(e.response?.data?.message ?? 'No se pudieron cargar sus permisos.'))
    .finally(() => setCargando(false)), []);

  useEffect(() => {
    cargar();
    getMotivosPermiso().then(({ data }) => setCatalogo(data.data)).catch(() => setCatalogo(null));
  }, [cargar]);

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 flex flex-wrap items-end gap-4">
        <div className="flex-1 min-w-60">
          <h1 className="text-2xl font-bold text-gray-900">Mis permisos</h1>
          <p className="text-sm text-gray-500 mt-1">Solicite permisos y licencias. Su jefe los autoriza y Recursos Humanos los aprueba.</p>
        </div>
        <button type="button" disabled={!catalogo} onClick={() => { setAviso(''); setNueva(true); }}
          className="px-5 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-60" style={{ background: ROJO }}>+ Nueva solicitud</button>
      </div>

      {aviso && <p role="status" className="bg-green-50 text-green-700 rounded-2xl px-4 py-3 text-sm font-semibold">{aviso}</p>}
      {error && <p role="alert" className="bg-red-50 text-red-700 rounded-2xl px-4 py-3 text-sm font-semibold">{error}</p>}
      {cargando && <div className="space-y-3 animate-pulse">{[0, 1].map((i) => <div key={i} className="h-20 bg-gray-100 rounded-2xl" />)}</div>}
      {!cargando && !error && filas.length === 0 && (
        <p className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-sm text-gray-500">Aún no ha solicitado permisos.</p>
      )}

      <ul className="space-y-3">
        {filas.map((s) => (
          <li key={s.id}>
            <button type="button" onClick={() => setDetalle(s.id)} className="w-full text-left bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition">
              <div className="flex flex-wrap items-start gap-3">
                <div className="flex-1 min-w-0 basis-60">
                  <p className="font-bold text-gray-900">{s.des_motivo}{s.des_otro_motivo ? `: ${s.des_otro_motivo}` : ''}</p>
                  <p className="text-xs text-gray-500">
                    {fecha(s.fecha_inicio)} al {fecha(s.fecha_fin)} · {s.dias_solicitados} {Number(s.dias_solicitados) === 1 ? 'día' : 'días'}
                    {horario(s) ? ` · ${horario(s)}` : ''} · N° {s.id}
                  </p>
                </div>
                <Etapa s={s} />
              </div>
              {Number(s.docs_oblig_faltan) > 0 && s.etapa === 'PENDIENTE_JEFE' && <p className="mt-2 text-xs font-semibold text-red-700">Falta adjuntar un documento obligatorio.</p>}
            </button>
          </li>
        ))}
      </ul>

      {nueva && catalogo && (
        <NuevaSolicitud catalogo={catalogo} user={user} empresa={empresa} onCerrar={() => setNueva(false)}
          onHecho={(m) => { setNueva(false); setAviso(m); cargar(); }} />
      )}
      {detalle && (
        <DetallePermiso modo="propio" id={detalle} logoUrl={empresa?.logo_url} tiposDocumento={catalogo?.tipos_documento}
          onCerrar={() => setDetalle(null)} onCambio={cargar} />
      )}
    </div>
  );
}
