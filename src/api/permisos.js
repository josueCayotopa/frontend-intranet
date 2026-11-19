import api from './axios';

// Mis permisos — formato de autorización de permisos (el trabajador)
export const getMotivosPermiso   = ()          => api.get('/permisos/motivos');
export const getMisPermisos      = ()          => api.get('/permisos');
export const getPermiso          = (id)        => api.get(`/permisos/${id}`);
/** formData: id_motivo, fecha_inicio, fecha_fin, hora_inicio?, hora_fin?, des_otro?, provincia?, justificacion?, documentos[i][archivo|id_tipo|des_otro] */
export const crearPermiso        = (formData)  => api.post('/permisos', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const adjuntarDocPermiso  = (id, formData) => api.post(`/permisos/${id}/documentos`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const quitarDocPermiso    = (doc)       => api.delete(`/permisos/documentos/${doc}`);
export const cancelarPermiso     = (id)        => api.post(`/permisos/${id}/cancelar`);
const docPropio                  = (doc)       => api.get(`/permisos/documentos/${doc}`, { responseType: 'blob' });

// Autorizar permisos — el jefe ("Administrador de Sede")
export const getPermisosEquipo   = (pendientes = false) => api.get('/equipo/permisos', { params: pendientes ? { pendientes: 1 } : {} });
export const getPermisoEquipo    = (empresa, id)        => api.get(`/equipo/permisos/${empresa}/${id}`);
export const resolverPermisoEquipo = (empresa, id, accion, obs) => api.post(`/equipo/permisos/${empresa}/${id}/${accion}`, { obs });
const docEquipo                  = (empresa, id, doc)   => api.get(`/equipo/permisos/${empresa}/${id}/documentos/${doc}`, { responseType: 'blob' });

/**
 * Abre un documento de sustento (viene protegido con el token) en una pestaña nueva.
 * La pestaña se abre antes de descargar para que el navegador no la bloquee.
 */
export async function verDocumentoPermiso(doc, equipo = null) {
  const ventana = window.open('', '_blank');
  try {
    const { data } = equipo ? await docEquipo(equipo.empresa, equipo.id, doc) : await docPropio(doc);
    const url = URL.createObjectURL(data);
    if (ventana) ventana.location.href = url; else window.location.href = url;
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  } catch (e) {
    ventana?.close();
    let mensaje = 'No se pudo abrir el documento.';
    if (e.response?.data instanceof Blob) {
      try { mensaje = JSON.parse(await e.response.data.text()).message ?? mensaje; } catch { /* sin mensaje */ }
    }
    throw new Error(mensaje, { cause: e });
  }
}
