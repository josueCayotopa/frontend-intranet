import api from './axios';

export const getDashboard        = ()                   => api.get('/erp/dashboard');
export const getTrabajador       = ()                   => api.get('/erp/trabajador');
export const getPeriodos         = (limite = 18)        => api.get('/erp/periodos',  { params: { limite } });
export const getBoleta           = (periodo)            => api.get('/erp/boleta',    { params: { periodo } });
export const getVacaciones       = ()                   => api.get('/erp/vacaciones');
export const crearSolicitudVac   = (data)               => api.post('/erp/vacaciones', data);
export const aprobarVac          = (codCorrVac, data)   => api.patch(`/erp/vacaciones/${codCorrVac}/aprobar`, data);
export const cancelarVac         = (codCorrVac)         => api.patch(`/erp/vacaciones/${codCorrVac}/cancelar`);
export const getHorarios         = (mes)                => api.get('/erp/horarios',  { params: { mes } });
