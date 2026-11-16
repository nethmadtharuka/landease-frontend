import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, RotateCw, Star, Siren, IdCard, Inbox, X, MessageSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { bookingsApi, sosApi, kycApi } from '../api/endpoints';
import { BOOKING_STATUS as S } from '../lib/enums';
import { timeAgo, dateTime } from '../lib/format';
import { BackendBadge, EmptyState } from '../components/ui';

// There is no notifications API yet (backend gap S2-06). This inbox is built from the user's real
// bookings, verification and SOS records; "read" state is a per-device convenience in localStorage.
const READ_KEY = 'landease.inbox.readBefore';
const readBefore = () => { try { return Number(localStorage.getItem(READ_KEY)) || 0; } catch { return 0; } };

function useActivity(user) {
  const [items, setItems] = useState(null);
  useEffect(() => {
    let alive = true;
    const isProvider = user.role === 'Helper';
    const tasks = [];
    if (['Migrant', 'Helper'].includes(user.role)) tasks.push((isProvider ? bookingsApi.getIncoming() : bookingsApi.getMine()).then(r => (r.data.data || []).flatMap(b => {
      const at = b.updatedAt || b.createdAt;
      const out = [];
      if (isProvider && b.status === S.Requested) out.push({ id: `b${b.id}`, at, icon: Inbox, tone: 'blue', title: 'New booking request', body: `${b.migrantName} requested “${b.serviceTitle}”.`, to: `/dashboard/bookings/${b.id}` });
      if (!isProvider && b.status === S.Accepted) out.push({ id: `b${b.id}`, at, icon: Check, tone: 'blue', title: 'Booking accepted', body: `${b.providerName} accepted “${b.serviceTitle}”${b.scheduledDate ? ` for ${dateTime(b.scheduledDate)}` : ''}.`, to: `/dashboard/bookings/${b.id}` });
      if (!isProvider && b.status === S.InProgress) out.push({ id: `b${b.id}`, at, icon: RotateCw, tone: 'sky', title: 'Your service is in progress', body: `${b.providerName} started “${b.serviceTitle}”.`, to: `/dashboard/bookings/${b.id}` });
      if (!isProvider && b.status === S.Completed && !b.hasReview) out.push({ id: `r${b.id}`, at, icon: Star, tone: 'amber', title: `How was ${b.serviceTitle.toLowerCase()}?`, body: `Leave a review for ${b.providerName}.`, to: `/dashboard/services/${b.serviceId}?review=${b.id}` });
      if (b.status === S.Cancelled) out.push({ id: `c${b.id}`, at, icon: X, tone: 'grey', title: 'Booking cancelled', body: `“${b.serviceTitle}” was cancelled.`, to: `/dashboard/bookings/${b.id}` });
      return out;
    })));
    if (user.role === 'Migrant') tasks.push(sosApi.getHistory().then(r => (r.data.data || []).filter(e => e.status === 'Resolved').slice(0, 3)
      .map(e => ({ id: `s${e.id}`, at: e.resolvedAt || e.createdAt, icon: Siren, tone: 'red', title: 'SOS resolved', body: `Your ${e.eventType} alert from ${dateTime(e.createdAt)} was resolved.`, to: '/dashboard/sos/history' }))));
    tasks.push(kycApi.getStatus().then(r => {
      const k = r.data.data;
      if (k.status === 'Approved') return [{ id: 'kyc', at: k.reviewedAt, icon: IdCard, tone: 'green', title: 'Identity verified', body: 'Staff approved your documents.', to: '/dashboard/kyc' }];
      if (k.status === 'Rejected') return [{ id: 'kyc', at: k.reviewedAt, icon: IdCard, tone: 'red', title: 'Verification declined', body: k.rejectionReason, to: '/dashboard/kyc' }];
      return [];
    }).catch(() => []));
    Promise.all(tasks.map(t => t.catch(() => []))).then(lists => alive && setItems(lists.flat().filter(i => i.at).sort((a, b) => new Date(b.at) - new Date(a.at)).slice(0, 30)));
    return () => { alive = false; };
  }, [user.role]);
  return items;
}

const TONES = { blue: 'bg-electric-50 text-electric', sky: 'bg-sky50 text-[#24609E]', amber: 'bg-[#FFF4E0] text-[#9A5B00]', red: 'bg-[#FDECEC] text-sos', green: 'bg-[#E7F6EF] text-[#0F7B4F]', grey: 'bg-[#EEF1F5] text-[#475467]' };

export default function NotificationsPage() {
  const { user } = useAuth();
  const items = useActivity(user);
  const [tab, setTab] = useState('notifications');
  const [cutoff, setCutoff] = useState(readBefore);
  const unread = useMemo(() => (items || []).filter(i => new Date(i.at).getTime() > cutoff).length, [items, cutoff]);
  const markAll = () => { const now = Date.now(); try { localStorage.setItem(READ_KEY, String(now)); } catch { /* storage unavailable */ } setCutoff(now); };

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><h1 className="page-title">Inbox</h1><p className="page-sub text-[17px]">Recent updates from your bookings, verification and SOS. Email and booking pages remain the source of truth.</p></div>
        <BackendBadge id="notifications S2-06 · messaging G06" />
      </div>
      <div role="tablist" className="flex gap-6 border-b border-line mt-6">
        <button type="button" role="tab" aria-selected={tab === 'notifications'} className="tab" onClick={() => setTab('notifications')}>
          Notifications {unread > 0 && <span className="ml-1.5 bg-electric text-white text-[12px] rounded-full px-2 py-0.5">{unread}</span>}</button>
        <button type="button" role="tab" aria-selected={tab === 'messages'} className="tab" onClick={() => setTab('messages')}>Messages</button>
      </div>
      {tab === 'messages' ? (
        <div className="mt-5"><EmptyState icon={MessageSquare} title="Messaging isn't available yet">Coordinate through booking notes for now. Phone and email aren&apos;t shared in bookings yet (backend gap G06).</EmptyState></div>
      ) : (
        <>
          <div className="flex justify-end mt-4"><button type="button" onClick={markAll} disabled={!unread} className="btn-ghost btn-sm bg-white">Mark all as read</button></div>
          <div className="mt-3">
            {items === null ? <div className="card p-5 space-y-3">{[1, 2, 3].map(i => <div key={i} className="skeleton h-12" />)}</div>
              : items.length === 0 ? <EmptyState icon={Inbox} title="You're all caught up">Updates about your bookings and verification will appear here.</EmptyState>
              : (
                <ul className="card overflow-hidden">
                  {items.map(i => {
                    const isUnread = new Date(i.at).getTime() > cutoff;
                    return (
                      <li key={i.id} className={`border-b border-line last:border-0 ${isUnread ? 'bg-[#F8F9FF]' : ''}`}>
                        <Link to={i.to} className="flex gap-4 px-5 py-4 hover:bg-canvas/60">
                          <span className={`w-10 h-10 rounded-[12px] inline-flex items-center justify-center shrink-0 ${TONES[i.tone]}`}><i.icon size={17} /></span>
                          <span className="flex-1 min-w-0"><span className="block font-semibold">{i.title}</span><span className="block text-muted text-[15px] break-words">{i.body}</span></span>
                          <span className="flex items-start gap-3 text-[14px] text-muted shrink-0">{timeAgo(i.at)}{isUnread && <span className="w-2.5 h-2.5 mt-1 rounded-full bg-electric" aria-label="Unread" />}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
          </div>
        </>
      )}
    </div>
  );
}
