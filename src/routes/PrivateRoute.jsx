import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function PrivateRoute({ children }) {
  const { isAuthenticated } = useAuth();
  // localStorage is always in sync (set synchronously before React state update)
  const hasStoredToken = !!localStorage.getItem('token');

  return isAuthenticated || hasStoredToken ? children : <Navigate to="/login" replace />;
}
