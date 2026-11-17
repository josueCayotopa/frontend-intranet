import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getEquipo } from '../../api/equipo';
import { ROJO, estadoJefe, fecha, nombrePropio, periodoTexto } from './evaluacionUtils';

/**
 * Evaluar a mi personal: trabajadores a cargo del jefe (según la intranet) y el
 * estado de su evaluación para renovación de contrato. RR.HH. asigna la
 * evaluación; aquí el jefe califica su sección.
 */
export default function MiEquipoEvaluaciones() {
  const [filas, setFilas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [soloPendientes, setSoloPendientes] = useState(false);

  useEffect(() => {
    getEquipo()
      .then(({ data }) => setFilas(data.data ?? []))
      .catch((e) => setError(e.response?.data?.message ?? 'No se pudo cargar su personal.'))
      .finally(() => setCargando(false));
  }, []);

  const pendientes = filas.filter((f) => f.pendiente_jefe === '1' || f.pendiente_jefe === 1 || f.pendiente_jefe === true);
  const visibles = soloPendientes ? pendientes : filas;

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900">Evaluar a mi personal</h1>
        <p className="text-sm text-gray-500 mt-1">
          Evaluación para la renovación de contrato del personal a su cargo. Recursos Humanos asigna la evaluación y usted califica la sección del jefe inmediato.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <div className="rounded-2xl px-4 py-3" style={{ background: '#fdf2f2' }}>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Pendientes de calificar</p>
            <p className="text-2xl font-black" style={{ color: ROJO }}>{cargando ? '…' : pendientes.length}</p>
          </div>
          <div className="rounded-2xl px-4 py-3 bg-gray-50">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Personal a cargo</p>
            <p className="text-2xl font-black text-gray-800">{cargando ? '…' : filas.length}</p>
          </div>
          <label className="ml-auto flex items-center gap-2 self-end text-sm font-medium text-gray-600">
            <input type="checkbox" checked={soloPendientes} onChange={(e) => setSoloPendientes(e.target.checked)} />
            Solo pendientes
          </label>
        </div>
      </div>

      {error && <p role="alert" className="bg-red-50 text-red-700 rounded-2xl px-4 py-3 text-sm font-semibold">{error}</p>}

      {cargando && (
        <div className="space-y-3 animate-pulse">
          {[0, 1, 2].map((i) => <div key={i} className="h-20 bg-gray-100 rounded-2xl" />)}
        </div>
      )}

      {!cargando && !error && visibles.length === 0 && (
        <p className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-sm text-gray-500">
          {soloPendientes ? 'No tiene evaluaciones pendientes. ¡Todo al día!' : 'No tiene personal a su cargo registrado en la intranet.'}
        </p>
      )}

      <ul className="space-y-3">
        {visibles.map((f) => {
          const est = estadoJefe(f);
          const vence = f.dias_restantes !== null && f.dias_restantes !== undefined ? Number(f.dias_restantes) : null;
          return (
            <li key={`${f.empresa}-${f.cod_personal}`} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-wrap items-center gap-4">
              <div className="min-w-0 flex-1 basis-60">
                <p className="font-bold text-gray-900">{nombrePropio(f.nombre_completo)}</p>
                <p className="text-xs text-gray-500">{nombrePropio([f.cargo, f.area].filter(Boolean).join(' · '))} · {nombrePropio(f.empresa_nombre)}</p>
              </div>
              <div className="text-xs text-gray-600 basis-40">
                <p className="font-semibold uppercase tracking-wide text-[10px] text-gray-400">Contrato</p>
                <p className={vence !== null && vence <= 30 ? 'font-bold text-amber-700' : ''}>
                  {f.contrato_fec_fin ? `Vence ${fecha(f.contrato_fec_fin)}` : 'Sin contrato en proceso'}
                  {vence !== null && vence < 0 && ' (vencido)'}
                </p>
              </div>
              <div className="basis-40">
                <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${est.clase}`}>{est.texto}</span>
                {f.periodo && <p className="text-[11px] text-gray-400 mt-1 capitalize">Período {periodoTexto(f.periodo)}</p>}
              </div>
              {f.periodo ? (
                <Link
                  to={`/equipo/evaluaciones/${f.empresa}/${f.cod_personal}?periodo=${f.periodo}`}
                  className="ml-auto px-4 py-2 rounded-xl text-sm font-bold text-white active:scale-95"
                  style={{ background: est.texto.startsWith('Pendiente') ? ROJO : '#4b5563' }}
                >
                  {est.texto.startsWith('Pendiente') ? 'Evaluar' : 'Ver'}
                </Link>
              ) : (
                <span className="ml-auto text-xs text-gray-400">RR.HH. aún no asigna</span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
