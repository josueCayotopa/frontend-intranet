import api from './axios';

export const getDashboard        = ()                   => api.get('/erp/dashboard');
export const getTrabajador       = ()                   => api.get('/erp/trabajador');
export const getPeriodos         = (limite = 18)        => api.get('/erp/periodos',  { params: { limite } });
export const getBoleta           = (periodo)            => api.get('/erp/boleta',    { params: { periodo } });

// Vacaciones procesadas por RRHH (PLA_VACACIONES_MES_CAB)
export const getVacaciones       = ()                   => api.get('/erp/vacaciones');
export const aprobarVac          = (codCorrVac, data)   => api.patch(`/erp/vacaciones/${codCorrVac}/aprobar`, data);
export const cancelarVac         = (codCorrVac)         => api.patch(`/erp/vacaciones/${codCorrVac}/cancelar`);

// Solicitudes intranet (PLA_SOL_VACACIONES)
export const getSolicitudesVac   = ()                   => api.get('/erp/solicitudes-vac');
export const crearSolicitudVac   = (data)               => api.post('/erp/solicitudes-vac', data);
export const cancelarSolVac      = (codCorrSol)         => api.patch(`/erp/solicitudes-vac/${codCorrSol}/cancelar`);

export const getHorarios         = (mes)                => api.get('/erp/horarios',  { params: { mes } });
