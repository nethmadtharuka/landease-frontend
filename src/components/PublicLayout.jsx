import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Logo, ArrowLink } from './ui';

const NAV = [
  { to: '/services', label: 'Explore services' },
  { to: '/community', label: 'Communities' },
  { to: '/tools', label: 'Tools' },
  { to: '/how-it-works', label: 'How it works' },
  { to: '/help', label: 'Help' },
];

/** Header. `overlay` = transparent glass version used on top of the Home hero photo. */
export function PublicHeader({ overlay = false }) {
  const { user } = useAuth();
  const { pathname } = useLocation();
  // The menu belongs to the page it was opened on, so navigating closes it.
  const [openAt, setOpenAt] = useState(null);
  const open = openAt === pathname;
  const setOpen = (v) => setOpenAt(v ? pathname : null);
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setOpenAt(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const link = ({ isActive }) => overlay
    ? 'h-9 px-3.5 rounded-full inline-flex items-center text-[15px] font-medium text-white bg-white/20 hover:bg-white/30 backdrop-blur'
    : `h-9 px-3.5 rounded-full inline-flex items-center text-[15px] font-medium text-ink hover:bg-canvas ${isActive ? 'bg-[#EEF1F5]' : ''}`;

  return (
    <header className={overlay ? 'absolute inset-x-0 top-0 z-30' : 'sticky top-0 z-30 pt-4 px-4'}>
      <div className={overlay
        ? 'container-x h-[78px] flex items-center justify-between gap-4'
        : 'max-w-[1136px] mx-auto h-14 bg-white rounded-[18px] shadow-xs border border-line/60 pl-4 pr-2 flex items-center justify-between gap-4'}>
        <Logo light={overlay} />
        <nav aria-label="Main" className="hidden lg:flex items-center gap-1.5">
          {NAV.map(n => <NavLink key={n.to} to={n.to} className={link}>{n.label}</NavLink>)}
        </nav>
        <div className="hidden lg:flex items-center gap-2">
          {user ? (
            overlay ? <ArrowLink to="/dashboard">Go to dashboard</ArrowLink> : <Link to="/dashboard" className="btn-ink">Go to dashboard</Link>
          ) : overlay ? (
            <>
              <Link to="/login" className="btn-ghost-light">Sign in</Link>
              <ArrowLink to="/register">Get started</ArrowLink>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-ghost">Sign in</Link>
              <Link to="/register" className="btn-ink">Get started</Link>
            </>
          )}
        </div>
        <button type="button" onClick={() => setOpen(true)} aria-label="Open menu" aria-expanded={open}
          className={`lg:hidden w-11 h-11 rounded-full inline-flex items-center justify-center ${overlay ? 'bg-white/20 text-white backdrop-blur' : 'bg-canvas text-ink'}`}>
          <Menu size={20} aria-hidden="true" />
        </button>
      </div>

      {open && (
        <div className="lg:hidden fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Menu">
          <button type="button" aria-label="Close menu" className="absolute inset-0 bg-navy/40" onClick={() => setOpen(false)} />
          <div className="absolute inset-x-3 top-3 bg-white rounded-card shadow-float p-4">
            <div className="flex items-center justify-between mb-2">
              <Logo />
              <button type="button" onClick={() => setOpen(false)} aria-label="Close menu" className="w-11 h-11 rounded-full bg-canvas inline-flex items-center justify-center"><X size={20} /></button>
            </div>
            <nav aria-label="Main" className="flex flex-col py-2">
              {NAV.map(n => <NavLink key={n.to} to={n.to} className="h-12 px-3 rounded-[12px] flex items-center text-[16px] font-medium hover:bg-canvas">{n.label}</NavLink>)}
            </nav>
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-line">
              {user ? <Link to="/dashboard" className="btn-ink col-span-2">Go to dashboard</Link> : (
                <><Link to="/login" className="btn-ghost">Sign in</Link><Link to="/register" className="btn-ink">Get started</Link></>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

const FOOTER_COLS = [
  ['Product', [['/services', 'Explore services'], ['/community', 'Communities'], ['/tools', 'AI tools'], ['/tools#sos', 'SOS safety']]],
  ['Company', [['/about', 'About'], ['/how-it-works', 'How it works'], ['/contact', 'Contact']]],
  ['Support', [['/help', 'Help centre'], ['/help#faq', 'FAQ']]],
  ['Legal', [['/privacy', 'Privacy'], ['/terms', 'Terms']]],
];

/** Footer. `full` = the multi-column version used on Home; other pages use the compact one. */
export function PublicFooter({ full = false }) {
  const disclaimer = 'LandEase provides general information, not legal advice. In an emergency call your local emergency number.';
  if (!full) {
    return (
      <footer className="bg-navy text-white">
        <div className="container-x py-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <Logo light />
          <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-2 text-[15px]">
            {[['/services', 'Explore services'], ['/community', 'Communities'], ['/about', 'About'], ['/help', 'Help'], ['/contact', 'Contact'], ['/privacy', 'Privacy & Terms']]
              .map(([to, l]) => <Link key={to} to={to} className="hover:underline">{l}</Link>)}
          </nav>
        </div>
        <div className="border-t border-white/10"><p className="container-x py-6 text-sm text-white/80">{disclaimer}</p></div>
      </footer>
    );
  }
  return (
    <footer className="bg-navy text-white">
      <div className="container-x pt-16 pb-10 grid gap-10 md:grid-cols-5">
        <div>
          <Logo light />
          <p className="text-white/70 text-[14.5px] mt-4 leading-relaxed">Verified settlement services, corridor communities and safety tools for people moving to a new country.</p>
        </div>
        {FOOTER_COLS.map(([title, links]) => (
          <div key={title}>
            <p className="font-semibold text-[15px] mb-3">{title}</p>
            <ul className="space-y-2 text-[15px] text-white/90">
              {links.map(([to, l]) => <li key={l}><Link to={to} className="hover:underline">{l}</Link></li>)}
            </ul>
          </div>
        ))}
      </div>
      <div className="container-x"><div className="border-t border-white/10 py-6 flex flex-col sm:flex-row justify-between gap-3 text-sm text-white/80">
        <p>{disclaimer}</p><p>© {new Date().getFullYear()} LandEase</p>
      </div></div>
    </footer>
  );
}

/** Standard public page shell (floating header + compact footer). Home renders its own header/footer. */
export default function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-canvas">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 btn-ink">Skip to content</a>
      <PublicHeader />
      <main id="main" className="flex-1 pb-24">
        <Outlet />
      </main>
      <PublicFooter />
    </div>
  );
}
