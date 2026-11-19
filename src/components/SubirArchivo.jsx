import { useId, useRef, useState } from 'react';

const ROJO = '#B11A1A';

const tamano = (b) => (b < 1024 * 1024 ? `${Math.max(1, Math.round(b / 1024))} KB` : `${(b / 1024 / 1024).toFixed(1)} MB`);

/**
 * Campo para subir un archivo: zona punteada para arrastrar o hacer clic.
 * Al elegir muestra nombre, tamaño y "Quitar". Controlado: `archivo` / `onCambio(File|null)`.
 */
export default function SubirArchivo({ etiqueta, obligatorio = false, archivo, onCambio, accept = '.pdf,.jpg,.jpeg,.png', ayuda = 'PDF, JPG o PNG · máx. 10 MB', error }) {
  const id = useId();
  const input = useRef(null);
  const [encima, setEncima] = useState(false);

  const elegir = (f) => {
    onCambio(f ?? null);
    if (input.current) input.current.value = '';
  };

  const esPdf = archivo?.name?.toLowerCase().endsWith('.pdf');

  return (
    <div>
      {etiqueta && (
        <label htmlFor={id} className="block text-xs font-bold uppercase tracking-wide text-gray-500 mb-1.5">
          {etiqueta}{' '}
          {obligatorio ? <span className="text-red-700">· obligatorio</span> : <span className="font-semibold normal-case tracking-normal text-gray-400">(opcional)</span>}
        </label>
      )}

      {archivo ? (
        <div className="flex items-center gap-3 rounded-2xl border-2 border-green-200 bg-green-50 px-4 py-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[11px] font-black"
            style={{ color: esPdf ? ROJO : '#2563eb' }}>
            {esPdf ? 'PDF' : 'IMG'}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-gray-900" title={archivo.name}>{archivo.name}</p>
            <p className="text-xs text-green-700">{tamano(archivo.size)} · listo para enviar</p>
          </div>
          <button type="button" onClick={() => input.current?.click()} className="text-xs font-bold text-gray-600 hover:underline">Cambiar</button>
          <button type="button" onClick={() => elegir(null)} className="text-xs font-bold hover:underline" style={{ color: ROJO }}>Quitar</button>
        </div>
      ) : (
        <button type="button" id={id} onClick={() => input.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setEncima(true); }}
          onDragLeave={() => setEncima(false)}
          onDrop={(e) => { e.preventDefault(); setEncima(false); elegir(e.dataTransfer.files?.[0]); }}
          className="flex w-full flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed px-4 py-5 text-center transition"
          style={{ borderColor: encima ? ROJO : error ? '#fca5a5' : '#d1d5db', background: encima ? '#fef2f2' : '#fafafa' }}>
          <svg className="h-8 w-8" fill="none" stroke={encima ? ROJO : '#9ca3af'} viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6}
              d="M7 16a4 4 0 01-.88-7.9A5 5 0 1115.9 6h.1a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <span className="text-sm font-semibold text-gray-700">
            <span style={{ color: ROJO }}>Elegir archivo</span> o arrastrarlo aquí
          </span>
          <span className="text-xs text-gray-400">{ayuda}</span>
        </button>
      )}

      <input ref={input} type="file" accept={accept} className="sr-only" tabIndex={-1} aria-hidden="true"
        onChange={(e) => elegir(e.target.files?.[0])} />
      {error && <p className="mt-1 text-xs font-semibold text-red-700">{error}</p>}
    </div>
  );
}
