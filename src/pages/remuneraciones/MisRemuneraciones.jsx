import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { formatCurrency } from '../../utils/formatters';

function BoletaDetalle({ anio, mes, onClose }) {
  const [detalle, setDetalle] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/remuneraciones/${anio}/${mes}`)
      .then(({ data }) => setDetalle(data.data))
      .finally(() => setLoading(false));
  }, [anio, mes]);

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-3xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {loading ? 'Cargando…' : `Boleta ${detalle?.periodo}`}
            </h2>
            {detalle && <p className="text-sm text-gray-500 mt-0.5">{detalle.empresa}</p>}
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200">
            ✕
          </button>
        </div>

        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-4 bg-gray-100 rounded animate-pulse" />)}
          </div>
        ) : detalle ? (
          <div className="p-6 space-y-5">
            {/* Ingresos */}
            <section>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Ingresos</h3>
              {detalle.ingresos.map((item, i) => (
                <div key={i} className="flex justify-between py-1.5 border-b border-gray-50">
                  <span className="text-sm text-gray-700">{item.concepto}</span>
                  <span className="text-sm font-semibold text-gray-900">{formatCurrency(item.monto)}</span>
                </div>
              ))}
              <div className="flex justify-between py-2 mt-1">
                <span className="text-sm font-bold text-gray-700">Total ingresos</span>
                <span className="text-sm font-bold text-emerald-600">{formatCurrency(detalle.total_ingresos)}</span>
              </div>
            </section>

            {/* Descuentos */}
            <section>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Descuentos</h3>
              {detalle.descuentos.map((item, i) => (
                <div key={i} className="flex justify-between py-1.5 border-b border-gray-50">
                  <span className="text-sm text-gray-700">{item.concepto}</span>
                  <span className="text-sm font-semibold text-gray-900">{formatCurrency(item.monto)}</span>
                </div>
              ))}
              <div className="flex justify-between py-2 mt-1">
                <span className="text-sm font-bold text-gray-700">Total descuentos</span>
                <span className="text-sm font-bold text-red-500">{formatCurrency(detalle.total_descuentos)}</span>
              </div>
            </section>

            {/* Neto */}
            <div className="bg-gray-900 rounded-2xl p-4 flex justify-between items-center">
              <span className="text-white font-bold">Neto a pagar</span>
              <span className="text-white text-xl font-bold">{formatCurrency(detalle.neto)}</span>
            </div>
          </div>
        ) : (
          <div className="p-6 text-center text-gray-400">No se encontró información.</div>
        )}
      </div>
    </div>
  );
}

export default function MisRemuneraciones() {
  const [boletas, setBoletas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seleccionada, setSeleccionada] = useState(null);

  useEffect(() => {
    api.get('/remuneraciones')
      .then(({ data }) => setBoletas(data.data ?? []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-2">Mis Remuneraciones</h1>
        <p className="text-gray-500 mb-6 text-sm">Historial de boletas de pago</p>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 animate-pulse h-20" />
            ))}
          </div>
        ) : boletas.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-gray-100">
            <p className="text-gray-400">No se encontraron boletas disponibles.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {boletas.map((b) => (
              <button
                key={`${b.anio}-${b.mes}`}
                onClick={() => setSeleccionada(b)}
                className="w-full bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{b.periodo}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Neto: {formatCurrency(b.neto)}</p>
                  </div>
                </div>
                <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ))}
          </div>
        )}
      </div>

      {seleccionada && (
        <BoletaDetalle
          anio={seleccionada.anio}
          mes={seleccionada.mes}
          onClose={() => setSeleccionada(null)}
        />
      )}
    </div>
  );
}
