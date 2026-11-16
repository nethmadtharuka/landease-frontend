import { Link } from 'react-router-dom';
import { Logo, BackendBadge } from '../../components/ui';

// Password reset and email verification need backend task S2-10 (no endpoints exist yet).
// The screens are shown as designed, with submission disabled and the reason stated.
const MODES = {
  forgot: { title: 'Forgot your password?', sub: "Enter your email and we'll send a reset link.", fields: [['Email', 'email']], cta: 'Send reset link' },
  reset: { title: 'Set a new password', sub: 'Choose a password with at least 8 characters, an uppercase letter, a number and a symbol.', fields: [['New password', 'password'], ['Confirm new password', 'password']], cta: 'Update password' },
  verify: { title: 'Verify your email', sub: 'Open the link in the email we sent to confirm your address.', fields: [], cta: null },
};

export default function AccountRecoveryPage({ mode }) {
  const m = MODES[mode];
  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_center,#FFFFFF_0%,#E8F2FE_40%,#EDF2F8_70%)]">
      <header className="max-w-[1100px] mx-auto px-5 py-5 flex flex-wrap items-center justify-between gap-3">
        <Logo />
        <BackendBadge id="S2-10 — designed now, shipped later" />
      </header>
      <main className="px-4 pt-10 pb-20">
        <div className="max-w-[440px] mx-auto card shadow-float p-8">
          <h1 className="display text-[30px]">{m.title}</h1>
          <p className="text-muted mt-2">{m.sub}</p>
          <form onSubmit={e => e.preventDefault()} className="mt-6 space-y-4">
            {m.fields.map(([label, type], i) => (
              <div key={label}><label htmlFor={`rec-${i}`} className="label">{label}</label><input id={`rec-${i}`} type={type} className="input" disabled /></div>
            ))}
            {m.cta && <button type="submit" disabled className="btn-ink w-full h-12">{m.cta}</button>}
          </form>
          <p className="warn mt-5">This isn&apos;t available yet. If you&apos;re locked out, wait 15 minutes and sign in again, or contact support.</p>
          <p className="text-center mt-5"><Link to="/login" className="link">Back to sign in</Link></p>
        </div>
      </main>
    </div>
  );
}
