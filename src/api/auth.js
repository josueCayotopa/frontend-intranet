import api from './axios';

export const loginRequest = (empresa, nom_usuario, password) =>
  api.post('/login', { empresa, nom_usuario, password });

export const perfilRequest = () => api.get('/perfil');
