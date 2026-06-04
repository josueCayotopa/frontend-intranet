import apiV1 from './axios';

export const getEmpresas    = ()          => apiV1.get('/empresas?activas=true');
export const getUsuarios    = (params)    => apiV1.get('/usuarios', { params });
export const crearUsuario   = (data)      => apiV1.post('/usuarios', data);
export const editarUsuario  = (id, data)  => apiV1.put(`/usuarios/${id}`, data);
export const toggleActivo   = (id)        => apiV1.patch(`/usuarios/${id}/toggle-activo`);
export const cambiarPassword= (id, data)  => apiV1.patch(`/usuarios/${id}/cambiar-password`, data);
