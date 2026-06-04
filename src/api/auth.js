import api from './axios';

export const loginRequest  = (usuario, password) => api.post('/auth/login', { usuario, password });
export const logoutRequest = ()                  => api.post('/auth/logout');
export const meRequest     = ()                  => api.get('/auth/me');
