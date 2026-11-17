import { useCallback, useEffect, useState } from 'react';
import { getVacacionesEquipo, resolverVacacionEquipo } from '../../api/equipo';
import { imprimirFormularioVac } from '../../utils/formulariosVac';
import { ROJO, fecha, nombrePropio } from './evaluacionUtils';

const TIPO = { VG: 'Goce de vacaciones', VC: 'Compra de vacaciones' };

const ETAPA = {
  PENDIENTE_JEFE: { texto: 'Espera su aprobación', clase: 'bg-amber-50 text-amber-700' },
  PENDIENTE_RRHH: { texto: 'Aprobada · en RR.HH.', clase: 'bg-blue-50 text-blue-700' },
  POR_PLANILLA: { texto: 'Aprobada por RR.HH.', clase: 'bg-green-50 text-green-700' },
  EN_PLANILLA: { texto: 'Registrada en planilla', clase: 'bg-green-50 text-green-700' },
  RECHAZADA: { texto: 'Rechazada', clase: 'bg-red-50 text-red-700' },
  CANCELADA: { texto: 'Cancelada', clase: 'bg-gray-100 text-gray-500' },
};

const dmy = (iso) => (iso ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}` : '');
const num = (v) => (v === null || v === undefined || v === '' ? null : Number(v));

function imprimir(s) {
  imprimirFormularioVac({
    solicitud: {
      tipo: s.tip_vacaciones, num_dias: num(s.num_dias), fec_inicio: dmy(s.fec_inicio), fec_final: dmy(s.fec_final),
      periodo_vac: s.periodo_vac, imp_adelanto: num(s.imp_adelanto_vacac), descuento_afp: num(s.descuento_afp), ano_proceso: s.ano_proceso,
    },
    empleado: { nombre_completo: s.nombre_completo, cargo: s.cargo, area: s.area, empresa: nombrePropio(s.empresa_nombre), sede: '', fecha_ingreso: s.fec_ingreso },
    user: { dni: s.dni },
  });
}

/** Rechazo con motivo obligatorio. */
function ModalRechazo({ solicitud, onCerrar, onConfirmar, enviando }) {
  const [motivo, setMotivo] = useState('');
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onCerrar}>
      <form className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-4" onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => { e.preventDefault(); if (motivo.trim()) onConfirmar(motivo.trim()); }}
        role="dialog" aria-modal="true" aria-labelledby="titulo-rechazo">
        <h2 id="titulo-rechazo" className="text-lg font-bold text-gray-900">Rechazar solicitud</h2>
        <p className="text-sm text-gray-500">{nombrePropio(solicitud.nombre_completo)} · {fecha(solicitud.fec_inicio)} al {fecha(solicitud.fec_final)}</p>
        <label className="block">
          <span className="text-xs font-bold uppercase tracking-wide text-gray-500">Motivo del rechazo</span>
          <textarea className="mt-1 w-full rounded-2xl border border-gray-200 px-3 py-2 text-sm" rows={3} maxLength={500} required autoFocus
            value={motivo} onChange={(e) => setMotivo(e.target.value)} />
        </label>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onCerrar} className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600">Volver</button>
          <button type="submit" disabled={enviando || !motivo.trim()} className="px-4 py-2 rounded-xl text-sm font-bold text-white disabled:opacity-60" style={{ background: ROJO }}>
            {enviando ? 'Guardando…' : 'Rechazar'}
          </button>
        </div>
      </form>
    </div>
  );
}

/**
 * Aprobar vacaciones: solicitudes de goce y compra del personal a cargo del jefe
 * (según la intranet). Al aprobar pasan a Recursos Humanos.
 */
export default function AprobarVacaciones() {
  const [filas, setFilas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [vista, setVista] = useState('pendientes');
  const [aviso, setAviso] = useState(null);
  const [enviando, setEnviando] = useState(null);
  const [rechazo, setRechazo] = useState(null);

  const cargar = useCallback(() => getVacacionesEquipo()
    .then(({ data }) => { setFilas(data.data ?? []); setError(''); })
    .catch((e) => setError(e.response?.data?.message ?? 'No se pudieron cargar las solicitudes.'))
    .finally(() => setCargando(false)), []);

  useEffect(() => { cargar(); }, [cargar]);

  async function resolver(s, accion, obs = null) {
    setEnviando(`${s.empresa}-${s.cod_personal}-${s.cod_corr_sol}`);
    setAviso(null);
    try {
      const { data } = await resolverVacacionEquipo(s, accion, obs);
      setAviso({ error: false, texto: `${data.message} (${nombrePropio(s.nombre_completo)})` });
      setRechazo(null);
      await cargar();
      window.dispatchEvent(new Event('equipo:actualizado'));
    } catch (e) {
      setAviso({ error: true, texto: e.response?.data?.message ?? 'No se pudo registrar la decisión.' });
    } finally {
      setEnviando(null);
    }
  }

  const pendientes = filas.filter((f) => f.etapa === 'PENDIENTE_JEFE');
  const visibles = vista === 'pendientes' ? pendientes : filas;

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900">Aprobar vacaciones</h1>
        <p className="text-sm text-gray-500 mt-1">Solicitudes de goce y compra de vacaciones de su personal a cargo. Al aprobarlas pasan a Recursos Humanos.</p>
        <div className="mt-4 flex flex-wrap items-center gap-2" role="group" aria-label="Ver">
          {[['pendientes', `Por aprobar (${pendientes.length})`], ['todas', `Todas (${filas.length})`]].map(([v, t]) => (
            <button key={v} type="button" aria-pressed={vista === v} onClick={() => setVista(v)}
              className="px-4 py-2 rounded-full text-sm font-semibold border transition-all"
              style={vista === v ? { background: ROJO, color: '#fff', borderColor: ROJO } : { borderColor: '#e5e7eb', color: '#374151' }}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {aviso && (
        <p role={aviso.error ? 'alert' : 'status'} className={`rounded-2xl px-4 py-3 text-sm font-semibold ${aviso.error ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>{aviso.texto}</p>
      )}
      {error && <p role="alert" className="bg-red-50 text-red-700 rounded-2xl px-4 py-3 text-sm font-semibold">{error}</p>}

      {cargando && <div className="space-y-3 animate-pulse">{[0, 1, 2].map((i) => <div key={i} className="h-24 bg-gray-100 rounded-2xl" />)}</div>}

      {!cargando && !error && visibles.length === 0 && (
        <p className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-sm text-gray-500">
          {vista === 'pendientes' ? 'No tiene solicitudes por aprobar.' : 'Su personal aún no tiene solicitudes de vacaciones.'}
        </p>
      )}

      <ul className="space-y-3">
        {visibles.map((s) => {
          const clave = `${s.empresa}-${s.cod_personal}-${s.cod_corr_sol}`;
          const et = ETAPA[s.etapa] ?? { texto: s.etapa, clase: 'bg-gray-100 text-gray-600' };
          const dias = num(s.num_dias) ?? 0;
          const saldo = num(s.saldo);
          const excede = saldo !== null && s.etapa === 'PENDIENTE_JEFE' && dias > saldo;
          const compra = s.tip_vacaciones === 'VC';
          return (
            <li key={clave} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <div className="flex flex-wrap items-start gap-3">
                <div className="min-w-0 flex-1 basis-60">
                  <p className="font-bold text-gray-900">{nombrePropio(s.nombre_completo)}</p>
                  <p className="text-xs text-gray-500">{nombrePropio([s.cargo, s.area].filter(Boolean).join(' · '))} · {nombrePropio(s.empresa_nombre)}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${et.clase}`}>{et.texto}</span>
              </div>
              <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div><p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Tipo</p><p className="font-semibold" style={compra ? { color: '#b45309' } : undefined}>{TIPO[s.tip_vacaciones] ?? s.tip_vacaciones}</p></div>
                <div><p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Fechas</p><p className="font-semibold">{fecha(s.fec_inicio)} al {fecha(s.fec_final)}</p></div>
                <div><p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Días</p><p className="font-black text-lg">{dias}</p></div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Saldo del trabajador</p>
                  <p className={`font-semibold ${excede ? 'text-red-700' : ''}`}>{saldo === null ? '—' : `${saldo} días`}{excede && ' · supera el saldo'}</p>
                </div>
              </div>
              {(s.obs_jefe || s.obs_rrhh) && <p className="mt-2 text-xs text-gray-500">Observación: {s.obs_jefe || s.obs_rrhh}</p>}
              <div className="mt-3 flex flex-wrap justify-end gap-2">
                <button type="button" onClick={() => imprimir(s)} className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50">Imprimir formato</button>
                {s.etapa === 'PENDIENTE_JEFE' && (
                  <>
                    <button type="button" disabled={enviando === clave} onClick={() => setRechazo(s)}
                      className="px-4 py-2 rounded-xl border text-sm font-bold disabled:opacity-60" style={{ borderColor: ROJO, color: ROJO }}>Rechazar</button>
                    <button type="button" disabled={enviando === clave} onClick={() => resolver(s, 'aprobar')}
                      className="px-5 py-2 rounded-xl text-sm font-bold text-white disabled:opacity-60" style={{ background: '#059669' }}>
                      {enviando === clave ? 'Guardando…' : 'Aprobar'}
                    </button>
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {rechazo && (
        <ModalRechazo solicitud={rechazo} enviando={Boolean(enviando)} onCerrar={() => setRechazo(null)}
          onConfirmar={(motivo) => resolver(rechazo, 'rechazar', motivo)} />
      )}
    </div>
  );
}
