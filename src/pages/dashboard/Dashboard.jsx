import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { formatCurrency, formatDateFromISO } from '../../utils/formatters';

function useDashboardData() {
  const [perfil, setPerfil] = useState(null);
  const [ultimaBoleta, setUltimaBoleta] = useState(null);
  const [vacaciones, setVacaciones] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      api.get('/perfil'),
      api.get('/remuneraciones'),
      api.get('/vacaciones'),
    ]).then(([resPerfil, resBoletas, resVac]) => {
      if (resPerfil.status === 'fulfilled') setPerfil(resPerfil.value.data?.data);
      if (resBoletas.status === 'fulfilled') setUltimaBoleta(resBoletas.value.data?.data?.[0] ?? null);
      if (resVac.status === 'fulfilled') setVacaciones(resVac.value.data?.data ?? null);
      setLoading(false);
    });
  }, []);

  return { perfil, ultimaBoleta, vacaciones, loading };
}

const DIAS_SEMANA = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MESES_ES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

function hoyFormateado() {
  const hoy = new Date();
  return `${DIAS_SEMANA[hoy.getDay()].charAt(0).toUpperCase() + DIAS_SEMANA[hoy.getDay()].slice(1)}, ${hoy.getDate()} de ${MESES_ES[hoy.getMonth()]}`;
}

export default function Dashboard() {
  const { perfil, ultimaBoleta, vacaciones, loading } = useDashboardData();

  const nombre = perfil?.laboral?.nombres ?? 'Usuario';
  const inicial = (perfil?.laboral?.nombres ?? '?').trim().charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans">
      {/* Header */}
      <header className="max-w-5xl mx-auto mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Inicio</h1>
          <p className="text-clinica-gris mt-1">{hoyFormateado()}</p>
        </div>
        <div className="w-12 h-12 bg-clinica-rojo rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm border-2 border-white">
          {loading ? '…' : inicial}
        </div>
      </header>

      {/* Bento Grid */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-5 auto-rows-[160px]">

        {/* Mi Perfil — 2×2 */}
        <Link
          to="/perfil"
          className="col-span-1 md:col-span-2 md:row-span-2 bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow group"
        >
          <div>
            <span className="inline-block px-3 py-1 bg-clinica-rojo-bg text-clinica-rojo rounded-full text-xs font-semibold tracking-wide mb-4">
              Mi Perfil
            </span>
            {loading ? (
              <div className="space-y-2">
                <div className="h-8 bg-gray-100 rounded-xl w-3/4 animate-pulse" />
                <div className="h-5 bg-gray-100 rounded-xl w-1/2 animate-pulse" />
              </div>
            ) : (
              <>
                <h2 className="text-3xl font-bold text-gray-800">Hola, {nombre}</h2>
                <p className="text-clinica-gris mt-2 text-base leading-snug">{perfil?.laboral?.cargo ?? 'Sin cargo asignado'}</p>
              </>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="bg-clinica-gris-bg rounded-2xl p-4 transition-colors group-hover:bg-gray-100">
              <p className="text-xs text-clinica-gris font-medium uppercase">Área</p>
              <p className="text-gray-800 font-semibold mt-1 text-sm">{loading ? '…' : (perfil?.laboral?.area ?? '—')}</p>
            </div>
            <div className="bg-clinica-gris-bg rounded-2xl p-4 transition-colors group-hover:bg-gray-100">
              <p className="text-xs text-clinica-gris font-medium uppercase">Ingreso</p>
              <p className="text-gray-800 font-semibold mt-1 text-sm">
                {loading ? '…' : (perfil?.laboral?.fecha_ingreso ? formatDateFromISO(perfil.laboral.fecha_ingreso) : '—')}
              </p>
            </div>
          </div>
        </Link>

        {/* Vacaciones — 1×1 */}
        <Link
          to="/vacaciones"
          className="col-span-1 md:col-span-1 md:row-span-1 bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col justify-center items-center hover:scale-[1.02] transition-transform cursor-pointer relative overflow-hidden group"
        >
          {/* Acento rojo sutil en la parte superior */}
          <div className="absolute top-0 left-0 w-full h-1 bg-clinica-rojo opacity-20 group-hover:opacity-100 transition-opacity"></div>
          
          <p className="text-sm font-medium text-clinica-gris mb-1">Días gozados</p>
          <p className="text-5xl font-bold text-clinica-rojo tracking-tighter">
            {loading ? '…' : (vacaciones?.dias_gozados_anio ?? 0)}
          </p>
          <p className="text-xs text-clinica-gris mt-1">{new Date().getFullYear()}</p>
          <span className="mt-4 text-xs font-semibold bg-clinica-gris-bg text-clinica-gris px-4 py-1.5 rounded-full group-hover:bg-clinica-rojo group-hover:text-white transition-colors">
            Ver detalle
          </span>
        </Link>

        {/* Última Boleta — 1×1 */}
        <Link
          to="/remuneraciones"
          className="col-span-1 md:col-span-1 md:row-span-1 bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col justify-center items-center hover:scale-[1.02] transition-transform cursor-pointer relative overflow-hidden group"
        >
          {/* Acento gris sutil en la parte superior */}
          <div className="absolute top-0 left-0 w-full h-1 bg-clinica-gris opacity-20 group-hover:opacity-100 transition-opacity"></div>

          <div className="w-10 h-10 bg-clinica-gris-bg rounded-full flex items-center justify-center mb-3 group-hover:bg-gray-200 transition-colors">
            <svg className="w-5 h-5 text-clinica-gris-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          {loading ? (
            <div className="h-4 bg-gray-100 rounded w-20 animate-pulse" />
          ) : ultimaBoleta ? (
            <>
              <p className="text-sm font-semibold text-gray-800 text-center">{ultimaBoleta.periodo}</p>
              <p className="text-lg font-bold text-clinica-gris-dark mt-1">{formatCurrency(ultimaBoleta.neto)}</p>
            </>
          ) : (
            <p className="text-sm text-clinica-gris text-center">Sin boletas</p>
          )}
        </Link>

        {/* Pendientes vacaciones — 2×1 */}
        <div className="col-span-1 md:col-span-2 md:row-span-1 bg-clinica-rojo rounded-3xl p-6 shadow-sm flex flex-col justify-center relative overflow-hidden">
          {/* Círculo decorativo usando el rojo-light */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-clinica-rojo-light rounded-full -mr-10 -mt-10 opacity-50 blur-2xl" />
          
          <h3 className="text-white text-base font-semibold mb-1 z-10">Solicitudes pendientes</h3>
          {loading ? (
            <div className="h-4 bg-clinica-rojo-light rounded w-1/2 animate-pulse z-10" />
          ) : (
            <p className="text-white opacity-90 text-sm z-10">
              {vacaciones?.dias_pendientes
                ? `Tienes ${vacaciones.dias_pendientes} días en solicitudes pendientes de aprobación.`
                : 'No tienes solicitudes de vacaciones pendientes.'}
            </p>
          )}
          <Link to="/vacaciones" className="text-white opacity-70 text-sm font-medium mt-3 hover:opacity-100 z-10 w-fit transition-opacity flex items-center">
            Ver mis trámites
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
          </Link>
        </div>

      </div>
    </div>
  );
}