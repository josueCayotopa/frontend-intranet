import { createContext, useState, useCallback, useEffect } from 'react';
import { loginRequest } from '../api/auth';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token,   setToken]   = useState(() => localStorage.getItem('token'));
  const [user,    setUser]    = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
  });
  const [empresa, setEmpresa] = useState(() => {
    try { return JSON.parse(localStorage.getItem('empresa')); } catch { return null; }
  });

  const clearSession = useCallback(() => {
    ['token', 'user', 'empresa'].forEach((k) => localStorage.removeItem(k));
    setToken(null);
    setUser(null);
    setEmpresa(null);
  }, []);

  useEffect(() => {
    window.addEventListener('auth:expired', clearSession);
    return () => window.removeEventListener('auth:expired', clearSession);
  }, [clearSession]);

  const login = useCallback(async (usuario, password) => {
    const { data } = await loginRequest(usuario, password);
    // data = { success, message, data: { token, usuario, empresa } }
    const payload = data.data;

    localStorage.setItem('token',   payload.token);
    localStorage.setItem('user',    JSON.stringify(payload.usuario));
    localStorage.setItem('empresa', JSON.stringify(payload.empresa));

    setToken(payload.token);
    setUser(payload.usuario);
    setEmpresa(payload.empresa);

    return payload;
  }, []);

  const logout = useCallback(() => clearSession(), [clearSession]);

  return (
    <AuthContext.Provider
      value={{ token, user, empresa, login, logout, isAuthenticated: !!token }}
    >
      {children}
    </AuthContext.Provider>
  );
}
