import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import PrivateRoute from './PrivateRoute';
import Login from '../pages/auth/Login';
import Dashboard from '../pages/dashboard/Dashboard';
import MiPerfil from '../pages/perfil/MiPerfil';
import MisRemuneraciones from '../pages/remuneraciones/MisRemuneraciones';
import MisVacaciones from '../pages/vacaciones/MisVacaciones';
import Layout from '../components/layout/Layout';

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
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
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
