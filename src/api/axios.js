import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000/api',
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  const dbConn = localStorage.getItem('db_connection');

  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (dbConn) config.headers['X-DB-Connection'] = dbConn;

  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      ['token', 'db_connection', 'empresa', 'user'].forEach((k) =>
        localStorage.removeItem(k)
      );
      // Dispatch event so AuthContext can react without a hard page reload
      window.dispatchEvent(new Event('auth:expired'));
    }
    return Promise.reject(err);
  }
);

export default api;
