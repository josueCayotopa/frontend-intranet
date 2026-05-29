import { createContext, useState, useCallback, useEffect } from 'react';
import { loginRequest } from '../api/auth';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
  });
  const [empresa, setEmpresa] = useState(() => localStorage.getItem('empresa'));
  const [dbConnection, setDbConnection] = useState(() => localStorage.getItem('db_connection'));

  const clearSession = useCallback(() => {
    ['token', 'empresa', 'db_connection', 'user'].forEach((k) => localStorage.removeItem(k));
    setToken(null);
    setUser(null);
    setEmpresa(null);
    setDbConnection(null);
  }, []);

  // Escucha el evento del interceptor de axios cuando hay un 401
  useEffect(() => {
    window.addEventListener('auth:expired', clearSession);
    return () => window.removeEventListener('auth:expired', clearSession);
  }, [clearSession]);

  const login = useCallback(async (empresaVal, usuario, password) => {
    const { data } = await loginRequest(empresaVal, usuario, password);

    localStorage.setItem('token', data.token);
    localStorage.setItem('empresa', data.empresa);
    localStorage.setItem('db_connection', data.db_connection);
    localStorage.setItem('user', JSON.stringify(data.user));

    setToken(data.token);
    setEmpresa(data.empresa);
    setDbConnection(data.db_connection);
    setUser(data.user);

    return data;
  }, []);

  const logout = useCallback(() => {
    clearSession();
  }, [clearSession]);

  return (
    <AuthContext.Provider
      value={{ token, user, empresa, dbConnection, login, logout, isAuthenticated: !!token }}
    >
      {children}
    </AuthContext.Provider>
  );
}
