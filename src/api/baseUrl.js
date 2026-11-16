// Every endpoint path already starts with "/api/...", so the base URL is the API ORIGIN only.
// Empty (local dev) => same origin, and Vite proxies /api to the backend.
// A trailing "/api" is stripped so older configs (".../api") cannot produce "/api/api/..." again.
export function normalizeBaseUrl(value) {
  let v = (value ?? '').trim().replace(/\/+$/, '');
  if (v.toLowerCase().endsWith('/api')) v = v.slice(0, -4);
  return v;
}
