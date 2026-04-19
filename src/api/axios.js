import axios from 'axios';

const normalizeBaseUrl = (value) => {
  const v = (value ?? '').trim();
  if (!v) return '/api';
  return v.endsWith('/') ? v.slice(0, -1) : v;
};

const api = axios.create({
  baseURL: normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL),
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;