import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { aiApi } from '../api/endpoints';
import { apiErrorMessage } from '../lib/apiError';
import { BackendBadge } from '../components/ui';
import { ConfirmDialog } from '../components/reviews';

const NOTIFICATION_PREFS = [
  ['Booking updates', 'When a provider accepts, starts or completes a booking', true],
  ['New reviews and replies', 'When someone reviews you or replies', true],
  ['Community activity', 'New posts in your communities', false],
  ['Verification decisions', 'When staff approve or decline your documents', true],
];

function Switch({ checked, label }) {
  return (
    <span role="switch" aria-checked={checked} aria-label={label} aria-disabled="true"
      className={`w-[46px] h-[28px] rounded-full p-[3px] inline-flex shrink-0 opacity-90 ${checked ? 'bg-electric justify-end' : 'bg-[#C9D0DA] justify-start'}`}>
      <span className="w-[22px] h-[22px] rounded-full bg-white shadow-xs" />
    </span>
  );
}

export default function SettingsPage() {
  const { user } = useAuth();
  const [chatCount, setChatCount] = useState(null);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    aiApi.getHistory({ page: 1, pageSize: 1 }).then(r => setChatCount(r.data.data?.totalCount ?? 0)).catch(() => setChatCount(null));
  }, []);

  const deleteHistory = async () => {
    setBusy(true);
    try {
      await aiApi.clearHistory();
      try { localStorage.removeItem('landease.chat.sessionId'); } catch { /* storage unavailable */ }
      setChatCount(0);
      toast.success('Chat history deleted.');
    } catch (err) { toast.error(apiErrorMessage(err, 'Could not delete chat history.')); } finally { setBusy(false); setConfirm(false); }
  };

  const Card = 'card p-6';
  return (
    <div className="max-w-[880px] space-y-4">
      <div><h1 className="page-title">Account &amp; security</h1><p className="page-sub text-[17px]">Manage your sign-in, data and notifications.</p></div>

      <section className={Card}>
        <div className="flex items-center justify-between gap-3"><h2 className="text-[22px]">Email</h2><BackendBadge id="S2-10" /></div>
        <div className="flex flex-wrap items-center justify-between gap-3 mt-3">
          <div><p className="font-semibold text-[16.5px]">{user?.email}</p>
            <span className={user?.isEmailVerified ? 'badge-completed mt-1' : 'badge-requested mt-1'}>{user?.isEmailVerified ? 'Verified' : 'Not verified'}</span></div>
          <button type="button" className="btn-ghost" disabled>Resend verification email</button>
        </div>
      </section>

      <section className={Card}>
        <div className="flex items-center justify-between gap-3"><h2 className="text-[22px]">Password</h2><BackendBadge id="change-password endpoint" /></div>
        <div className="flex flex-wrap items-center justify-between gap-3 mt-3">
          <p className="text-muted text-[16.5px]">After 5 failed sign-ins your account locks for 15 minutes.</p>
          <button type="button" className="btn-ghost" disabled>Change password</button>
        </div>
      </section>

      <section className={Card}>
        <div className="flex items-center justify-between gap-3"><h2 className="text-[22px]">Notifications</h2><BackendBadge id="S2-06" /></div>
        <ul className="mt-3">
          {NOTIFICATION_PREFS.map(([t, d, on]) => (
            <li key={t} className="flex items-center justify-between gap-4 py-3.5 border-b border-line">
              <span><span className="block font-semibold">{t}</span><span className="block text-[14px] text-muted">{d}</span></span>
              <Switch checked={on} label={t} />
            </li>
          ))}
        </ul>
        <p className="text-[14px] text-muted mt-3">SOS alerts to responders are always on and can&apos;t be switched off. Preferences can&apos;t be saved until notifications exist.</p>
      </section>

      <section className={Card}>
        <h2 className="text-[22px]">Privacy &amp; data</h2>
        <div className="flex flex-wrap items-center justify-between gap-3 py-3.5 border-b border-line mt-2">
          <span><span className="block font-semibold">AI chat history</span>
            <span className="block text-[14px] text-muted">{chatCount === null ? 'Saved conversations with the AI assistant' : `${chatCount} message${chatCount === 1 ? '' : 's'} saved`}</span></span>
          <button type="button" className="btn-ghost" disabled={chatCount === 0} onClick={() => setConfirm(true)}>Delete chat history</button>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 py-3.5">
          <span><span className="block font-semibold">Download my data</span><span className="block text-[14px] text-muted">A copy of your profile, bookings and posts.</span></span>
          <BackendBadge />
        </div>
      </section>

      <section className="card p-6 border-[#F4C6C1]">
        <h2 className="text-[22px] text-sos">Delete account</h2>
        <div className="flex flex-wrap items-center justify-between gap-3 mt-2">
          <p className="text-muted text-[16.5px]">Permanently remove your account, bookings and posts.</p>
          <span className="flex items-center gap-2"><BackendBadge /><button type="button" className="btn-ghost text-sos/60" disabled>Delete account</button></span>
        </div>
      </section>

      {confirm && <ConfirmDialog title="Delete all AI chat history?" body="This permanently deletes every conversation with the AI assistant." confirmLabel="Delete history" busy={busy} onConfirm={deleteHistory} onCancel={() => setConfirm(false)} />}
    </div>
  );
}
