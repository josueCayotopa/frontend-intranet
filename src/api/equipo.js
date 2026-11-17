import api from './axios';

// Evaluar a mi personal — el jefe califica su sección de la evaluación para renovación
export const getEsJefe        = ()                                  => api.get('/equipo/resumen');
export const getEquipo        = ()                                  => api.get('/equipo/evaluaciones');
export const getEvaluacion    = (empresa, codPersonal, periodo)     =>
  api.get(`/equipo/evaluaciones/${empresa}/${codPersonal}`, { params: periodo ? { periodo } : {} });
// Aprobar evaluaciones — el aprobador asignado decide
export const getAprobaciones   = ()                                  => api.get('/equipo/aprobaciones');
export const getAprobacion     = (empresa, codPersonal, periodo)     => api.get(`/equipo/aprobaciones/${empresa}/${codPersonal}/${periodo}`);
export const resolverAprobacion = (empresa, aprobacionId, data)      => api.post(`/equipo/aprobaciones/${empresa}/${aprobacionId}`, data);

// Aprobar vacaciones — solicitudes de goce / compra del personal a cargo
export const getVacacionesEquipo = (pendientes = false)          => api.get('/equipo/vacaciones', { params: pendientes ? { pendientes: 1 } : {} });
export const resolverVacacionEquipo = (s, accion, obs)           =>
  api.post(`/equipo/vacaciones/${s.empresa}/${s.cod_personal}/${s.cod_corr_sol}/${accion}`, { obs });

export const guardarEvaluacion =(empresa, codPersonal, periodo, data) =>
  api.put(`/equipo/evaluaciones/${empresa}/${codPersonal}/${periodo}`, data);
