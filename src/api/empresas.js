import apiV1 from './axios';

export const getEmpresasAdmin     = (params)    => apiV1.get('/empresas', { params });
export const crearEmpresa         = (data)      => apiV1.post('/empresas', data);
export const editarEmpresa        = (id, data)  => apiV1.put(`/empresas/${id}`, data);
export const toggleActivoEmpresa  = (id)        => apiV1.patch(`/empresas/${id}/toggle-activo`);
export const probarConexionEmpresa = (id)       => apiV1.get(`/empresas/${id}/probar-conexion`);
export const subirLogoEmpresa     = (id, formData) => apiV1.post(`/empresas/${id}/logo`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
