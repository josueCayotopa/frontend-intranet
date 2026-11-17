import { useCallback, useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { getEvaluacion, guardarEvaluacion } from '../../api/equipo';
import { RECOMENDACIONES, ROJO, estadoJefe, fecha, imprimirEvaluacion, nombrePropio, periodoTexto, textoRecomendacion } from './evaluacionUtils';

const num = (v) => (v === null || v === undefined || v === '' ? null : Number(v));

/**
 * El jefe califica la sección "Evaluación del jefe inmediato" (escala 0 a 5),
 * deja su recomendación y puede imprimir la evaluación. La sección de RR.HH.
 * se muestra solo como consulta.
 */
export default function EvaluarTrabajador() {
  const { empresa, codPersonal } = useParams();
  const [params] = useSearchParams();
  const periodo = params.get('periodo');

  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [puntajes, setPuntajes] = useState({});
  const [recomendacion, setRecomendacion] = useState('');
  const [justificacion, setJustificacion] = useState('');
  const [recomendaciones, setRecomendaciones] = useState('');

  // `cargando` empieza en true; las recargas posteriores mantienen la ficha visible.
  const cargar = useCallback(() => {
    return getEvaluacion(empresa, codPersonal, periodo)
      .then(({ data }) => {
        const d = data.data;
        setDatos(d);
        setPuntajes(Object.fromEntries(d.criterios
          .filter((c) => c.categoria === 'JEFE' && c.puntaje !== null)
          .map((c) => [c.criterio_id, { puntaje: num(c.puntaje), observacion: c.observacion ?? '' }])));
        setRecomendacion(d.cabecera?.recomendacion_final ?? '');
        setRecomendaciones(d.cabecera?.recomendaciones ?? '');
        setError('');
      })
      .catch((e) => setError(e.response?.data?.message ?? 'No se pudo cargar la evaluación.'))
      .finally(() => setCargando(false));
  }, [empresa, codPersonal, periodo]);

  useEffect(() => { cargar(); }, [cargar]);

  if (cargando && !datos) {
    return <div className="max-w-4xl mx-auto space-y-3 animate-pulse">{[0, 1, 2].map((i) => <div key={i} className="h-32 bg-gray-100 rounded-2xl" />)}</div>;
  }

  if (error && !datos) {
    return (
      <div className="max-w-4xl mx-auto bg-white rounded-3xl border border-gray-100 p-6">
        <p role="alert" className="text-sm font-semibold text-red-700">{error}</p>
        <Link to="/equipo/evaluaciones" className="inline-block mt-4 text-sm font-semibold" style={{ color: ROJO }}>← Volver a mi personal</Link>
      </div>
    );
  }

  const c = datos.cabecera;
  const existe = c.existe === true || c.existe === 1 || c.existe === '1';
  const bloqueada = !existe || c.estado === 'CONTRATO_GENERADO' || Number(c.genero_contrato) === 1;
  const criteriosJefe = datos.criterios.filter((x) => x.categoria === 'JEFE');
  const criteriosRh = datos.criterios.filter((x) => x.categoria === 'RH');
  const subtotal = criteriosJefe.reduce((s, x) => s + (puntajes[x.criterio_id]?.puntaje ?? 0) * Number(x.peso || 1), 0);
  const maximo = criteriosJefe.reduce((s, x) => s + Number(x.escala_max) * Number(x.peso || 1), 0);
  const calificados = criteriosJefe.filter((x) => puntajes[x.criterio_id]?.puntaje !== undefined).length;
  const est = estadoJefe({ estado: existe ? c.estado : null, falta_seccion: c.falta_seccion });

  function cambiar(id, valor) {
    setPuntajes((p) => ({ ...p, [id]: { ...(p[id] ?? {}), ...valor } }));
  }

  async function guardar(e) {
    e.preventDefault();
    setAviso(null);
    if (calificados < criteriosJefe.length) {
      setAviso({ error: true, texto: 'Califique todos los criterios antes de guardar.' });
      return;
    }
    if (recomendacion === 'NO' && !justificacion.trim() && !c.justificacion) {
      setAviso({ error: true, texto: 'Explique por qué no recomienda la renovación.' });
      return;
    }
    setGuardando(true);
    try {
      const { data } = await guardarEvaluacion(empresa, codPersonal, c.periodo, {
        puntajes: criteriosJefe.map((x) => ({
          criterio_id: Number(x.criterio_id),
          puntaje: puntajes[x.criterio_id].puntaje,
          observacion: puntajes[x.criterio_id].observacion?.trim() || null,
        })),
        recomendaciones: recomendaciones.trim() || null,
        recomendacion_final: recomendacion || null,
        justificacion: justificacion.trim() || null,
      });
      setAviso({ error: false, texto: data.message ?? 'Evaluación guardada.' });
      setJustificacion('');
      await cargar();
    } catch (err) {
      setAviso({ error: true, texto: err.response?.data?.message ?? 'No se pudo guardar.' });
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form onSubmit={guardar} className="max-w-4xl mx-auto space-y-5">
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
        <Link to="/equipo/evaluaciones" className="text-sm font-semibold" style={{ color: ROJO }}>← Mi personal</Link>
        <div className="mt-3 flex flex-wrap items-start gap-3">
          <div className="flex-1 min-w-[220px]">
            <h1 className="text-2xl font-bold text-gray-900">{nombrePropio(c.nombre_completo)}</h1>
            <p className="text-sm text-gray-500">{nombrePropio([c.cargo, c.area].filter(Boolean).join(' · '))} · {nombrePropio(c.empresa_nombre)}</p>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-bold ${est.clase}`}>{est.texto}</span>
        </div>
        <dl className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div><dt className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Período</dt><dd className="font-semibold capitalize">{periodoTexto(c.periodo)}</dd></div>
          <div><dt className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Contrato vence</dt><dd className="font-semibold">{fecha(c.contrato_fec_fin)}</dd></div>
          <div><dt className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Ingreso</dt><dd className="font-semibold">{fecha(c.fecha_ingreso ?? c.fec_ingreso_planilla)}</dd></div>
          <div><dt className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Su puntaje</dt><dd className="font-black text-lg" style={{ color: ROJO }}>{subtotal} / {maximo}</dd></div>
        </dl>
        {!existe && <p className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">Recursos Humanos aún no asignó la evaluación de este período.</p>}
        {existe && bloqueada && <p className="mt-4 rounded-2xl bg-gray-50 px-4 py-3 text-sm text-gray-600">El contrato ya fue renovado con esta evaluación; queda solo para consulta.</p>}
      </div>

      <section className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6" aria-labelledby="sec-jefe">
        <div className="flex flex-wrap items-center gap-2">
          <h2 id="sec-jefe" className="flex-1 text-lg font-bold text-gray-900">Evaluación del jefe inmediato</h2>
          <span className="text-xs font-semibold text-gray-500">{calificados} de {criteriosJefe.length} criterios · escala 0 a 5</span>
        </div>
        <ol className="mt-4 space-y-3">
          {criteriosJefe.map((x, i) => {
            const actual = puntajes[x.criterio_id] ?? {};
            return (
              <li key={x.criterio_id} className="rounded-2xl bg-gray-50 p-4">
                <p className="text-sm font-semibold text-gray-800">{i + 1}. {x.descripcion}</p>
                <div role="group" aria-label={`Puntaje de ${x.descripcion}`} className="mt-2 flex flex-wrap gap-2">
                  {Array.from({ length: Number(x.escala_max) + 1 }, (_, n) => (
                    <button key={n} type="button" disabled={bloqueada} aria-pressed={actual.puntaje === n}
                      onClick={() => cambiar(x.criterio_id, { puntaje: n })}
                      className="w-11 h-11 rounded-xl border text-sm font-bold transition-all active:scale-95 disabled:opacity-60"
                      style={actual.puntaje === n ? { background: ROJO, color: '#fff', borderColor: ROJO } : { background: '#fff', color: '#374151', borderColor: '#e5e7eb' }}>
                      {n}
                    </button>
                  ))}
                </div>
                <input className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm disabled:bg-gray-100"
                  placeholder="Observación (opcional)" maxLength={2000} disabled={bloqueada} value={actual.observacion ?? ''}
                  onChange={(e) => cambiar(x.criterio_id, { observacion: e.target.value })} aria-label={`Observación sobre ${x.descripcion}`} />
              </li>
            );
          })}
        </ol>
      </section>

      <section className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6" aria-labelledby="sec-rec">
        <h2 id="sec-rec" className="text-lg font-bold text-gray-900">Su recomendación</h2>
        <div role="radiogroup" aria-label="Recomendación" className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
          {RECOMENDACIONES.map((r) => (
            <button key={r.valor} type="button" role="radio" aria-checked={recomendacion === r.valor} disabled={bloqueada}
              onClick={() => setRecomendacion(r.valor)}
              className="rounded-2xl border px-3 py-2.5 text-left text-sm font-bold transition-all disabled:opacity-60"
              style={recomendacion === r.valor ? { borderColor: ROJO, boxShadow: `inset 0 0 0 1px ${ROJO}`, color: r.valor === 'NO' ? ROJO : '#111827' } : { borderColor: '#e5e7eb', color: r.valor === 'NO' ? ROJO : '#374151' }}>
              {r.texto}
            </button>
          ))}
        </div>
        {recomendacion === 'NO' && (
          <textarea className="mt-3 w-full rounded-2xl border border-gray-200 px-3 py-2 text-sm" rows={3} maxLength={2000} disabled={bloqueada}
            placeholder="Justificación (obligatoria): motivos de la no renovación" value={justificacion} onChange={(e) => setJustificacion(e.target.value)} />
        )}
        <textarea className="mt-3 w-full rounded-2xl border border-gray-200 px-3 py-2 text-sm" rows={3} maxLength={1000} disabled={bloqueada}
          placeholder="Recomendaciones para el trabajador (opcional)" value={recomendaciones} onChange={(e) => setRecomendaciones(e.target.value)} />
      </section>

      {criteriosRh.some((x) => x.puntaje !== null) && (
        <details className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
          <summary className="cursor-pointer text-sm font-bold text-gray-700">Ver calificación de Recursos Humanos</summary>
          <ul className="mt-3 space-y-1 text-sm">
            {criteriosRh.map((x) => <li key={x.criterio_id} className="flex justify-between gap-3"><span>{x.descripcion}</span><span className="font-semibold">{x.puntaje ?? '—'} / {x.escala_max}</span></li>)}
          </ul>
        </details>
      )}

      {aviso && (
        <p role={aviso.error ? 'alert' : 'status'} className={`rounded-2xl px-4 py-3 text-sm font-semibold ${aviso.error ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>{aviso.texto}</p>
      )}

      <div className="flex flex-wrap justify-end gap-3 pb-6">
        {existe && (
          <button type="button" onClick={() => { if (!imprimirEvaluacion(datos)) setAviso({ error: true, texto: 'Permita las ventanas emergentes para imprimir.' }); }}
            className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50">
            Imprimir evaluación
          </button>
        )}
        {!bloqueada && (
          <button type="submit" disabled={guardando} className="px-6 py-2.5 rounded-xl text-sm font-bold text-white active:scale-95 disabled:opacity-60" style={{ background: ROJO }}>
            {guardando ? 'Guardando…' : 'Guardar mi evaluación'}
          </button>
        )}
      </div>
      {c.recomendacion_final && <p className="text-xs text-gray-400 text-right -mt-4 pb-4">Recomendación guardada: {textoRecomendacion(c.recomendacion_final)}</p>}
    </form>
  );
}
