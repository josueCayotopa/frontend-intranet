import api from './axios';

export const loginRequest              = (usuario, password) => api.post('/auth/login', { usuario, password });
export const logoutRequest             = ()                   => api.post('/auth/logout');
export const meRequest                 = ()                   => api.get('/auth/me');
export const pingRequest               = ()                   => api.post('/auth/ping');
export const cambiarPasswordRequest    = (data)               => api.post('/auth/cambiar-password', data);
export const recuperarPasswordRequest  = (usuario)            => api.post('/auth/recuperar-password', { usuario });
export const subirFotoRequest          = (formData)           => api.post('/auth/foto', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const getSesionesRequest        = (soloActivas = false) => api.get('/auth/sesiones', { params: { solo_activas: soloActivas ? 1 : 0 } });
export const cerrarSesionRequest       = (id)                 => api.delete(`/auth/sesiones/${id}`);
