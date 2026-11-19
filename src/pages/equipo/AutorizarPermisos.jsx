import { useCallback, useEffect, useState } from 'react';
import { getPermisosEquipo } from '../../api/permisos';
import { DetallePermiso, Etapa } from '../permisos/DetallePermiso';
import { horario } from '../permisos/permisosUtils';
import { ROJO, fecha, nombrePropio } from './evaluacionUtils';

/**
 * Autorizar permisos: el jefe firma como "Administrador de Sede" las solicitudes
 * de su personal a cargo. Al autorizar pasan a Recursos Humanos.
 */
export default function AutorizarPermisos() {
  const [filas, setFilas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [vista, setVista] = useState('pendientes');
  const [detalle, setDetalle] = useState(null);

  const cargar = useCallback(() => getPermisosEquipo()
    .then(({ data }) => { setFilas(data.data ?? []); setError(''); })
    .catch((e) => setError(e.response?.data?.message ?? 'No se pudieron cargar los permisos.'))
    .finally(() => setCargando(false)), []);

  useEffect(() => { cargar(); }, [cargar]);

  const pendientes = filas.filter((f) => f.etapa === 'PENDIENTE_JEFE');
  const visibles = vista === 'pendientes' ? pendientes : filas;

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900">Autorizar permisos</h1>
        <p className="text-sm text-gray-500 mt-1">Solicitudes de permiso de su personal a cargo. Usted autoriza como Administrador de Sede; luego pasan a Recursos Humanos.</p>
        <div className="mt-4 flex flex-wrap items-center gap-2" role="group" aria-label="Ver">
          {[['pendientes', `Por autorizar (${pendientes.length})`], ['todas', `Todas (${filas.length})`]].map(([v, t]) => (
            <button key={v} type="button" aria-pressed={vista === v} onClick={() => setVista(v)}
              className="px-4 py-2 rounded-full text-sm font-semibold border transition-all"
              style={vista === v ? { background: ROJO, color: '#fff', borderColor: ROJO } : { borderColor: '#e5e7eb', color: '#374151' }}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {error && <p role="alert" className="bg-red-50 text-red-700 rounded-2xl px-4 py-3 text-sm font-semibold">{error}</p>}
      {cargando && <div className="space-y-3 animate-pulse">{[0, 1, 2].map((i) => <div key={i} className="h-20 bg-gray-100 rounded-2xl" />)}</div>}
      {!cargando && !error && visibles.length === 0 && (
        <p className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-sm text-gray-500">
          {vista === 'pendientes' ? 'No tiene permisos por autorizar.' : 'Su personal aún no tiene solicitudes de permiso.'}
        </p>
      )}

      <ul className="space-y-3">
        {visibles.map((s) => (
          <li key={`${s.empresa}-${s.id}`}>
            <button type="button" onClick={() => setDetalle(s)} className="w-full text-left bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition">
              <div className="flex flex-wrap items-start gap-3">
                <div className="min-w-0 flex-1 basis-60">
                  <p className="font-bold text-gray-900">{nombrePropio(s.nombre_completo)}</p>
                  <p className="text-xs text-gray-500">{nombrePropio([s.cargo, s.area].filter(Boolean).join(' · '))} · {nombrePropio(s.empresa_nombre)}</p>
                </div>
                <Etapa s={s} />
              </div>
              <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div className="col-span-2"><p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Tipo</p>
                  <p className="font-semibold">{s.des_motivo}{s.des_otro_motivo ? `: ${s.des_otro_motivo}` : ''}</p></div>
                <div><p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Fechas</p><p className="font-semibold">{fecha(s.fecha_inicio)} al {fecha(s.fecha_fin)}</p></div>
                <div><p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Días</p><p className="font-black text-lg">{s.dias_solicitados}{horario(s) && <span className="block text-xs font-semibold">{horario(s)}</span>}</p></div>
              </div>
              {Number(s.docs_oblig_faltan) > 0 && <p className="mt-2 text-xs font-semibold text-red-700">Falta un documento obligatorio.</p>}
            </button>
          </li>
        ))}
      </ul>

      {detalle && (
        <DetallePermiso modo="equipo" empresa={detalle.empresa} id={Number(detalle.id)} onCerrar={() => setDetalle(null)} onCambio={cargar} />
      )}
    </div>
  );
}
