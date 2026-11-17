import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getAprobacion, resolverAprobacion } from '../../api/equipo';
import {
  RECOMENDACIONES, ROJO, estadoGeneral, fecha, imprimirEvaluacion, nombrePropio, periodoTexto, si, textoRecomendacion,
} from './evaluacionUtils';

const ESTADO_APROB = { P: 'Pendiente', A: 'Aprobó', R: 'Rechazó' };
const DECISIONES = [
  { valor: 'APROBAR', texto: 'Aprobar' },
  { valor: 'OBSER_PERIODO', texto: 'Aprobar con otro período' },
  { valor: 'RECHAZAR', texto: 'Rechazar' },
];

function Seccion({ titulo, criterios }) {
  const sub = criterios.reduce((s, c) => s + (Number(c.puntaje) || 0) * Number(c.peso || 1), 0);
  const max = criterios.reduce((s, c) => s + Number(c.escala_max) * Number(c.peso || 1), 0);
  return (
    <section className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center gap-2">
        <h2 className="flex-1 text-lg font-bold text-gray-900">{titulo}</h2>
        <span className="text-sm font-black">{sub} / {max}</span>
      </div>
      <ul className="mt-3 divide-y divide-gray-100 text-sm">
        {criterios.map((c) => (
          <li key={c.criterio_id} className="py-2 flex gap-3">
            <span className="flex-1">
              {c.descripcion}
              {c.observacion && <span className="block text-xs text-gray-500">“{c.observacion}”</span>}
            </span>
            <span className="font-bold tabular-nums">{c.puntaje ?? '—'} / {c.escala_max}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * Ficha para el aprobador: ve la calificación de RR.HH. y del jefe (solo
 * lectura), los demás aprobadores y registra su decisión. Puede imprimir.
 */
export default function AprobarEvaluacion() {
  const { empresa, codPersonal, periodo } = useParams();
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [accion, setAccion] = useState('APROBAR');
  const [comentario, setComentario] = useState('');
  const [recomendacion, setRecomendacion] = useState('');
  const [justificacion, setJustificacion] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [aviso, setAviso] = useState(null);

  const cargar = useCallback(() => getAprobacion(empresa, codPersonal, periodo)
    .then(({ data }) => { setDatos(data.data); setError(''); })
    .catch((e) => setError(e.response?.data?.message ?? 'No se pudo cargar la evaluación.'))
    .finally(() => setCargando(false)), [empresa, codPersonal, periodo]);

  useEffect(() => { cargar(); }, [cargar]);

  if (cargando && !datos) return <div className="max-w-4xl mx-auto space-y-3 animate-pulse">{[0, 1, 2].map((i) => <div key={i} className="h-32 bg-gray-100 rounded-2xl" />)}</div>;
  if (error && !datos) {
    return (
      <div className="max-w-4xl mx-auto bg-white rounded-3xl border border-gray-100 p-6">
        <p role="alert" className="text-sm font-semibold text-red-700">{error}</p>
        <Link to="/equipo/aprobaciones" className="inline-block mt-4 text-sm font-semibold" style={{ color: ROJO }}>← Volver a mis aprobaciones</Link>
      </div>
    );
  }

  const c = datos.cabecera;
  const mia = datos.aprobaciones.find((a) => si(a.es_mia));
  const completa = c.estado !== 'EN_PROCESO';
  const puedeDecidir = mia && mia.estado === 'P' && completa && !si(c.genero_contrato);
  const general = estadoGeneral(c);
  const total = datos.criterios.reduce((s, x) => s + (Number(x.puntaje) || 0) * Number(x.peso || 1), 0);

  async function enviar(e) {
    e.preventDefault();
    setAviso(null);
    if (accion === 'RECHAZAR' && !comentario.trim()) { setAviso({ error: true, texto: 'Indique el motivo del rechazo.' }); return; }
    if (accion === 'OBSER_PERIODO' && (!recomendacion || !justificacion.trim())) {
      setAviso({ error: true, texto: 'Elija el nuevo período y explique el cambio.' });
      return;
    }
    setEnviando(true);
    try {
      const { data } = await resolverAprobacion(empresa, mia.aprobacion_id, {
        accion,
        comentario: comentario.trim() || null,
        recomendacion_final: accion === 'OBSER_PERIODO' ? recomendacion : null,
        justificacion_cambio: accion === 'OBSER_PERIODO' ? justificacion.trim() : null,
      });
      setAviso({ error: false, texto: data.message ?? 'Su decisión quedó registrada.' });
      await cargar();
      window.dispatchEvent(new Event('equipo:actualizado'));
    } catch (err) {
      setAviso({ error: true, texto: err.response?.data?.message ?? 'No se pudo registrar la decisión.' });
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
        <Link to="/equipo/aprobaciones" className="text-sm font-semibold" style={{ color: ROJO }}>← Mis aprobaciones</Link>
        <div className="mt-3 flex flex-wrap items-start gap-3">
          <div className="flex-1 min-w-[220px]">
            <h1 className="text-2xl font-bold text-gray-900">{nombrePropio(c.nombre_completo)}</h1>
            <p className="text-sm text-gray-500">{nombrePropio([c.cargo, c.area].filter(Boolean).join(' · '))} · {nombrePropio(c.empresa_nombre)}</p>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-bold ${general.clase}`}>{general.texto}</span>
        </div>
        <dl className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div><dt className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Período</dt><dd className="font-semibold capitalize">{periodoTexto(c.periodo)}</dd></div>
          <div><dt className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Contrato vence</dt><dd className="font-semibold">{fecha(c.contrato_fec_fin)}</dd></div>
          <div><dt className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Puntaje total</dt><dd className="font-black text-lg" style={{ color: ROJO }}>{total} / {Number(c.puntaje_max_rh) + Number(c.puntaje_max_jefe)}</dd></div>
          <div><dt className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Recomienda</dt><dd className="font-semibold">{textoRecomendacion(c.recomendacion_final)}</dd></div>
        </dl>
        {c.recomendaciones && <p className="mt-3 text-sm text-gray-600"><strong>Recomendaciones:</strong> {c.recomendaciones}</p>}
      </div>

      <Seccion titulo="Validación de Recursos Humanos" criterios={datos.criterios.filter((x) => x.categoria === 'RH')} />
      <Seccion titulo={`Evaluación del jefe inmediato${c.jefe_nombre ? ` · ${nombrePropio(c.jefe_nombre)}` : ''}`} criterios={datos.criterios.filter((x) => x.categoria === 'JEFE')} />

      <section className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-lg font-bold text-gray-900">Aprobadores</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {datos.aprobaciones.map((a) => (
            <li key={a.aprobacion_id} className="flex flex-wrap items-center gap-2 rounded-2xl bg-gray-50 px-4 py-2.5">
              <span className="flex-1 font-semibold">{nombrePropio(a.nombre ?? a.usuario)}{si(a.es_mia) && <span className="ml-2 text-xs" style={{ color: ROJO }}>(usted)</span>}</span>
              <span className="text-xs text-gray-500">{a.fecha_accion ? fecha(a.fecha_accion) : ''}</span>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${a.estado === 'A' ? 'bg-green-50 text-green-700' : a.estado === 'R' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>
                {ESTADO_APROB[a.estado] ?? a.estado}
              </span>
              {a.comentario && <p className="w-full text-xs text-gray-500">“{a.comentario}”</p>}
            </li>
          ))}
        </ul>
      </section>

      {mia && mia.estado === 'P' && !completa && (
        <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
          Aún falta que {({ RH: 'RR.HH.', JEFE: 'el jefe', RH_JEFE: 'RR.HH. y el jefe' })[c.falta_seccion] ?? 'RR.HH. o el jefe'} califique. Podrá decidir cuando terminen.
        </p>
      )}

      {puedeDecidir && (
        <form onSubmit={enviar} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h2 className="text-lg font-bold text-gray-900">Su decisión</h2>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Decisión">
            {DECISIONES.map((d) => (
              <button key={d.valor} type="button" aria-pressed={accion === d.valor} onClick={() => setAccion(d.valor)}
                className="px-4 py-2 rounded-full text-sm font-semibold border"
                style={accion === d.valor ? { background: d.valor === 'RECHAZAR' ? ROJO : '#059669', color: '#fff', borderColor: 'transparent' } : { borderColor: '#e5e7eb', color: '#374151' }}>
                {d.texto}
              </button>
            ))}
          </div>
          {accion === 'OBSER_PERIODO' && (
            <div className="grid sm:grid-cols-2 gap-3">
              <label className="block text-sm">
                <span className="text-xs font-bold uppercase tracking-wide text-gray-500">Nuevo período</span>
                <select className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2" value={recomendacion} onChange={(e) => setRecomendacion(e.target.value)} required>
                  <option value="">Elegir…</option>
                  {RECOMENDACIONES.map((r) => <option key={r.valor} value={r.valor}>{r.texto}</option>)}
                </select>
              </label>
              <label className="block text-sm">
                <span className="text-xs font-bold uppercase tracking-wide text-gray-500">Justificación del cambio</span>
                <input className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2" value={justificacion} onChange={(e) => setJustificacion(e.target.value)} maxLength={2000} required />
              </label>
            </div>
          )}
          <label className="block text-sm">
            <span className="text-xs font-bold uppercase tracking-wide text-gray-500">{accion === 'RECHAZAR' ? 'Motivo del rechazo' : 'Comentario (opcional)'}</span>
            <textarea className="mt-1 w-full rounded-2xl border border-gray-200 px-3 py-2" rows={3} maxLength={500} value={comentario}
              onChange={(e) => setComentario(e.target.value)} required={accion === 'RECHAZAR'} />
          </label>
          <div className="flex justify-end">
            <button type="submit" disabled={enviando} className="px-6 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-60"
              style={{ background: accion === 'RECHAZAR' ? ROJO : '#059669' }}>
              {enviando ? 'Guardando…' : 'Registrar decisión'}
            </button>
          </div>
        </form>
      )}

      {aviso && (
        <p role={aviso.error ? 'alert' : 'status'} className={`rounded-2xl px-4 py-3 text-sm font-semibold ${aviso.error ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>{aviso.texto}</p>
      )}

      <div className="flex justify-end pb-6">
        <button type="button" onClick={() => { if (!imprimirEvaluacion(datos)) setAviso({ error: true, texto: 'Permita las ventanas emergentes para imprimir.' }); }}
          className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50">
          Imprimir evaluación
        </button>
      </div>
    </div>
  );
}
