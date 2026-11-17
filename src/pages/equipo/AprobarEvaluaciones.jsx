import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAprobaciones } from '../../api/equipo';
import { ROJO, estadoGeneral, fecha, si, nombrePropio, periodoTexto, textoRecomendacion } from './evaluacionUtils';

const MI_ESTADO = {
  P: { texto: 'Espera su decisión', clase: 'bg-amber-50 text-amber-700' },
  A: { texto: 'Usted aprobó', clase: 'bg-green-50 text-green-700' },
  R: { texto: 'Usted rechazó', clase: 'bg-red-50 text-red-700' },
};
const MARCA = { A: ['✓', '#047857'], R: ['✕', '#b91c1c'], P: ['…', '#b45309'] };



/**
 * Aprobar evaluaciones: evaluaciones para renovación de contrato donde el
 * usuario es aprobador. Puede decidir cuando RR.HH. y el jefe ya calificaron.
 */
export default function AprobarEvaluaciones() {
  const [filas, setFilas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [vista, setVista] = useState('pendientes');

  useEffect(() => {
    getAprobaciones()
      .then(({ data }) => setFilas(data.data ?? []))
      .catch((e) => setError(e.response?.data?.message ?? 'No se pudieron cargar sus aprobaciones.'))
      .finally(() => setCargando(false));
  }, []);

  const pendientes = filas.filter((f) => f.mi_estado === 'P');
  const visibles = vista === 'pendientes' ? pendientes : filas;

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900">Aprobar evaluaciones</h1>
        <p className="text-sm text-gray-500 mt-1">
          Evaluaciones para la renovación de contrato en las que usted es aprobador. Cuando todos los aprobadores aprueban, Recursos Humanos puede generar el contrato.
        </p>
        <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Ver">
          {[['pendientes', `Por decidir (${pendientes.length})`], ['todas', `Todas (${filas.length})`]].map(([v, t]) => (
            <button key={v} type="button" aria-pressed={vista === v} onClick={() => setVista(v)}
              className="px-4 py-2 rounded-full text-sm font-semibold border"
              style={vista === v ? { background: ROJO, color: '#fff', borderColor: ROJO } : { borderColor: '#e5e7eb', color: '#374151' }}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {error && <p role="alert" className="bg-red-50 text-red-700 rounded-2xl px-4 py-3 text-sm font-semibold">{error}</p>}
      {cargando && <div className="space-y-3 animate-pulse">{[0, 1, 2].map((i) => <div key={i} className="h-24 bg-gray-100 rounded-2xl" />)}</div>}
      {!cargando && !error && visibles.length === 0 && (
        <p className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-sm text-gray-500">
          {vista === 'pendientes' ? 'No tiene evaluaciones por decidir.' : 'No tiene evaluaciones asignadas como aprobador.'}
        </p>
      )}

      <ul className="space-y-3">
        {visibles.map((f) => {
          const mio = MI_ESTADO[f.mi_estado] ?? MI_ESTADO.P;
          const general = estadoGeneral(f);
          const lista = f.estado === 'EN_PROCESO';
          const decide = f.mi_estado === 'P' && si(f.puede_resolver);
          return (
            <li key={`${f.empresa}-${f.aprobacion_id}`} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <div className="flex flex-wrap items-start gap-3">
                <div className="min-w-0 flex-1 basis-60">
                  <p className="font-bold text-gray-900">{nombrePropio(f.nombre_completo)}</p>
                  <p className="text-xs text-gray-500">{nombrePropio([f.cargo, f.area].filter(Boolean).join(' · '))} · {nombrePropio(f.empresa_nombre)}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${mio.clase}`}>{mio.texto}</span>
              </div>
              <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div><p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Período</p><p className="font-semibold capitalize">{periodoTexto(f.periodo)}</p></div>
                <div><p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Puntaje</p><p className="font-black">{Number(f.puntaje_total)} / {Number(f.puntaje_max)}</p></div>
                <div><p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Recomendación</p><p className="font-semibold">{textoRecomendacion(f.recomendacion_final)}</p></div>
                <div><p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Contrato vence</p><p className="font-semibold">{fecha(f.contrato_fec_fin)}</p></div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-600">
                <span className={`rounded-full px-2 py-0.5 font-bold ${general.clase}`}>{general.texto}</span>
                {f.aprobadores.map((a, i) => (
                  <span key={i} className="whitespace-nowrap">
                    <span className="font-black" style={{ color: MARCA[a.estado]?.[1] }} aria-hidden="true">{MARCA[a.estado]?.[0]}</span> {nombrePropio(a.nombre ?? a.usuario)}
                  </span>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
                {f.mi_estado === 'P' && lista && <span className="text-xs text-gray-400 mr-auto">Podrá decidir cuando RR.HH. y el jefe terminen de calificar.</span>}
                <Link to={`/equipo/aprobaciones/${f.empresa}/${f.cod_personal}/${f.periodo}`}
                  className="px-5 py-2 rounded-xl text-sm font-bold text-white"
                  style={{ background: decide ? ROJO : '#4b5563' }}>
                  {decide ? 'Revisar y decidir' : 'Ver evaluación'}
                </Link>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
