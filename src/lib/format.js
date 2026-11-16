export const initials = (name = '') =>
  name.trim().split(/\s+/).slice(0, 2).map(p => p[0]?.toUpperCase() ?? '').join('') || '?';

export const firstName = (name = '') => name.trim().split(/\s+/)[0] || '';

export const money = (n) => Number(n ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 });

export function shortDate(value) {
  if (!value) return '';
  return new Date(value).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

export function dateTime(value) {
  if (!value) return '';
  return new Date(value).toLocaleString(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function timeAgo(value) {
  if (!value) return '';
  const s = Math.round((Date.now() - new Date(value).getTime()) / 1000);
  if (s < 60) return 'just now';
  const m = Math.round(s / 60); if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60); if (h < 24) return `${h} h ago`;
  const d = Math.round(h / 24); if (d < 30) return `${d} day${d > 1 ? 's' : ''} ago`;
  return shortDate(value);
}

// Deterministic soft tint for initials avatars.
const TINTS = ['#EBEEFF', '#EEF6FE', '#E7F6EF', '#FFF4E0', '#F4ECFF', '#FDECEC'];
export const tintFor = (name = '') => TINTS[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % TINTS.length];

export const humanize = (v = '') => String(v).replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, c => c.toUpperCase());

// Only allow in-app return paths (prevents open redirects through ?next=).
export const safeNext = (next) => (next && /^\/dashboard(\/|$|\?)/.test(next) ? next : '/dashboard');
