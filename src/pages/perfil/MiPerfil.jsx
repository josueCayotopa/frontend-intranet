import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { formatDateFromISO } from '../../utils/formatters';

function InfoRow({ label, value }) {
  return (
    <div className="py-3 flex justify-between items-start border-b border-gray-50 last:border-0">
      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide w-36 shrink-0">{label}</span>
      <span className="text-sm text-gray-800 text-right">{value ?? '—'}</span>
    </div>
  );
}

export default function MiPerfil() {
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/perfil')
      .then(({ data }) => setPerfil(data.data))
      .catch(() => setError('No se pudo cargar el perfil.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <div className="text-gray-400">Cargando perfil…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  const inicial = (perfil?.nombre_completo ?? '?').trim().charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-6">Mi Perfil</h1>

        {/* Avatar + nombre */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 mb-4 flex items-center gap-6">
          <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center text-white text-3xl font-bold shrink-0">
            {inicial}
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{perfil?.nombre_completo?.trim()}</h2>
            <p className="text-gray-500 mt-1">{perfil?.cargo}</p>
            <span className="inline-block mt-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-semibold">
              {perfil?.rol_sistema ?? 'Usuario'}
            </span>
          </div>
        </div>

        {/* Datos laborales */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mb-4">
          <h3 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wide">Datos Laborales</h3>
          <InfoRow label="Empresa" value={perfil?.empresa} />
          <InfoRow label="Área" value={perfil?.area} />
          <InfoRow label="Cargo" value={perfil?.cargo} />
          <InfoRow label="Fecha de Ingreso" value={formatDateFromISO(perfil?.fecha_ingreso)} />
        </div>

        {/* Datos personales */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wide">Datos Personales</h3>
          <InfoRow label="DNI" value={perfil?.dni} />
          <InfoRow label="Correo" value={perfil?.correo} />
          <InfoRow label="Teléfono" value={perfil?.telefono} />
        </div>
      </div>
    </div>
  );
}
