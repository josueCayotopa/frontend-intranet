import axios from 'axios';

// Instancia apuntando al nuevo backend Laravel v1 (Sanctum + SPs @db_name)
const apiV1 = axios.create({
  baseURL: import.meta.env.VITE_API_V1_URL ?? 'http://127.0.0.1:8000/api/v1',
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
});

apiV1.interceptors.request.use((config) => {
  const token = localStorage.getItem('token_v1') ?? localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiV1.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      window.dispatchEvent(new Event('auth:expired'));
    }
    return Promise.reject(err);
  }
);

export default apiV1;
