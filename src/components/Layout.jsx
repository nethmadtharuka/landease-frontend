import { useEffect, useRef, useState } from 'react';
import { Outlet, NavLink, Link, useLocation } from 'react-router-dom';
import {
  Home, Siren, Search, ClipboardList, Users, Sparkles, Languages, Gauge, Camera, IdCard,
  Store, Star, Flag, MessageSquareText, Menu, X, LogOut, UserRound, ShieldCheck, LifeBuoy, Bell,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { bookingsApi, sosApi, kycApi } from '../api/endpoints';
import { Logo, Avatar } from './ui';
import { firstName } from '../lib/format';
import { ROLE_LABEL } from '../lib/enums';


// Navigation groups per role (design: migrant app / service provider app / staff app sidebars).
function navFor(role, counts) {
  const ai = { label: 'AI tools', items: [
    { to: '/dashboard/ai-chat', icon: Sparkles, label: 'AI Assistant' },
    { to: '/dashboard/voice-translator', icon: Languages, label: 'Voice translator' },
    { to: '/dashboard/immigration', icon: Gauge, label: 'Profile strength' },
    { to: '/dashboard/place-recognition', icon: Camera, label: 'Place recognition' },
  ] };
  const EXPLORE = /^\/dashboard\/(services(?!\/(new|\d+\/edit))|providers)/;
  const MINE = /^\/dashboard\/(my-services|services\/(new|\d+\/edit))/;
  const account = { label: 'Account', items: [{ to: '/dashboard/kyc', icon: IdCard, label: 'Verification' }] };
  const overview = { items: [{ to: '/dashboard', icon: Home, label: 'Overview', end: true }] };
  const sosAlerts = { label: 'Safety', items: [{ to: '/dashboard/sos', icon: Siren, label: 'SOS alerts', urgent: true, badge: counts.sos, badgeRed: true }] };

  if (role === 'Migrant') return [
    overview,
    { label: 'Safety', items: [{ to: '/dashboard/sos', icon: Siren, label: 'SOS', urgent: true }] },
    { label: 'Services', items: [
      { to: '/dashboard/services', icon: Search, label: 'Explore services', match: EXPLORE },
      { to: '/dashboard/bookings', icon: ClipboardList, label: 'My bookings', badge: counts.bookings },
    ] },
    { label: 'Community', items: [{ to: '/dashboard/community', icon: Users, label: 'Communities' }] },
    ai, account,
  ];
  if (role === 'Helper') return [
    overview,
    { label: 'Provider', items: [
      { to: '/dashboard/bookings', icon: ClipboardList, label: 'Booking requests', badge: counts.requests },
      { to: '/dashboard/my-services', icon: Store, label: 'My services', match: MINE },
      { to: '/dashboard/reviews', icon: Star, label: 'Reviews' },
      { to: '/dashboard/services', icon: Search, label: 'Explore services', match: EXPLORE },
    ] },
    sosAlerts,
    { label: 'Community', items: [{ to: '/dashboard/community', icon: Users, label: 'Communities' }] },
    ai, account,
  ];
  // Staff: Agency and Admin. Admin is not an SOS responder (the API returns 403), so the safety group is Agency-only.
  return [
    overview,
    { label: 'Administration', items: [
      { to: '/dashboard/admin/kyc', icon: IdCard, label: 'KYC reviews', badge: counts.kyc },
      { to: '/dashboard/admin/fraud', icon: Flag, label: 'Fraud flags' },
      { to: '/dashboard/admin/moderation', icon: MessageSquareText, label: 'Moderation' },
      { to: '/dashboard/admin/listings', icon: Store, label: 'Listings' },
      ...(role === 'Admin' ? [{ to: '/dashboard/admin/users', icon: Users, label: 'Users & roles' }] : []),
    ] },
    ...(role === 'Agency' ? [sosAlerts] : []),
    { label: 'Platform', items: [
      { to: '/dashboard/services', icon: Search, label: 'Explore services', match: EXPLORE },
      { to: '/dashboard/community', icon: Users, label: 'Communities' },
    ] },
    { label: 'Tools', items: [
      { to: '/dashboard/voice-translator', icon: Languages, label: 'Voice translator' },
      { to: '/dashboard/immigration', icon: Gauge, label: 'Profile strength' },
    ] },
    account,
  ];
}

// Topbar title / breadcrumb from the path.
const TITLES = [
  [/^\/dashboard\/?$/, 'Overview'], [/^\/dashboard\/services\/new/, 'My services · List a service'],
  [/^\/dashboard\/services\/\d+\/edit/, 'My services · Edit service'], [/^\/dashboard\/services\/\d+/, 'Explore services · Service'],
  [/^\/dashboard\/services/, 'Explore services'], [/^\/dashboard\/providers/, 'Explore services · Provider'],
  [/^\/dashboard\/bookings\/(\d+)/, (m, role) => `${role === 'Helper' ? 'Booking requests' : 'My bookings'} · Booking #${m[1]}`],
  [/^\/dashboard\/bookings/, (_, role) => (role === 'Helper' ? 'Booking requests' : 'My bookings')],
  [/^\/dashboard\/my-services/, 'My services'], [/^\/dashboard\/reviews/, 'Reviews'],
  [/^\/dashboard\/kyc/, 'Verification'], [/^\/dashboard\/profile/, 'My profile'], [/^\/dashboard\/settings/, 'Account & security'],
  [/^\/dashboard\/notifications/, 'Notifications'], [/^\/dashboard\/community\/\d+/, 'Communities · Community'],
  [/^\/dashboard\/community/, 'Communities'], [/^\/dashboard\/sos\/history/, 'SOS · History'],
  [/^\/dashboard\/sos/, (_, role) => (role === 'Migrant' ? 'SOS' : 'SOS alerts')],
  [/^\/dashboard\/ai-chat/, 'AI tools · AI Assistant'], [/^\/dashboard\/voice-translator/, 'AI tools · Voice translator'],
  [/^\/dashboard\/immigration/, 'AI tools · Profile strength'], [/^\/dashboard\/place-recognition/, 'AI tools · Place recognition'],
  [/^\/dashboard\/admin\/kyc/, 'Administration · KYC reviews'], [/^\/dashboard\/admin\/fraud/, 'Administration · Fraud flags'],
  [/^\/dashboard\/admin\/moderation/, 'Administration · Moderation'], [/^\/dashboard\/admin\/listings/, 'Administration · Listings'],
  [/^\/dashboard\/admin\/users/, 'Administration · Users & roles'],
];
function titleFor(path, role) {
  for (const [re, t] of TITLES) { const m = path.match(re); if (m) return typeof t === 'function' ? t(m, role) : t; }
  return 'LandEase';
}

/** Badge counts shown in the sidebar, from existing endpoints (failures just hide the badge). */
function useNavCounts(role, pathname) {
  const [counts, setCounts] = useState({});
  useEffect(() => {
    if (!role) return undefined;
    let alive = true;
    const set = (k) => (n) => alive && setCounts(c => ({ ...c, [k]: n }));
    const len = (r) => (r.data.data || []).length;
    if (role === 'Migrant') bookingsApi.getMine().then(r => set('bookings')((r.data.data || []).filter(b => ['Accepted', 'InProgress'].includes(b.status)).length)).catch(() => {});
    if (role === 'Helper') bookingsApi.getIncoming().then(r => set('requests')((r.data.data || []).filter(b => b.status === 'Requested').length)).catch(() => {});
    if (role === 'Helper' || role === 'Agency') sosApi.getActive().then(r => set('sos')(len(r))).catch(() => {});
    if (role === 'Agency' || role === 'Admin') kycApi.getPending().then(r => set('kyc')(len(r))).catch(() => {});
    return () => { alive = false; };
  }, [role, pathname]);
  return counts;
}

function NavItem({ item, compact, onNavigate }) {
  const { to, icon: Icon, label, urgent, badge, badgeRed, end, match } = item;
  const { pathname } = useLocation();
  return (
    <NavLink to={to} end={end} onClick={onNavigate} title={compact ? label : undefined} aria-label={compact ? label : undefined}
      aria-current={match ? (match.test(pathname) ? 'page' : undefined) : undefined}
      className={({ isActive: navActive }) => { const isActive = match ? match.test(pathname) : navActive; return `relative flex items-center gap-3 rounded-[10px] text-[15px] transition-colors duration-200
        ${compact ? 'w-11 h-11 justify-center' : 'h-9 px-3'}
        ${isActive ? 'bg-electric-50 text-electric' : urgent ? 'text-sos hover:bg-[#FDECEC]' : 'text-ink hover:bg-canvas'}`; }}>
      <Icon size={18} strokeWidth={1.75} aria-hidden="true" />
      {!compact && <span className="flex-1 truncate">{label}</span>}
      {badge > 0 && (
        <span className={`${compact ? 'absolute -top-1 -right-1' : ''} min-w-[22px] h-[18px] px-1.5 rounded-full text-[11.5px] font-semibold text-white inline-flex items-center justify-center ${badgeRed ? 'bg-sos' : 'bg-ink-pill'}`}>{badge}</span>
      )}
    </NavLink>
  );
}

function Sidebar({ groups, user, onLogout, onNavigate }) {
  return (
    <div className="flex flex-col h-full">
      <div className="px-6 pt-5 pb-4"><Logo to="/dashboard" /></div>
      <nav aria-label="App" className="flex-1 overflow-y-auto px-3.5 pb-4">
        {groups.map((g, i) => (
          <div key={i} className={i ? 'mt-5' : ''}>
            {g.label && <p className="overline px-3 mb-1.5">{g.label}</p>}
            <div className="space-y-0.5">{g.items.map(it => <NavItem key={it.to} item={it} onNavigate={onNavigate} />)}</div>
          </div>
        ))}
      </nav>
      <div className="mx-3.5 border-t border-line py-3 flex items-center gap-3 px-1">
        <Avatar name={user?.fullName} size={34} />
        <div className="min-w-0 flex-1 leading-tight">
          <p className="text-[15px] font-semibold truncate">{user?.fullName}</p>
          <p className="text-[13px] text-muted">{ROLE_LABEL[user?.role]}</p>
        </div>
        <button type="button" onClick={onLogout} aria-label="Sign out" title="Sign out"
          className="w-[34px] h-[34px] rounded-[10px] border border-line inline-flex items-center justify-center hover:bg-canvas">
          <LogOut size={16} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

function AvatarMenu({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => { if (e.type === 'keydown' ? e.key === 'Escape' : !ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close); document.addEventListener('keydown', close);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', close); };
  }, [open]);
  const item = 'flex items-center gap-2.5 h-10 px-3 rounded-[10px] text-[15px] hover:bg-canvas w-full text-left';
  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen(o => !o)} aria-haspopup="menu" aria-expanded={open}
        className="flex items-center gap-2 rounded-full pr-1 hover:opacity-90">
        <Avatar name={user?.fullName} size={36} />
        <span className="hidden sm:inline text-[15px] font-semibold">{firstName(user?.fullName)}</span>
      </button>
      {open && (
        <div role="menu" className="absolute right-0 mt-2 w-60 card shadow-float p-1.5 z-40">
          <div className="px-3 py-2 border-b border-line mb-1">
            <p className="font-semibold truncate">{user?.fullName}</p>
            <p className="text-[13px] text-muted truncate">{user?.email}</p>
          </div>
          <Link role="menuitem" to="/dashboard/profile" onClick={() => setOpen(false)} className={item}><UserRound size={16} />My profile</Link>
          <Link role="menuitem" to="/dashboard/notifications" onClick={() => setOpen(false)} className={item}><Bell size={16} />Inbox</Link>
          <Link role="menuitem" to="/dashboard/settings" onClick={() => setOpen(false)} className={item}><ShieldCheck size={16} />Account &amp; security</Link>
          <Link role="menuitem" to="/help" onClick={() => setOpen(false)} className={item}><LifeBuoy size={16} />Help centre</Link>
          <button role="menuitem" type="button" onClick={onLogout} className={`${item} text-sos`}><LogOut size={16} />Sign out</button>
        </div>
      )}
    </div>
  );
}

const TABS = [
  { to: '/dashboard', icon: Home, label: 'Home', end: true },
  { to: '/dashboard/services', icon: Search, label: 'Services' },
  { to: '/dashboard/sos', sos: true, label: 'SOS' },
  { to: '/dashboard/ai-chat', icon: Sparkles, label: 'Assistant' },
  { to: '/dashboard/bookings', icon: ClipboardList, label: 'Bookings' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  // The drawer belongs to the page it was opened on, so navigating closes it.
  const [menuAt, setMenuAt] = useState(null);
  const menuOpen = menuAt === pathname;
  const setMenuOpen = (open) => setMenuAt(open ? pathname : null);
  const counts = useNavCounts(user?.role, pathname);
  const groups = navFor(user?.role, counts);
  const isMigrant = user?.role === 'Migrant';
  // Tool pages (chat) manage their own full-height layout.
  const fullBleed = /^\/dashboard\/ai-chat/.test(pathname);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setMenuAt(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  // A full navigation (not navigate()): clearing the user first made PrivateRoute redirect to /login?next=,
  // and a reload also drops in-memory caches (e.g. recommendations) so the next user on this tab starts clean.
  const handleLogout = () => { logout(); window.location.replace('/'); };
  const flat = groups.flatMap(g => g.items);

  return (
    <div className="min-h-screen bg-canvas">
      <a href="#app-main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 btn-ink">Skip to content</a>

      {/* Desktop sidebar ≥1024 */}
      <aside className="hidden lg:block fixed inset-y-0 left-0 w-[264px] bg-white border-r border-line z-20">
        <Sidebar groups={groups} user={user} onLogout={handleLogout} />
      </aside>

      {/* Tablet icon rail 640–1023 */}
      <aside className="hidden sm:flex lg:hidden fixed inset-y-0 left-0 w-[72px] bg-white border-r border-line z-20 flex-col items-center py-4 gap-1.5 overflow-y-auto">
        <Link to="/dashboard" aria-label="LandEase home" className="mb-3 w-10 h-10 rounded-[11px] bg-ink inline-flex items-center justify-center">
          <svg viewBox="0 0 32 32" className="w-5 h-5" aria-hidden="true"><path d="M9 20.5 13.5 12l3 5.5 2-3 4.5 6" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </Link>
        {flat.map(it => <NavItem key={it.to} item={it} compact />)}
      </aside>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="lg:hidden fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Navigation menu">
          <button type="button" aria-label="Close menu" className="absolute inset-0 bg-navy/40" onClick={() => setMenuOpen(false)} />
          <aside className="relative w-[288px] max-w-[85vw] h-full bg-white shadow-float">
            <button type="button" aria-label="Close menu" onClick={() => setMenuOpen(false)}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-canvas inline-flex items-center justify-center"><X size={18} /></button>
            <Sidebar groups={groups} user={user} onLogout={handleLogout} onNavigate={() => setMenuOpen(false)} />
          </aside>
        </div>
      )}

      <div className="sm:pl-[72px] lg:pl-[264px] min-w-0">
        <header className="sticky top-0 z-10 bg-canvas/90 backdrop-blur h-16 px-4 sm:px-8 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button type="button" aria-label="Open menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}
              className="sm:hidden w-11 h-11 rounded-[12px] bg-white border border-line inline-flex items-center justify-center"><Menu size={18} /></button>
            <span className="sm:hidden"><Logo to="/dashboard" /></span>
            <p className="hidden sm:block text-[15px] font-medium truncate">{titleFor(pathname, user?.role)}</p>
          </div>
          <div className="flex items-center gap-3">
            {isMigrant && (
              <Link to="/dashboard/sos" aria-label="Open SOS emergency page" className="btn-danger h-10 px-4 text-[15px]">
                <Siren size={16} aria-hidden="true" className="hidden sm:inline" />SOS
              </Link>
            )}
            <AvatarMenu user={user} onLogout={handleLogout} />
          </div>
        </header>

        <main id="app-main" className={fullBleed ? '' : `px-4 sm:px-8 pt-2 ${isMigrant ? 'pb-28 sm:pb-12' : 'pb-12'}`}>
          <div key={pathname} className={fullBleed ? '' : 'max-w-[1120px] animate-fade-up'}>
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile bottom tab bar (Migrant) */}
      {isMigrant && (
        <nav aria-label="Quick" className="sm:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-line h-[72px] grid grid-cols-5"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
          {TABS.map(t => t.sos ? (
            <Link key={t.to} to={t.to} aria-label="SOS emergency" className="flex justify-center">
              <span className="-mt-6 w-[60px] h-[60px] rounded-full bg-sos text-white font-bold text-sm inline-flex items-center justify-center shadow-float">SOS</span>
            </Link>
          ) : (
            <NavLink key={t.to} to={t.to} end={t.end}
              className={({ isActive }) => `flex flex-col items-center justify-center gap-1 text-[12px] font-medium ${isActive ? 'text-electric' : 'text-muted'}`}>
              <t.icon size={20} strokeWidth={1.75} aria-hidden="true" />{t.label}
            </NavLink>
          ))}
        </nav>
      )}
    </div>
  );
}
