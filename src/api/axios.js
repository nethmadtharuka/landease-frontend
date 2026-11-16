import axios from 'axios';
import { normalizeBaseUrl } from './baseUrl';

export const TOKEN_KEY = 'token';

const api = axios.create({
  baseURL: normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL),
  headers: { 'Content-Type': 'application/json' },
  timeout: 120_000, // AI endpoints can take a while; everything else is fast
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// An expired/invalid session (401 on an authenticated call) signs the user out.
// Login/register 401s are ordinary "wrong password" errors and must reach the form.
export const isAuthAttempt = (url = '') => /\/api\/auth\/(login|register)$/i.test(url);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !isAuthAttempt(error.config?.url)) {
      localStorage.removeItem(TOKEN_KEY);
      if (window.location.pathname !== '/login') window.location.assign('/login');
    }
    return Promise.reject(error);
  }
);

export default api;
