import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import PrivateRoute from './PrivateRoute';
import AdminRoute from './AdminRoute';
import Login from '../pages/auth/Login';
import CambiarPassword from '../pages/auth/CambiarPassword';
import Dashboard from '../pages/dashboard/Dashboard';
import MiPerfil from '../pages/perfil/MiPerfil';
import MisRemuneraciones from '../pages/remuneraciones/MisRemuneraciones';
import MisVacaciones from '../pages/vacaciones/MisVacaciones';
import MiEquipoEvaluaciones from '../pages/equipo/MiEquipoEvaluaciones';
import AprobarVacaciones from '../pages/equipo/AprobarVacaciones';
import AprobarEvaluaciones from '../pages/equipo/AprobarEvaluaciones';
import AprobarEvaluacion from '../pages/equipo/AprobarEvaluacion';
import EvaluarTrabajador from '../pages/equipo/EvaluarTrabajador';
import GestionUsuarios from '../pages/admin/GestionUsuarios';
import GestionEmpresas from '../pages/admin/GestionEmpresas';
import Layout from '../components/layout/Layout';

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Ruta de cambio de contraseña: requiere login pero sin Layout */}
        <Route
          path="/cambiar-password"
          element={
            <PrivateRoute>
              <CambiarPassword />
            </PrivateRoute>
          }
        />

        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="perfil" element={<MiPerfil />} />
          <Route path="remuneraciones" element={<MisRemuneraciones />} />
          <Route path="vacaciones" element={<MisVacaciones />} />
          <Route path="equipo/vacaciones" element={<AprobarVacaciones />} />
          <Route path="equipo/aprobaciones" element={<AprobarEvaluaciones />} />
          <Route path="equipo/aprobaciones/:empresa/:codPersonal/:periodo" element={<AprobarEvaluacion />} />
          <Route path="equipo/evaluaciones" element={<MiEquipoEvaluaciones />} />
          <Route path="equipo/evaluaciones/:empresa/:codPersonal" element={<EvaluarTrabajador />} />
          <Route
            path="admin/usuarios"
            element={
              <AdminRoute>
                <GestionUsuarios />
              </AdminRoute>
            }
          />
          <Route
            path="admin/empresas"
            element={
              <AdminRoute>
                <GestionEmpresas />
              </AdminRoute>
            }
          />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
