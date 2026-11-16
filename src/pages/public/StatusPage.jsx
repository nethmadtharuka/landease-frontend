import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Logo } from '../../components/ui';
import { ROLE_LABEL } from '../../lib/enums';

/** 404 (not found) and 403 (not allowed). `inApp` renders inside the app shell instead of full screen. */
export default function StatusPage({ code = 404, inApp = false }) {
  const { user } = useAuth();
  const embedded = inApp || code === 403;
  const content = (
    <div className="text-center">
      <p className="numeral text-[120px] md:text-[180px] text-[#CFD6E2]" aria-hidden="true">{code}</p>
      <h1 className="display text-[34px] md:text-[44px] -mt-2">{code === 403 ? 'This area isn’t for your account' : 'We couldn’t find that page'}</h1>
      <p className="text-muted text-[17px] mt-3">
        {code === 403 ? `You're signed in as ${ROLE_LABEL[user?.role]?.toLowerCase() ?? 'a user'}. This page is for another kind of account.` : 'The link may be broken or the page may have moved.'}
      </p>
      <div className="flex flex-wrap justify-center gap-3 mt-7">
        <Link to={user ? '/dashboard' : '/'} className="btn-ink">{user ? 'Go to overview' : 'Go to home'}</Link>
        <Link to={user ? '/dashboard/services' : '/services'} className="btn-ghost bg-white">Explore services</Link>
      </div>
    </div>
  );
  if (embedded) return <div className="py-16">{content}</div>;
  return (
    <div className="min-h-screen flex flex-col bg-[radial-gradient(ellipse_at_center,#FFFFFF_0%,#E8F2FE_40%,#EDF2F8_70%)]">
      <header className="px-8 py-6"><Logo /></header>
      <main className="flex-1 flex items-center justify-center px-4 pb-24">{content}</main>
    </div>
  );
}
