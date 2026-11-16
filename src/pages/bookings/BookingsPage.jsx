import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ClipboardList } from 'lucide-react';
import toast from 'react-hot-toast';
import { bookingsApi } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';
import { apiErrorMessage } from '../../lib/apiError';
import { bookingActions, canReview } from '../../lib/bookingActions';
import { BOOKING_STATUS as S } from '../../lib/enums';
import { coverFor } from '../../lib/media';
import { dateTime } from '../../lib/format';
import { Avatar, EmptyState, ErrorState, StatusBadge } from '../../components/ui';
import { ConfirmDialog, ReviewModal } from '../../components/reviews';

const MIGRANT_TABS = [
  ['active', 'Active', b => [S.Requested, S.Accepted, S.InProgress].includes(b.status)],
  ['completed', 'Completed', b => b.status === S.Completed],
  ['cancelled', 'Cancelled', b => b.status === S.Cancelled],
];
const PROVIDER_TABS = [
  ['new', 'New', b => b.status === S.Requested],
  ['upcoming', 'Upcoming', b => b.status === S.Accepted],
  ['progress', 'In progress', b => b.status === S.InProgress],
  ['past', 'Past', b => [S.Completed, S.Cancelled].includes(b.status)],
];
// Terminal moves are confirmed; reversible ones (accept, start) are not.
const NEEDS_CONFIRM = [S.Cancelled, S.Completed];

export default function BookingsPage() {
  const { user } = useAuth();
  const isProvider = user?.role === 'Helper';
  const TABS = isProvider ? PROVIDER_TABS : MIGRANT_TABS;
  const [params, setParams] = useSearchParams();
  const tab = TABS.find(t => t[0] === params.get('tab'))?.[0] ?? TABS[0][0];
  const [bookings, setBookings] = useState(null);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [reviewing, setReviewing] = useState(null);

  // Migrants see their requests (/mine); providers see requests for their services (/incoming).
  const load = useCallback(async () => {
    setError(null);
    try {
      const res = isProvider ? await bookingsApi.getIncoming() : await bookingsApi.getMine();
      setBookings(res.data.data || []);
    } catch (err) { setError(apiErrorMessage(err, 'Could not load bookings.')); }
  }, [isProvider]);
  useEffect(() => { load(); }, [load]);

  const update = async (b, action) => {
    setBusyId(b.id);
    try {
      const res = await bookingsApi.updateStatus(b.id, action.status);
      setBookings(list => list.map(x => (x.id === b.id ? res.data.data : x)));
      toast.success(`${action.label}: done`);
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not update the booking.'));
      if (err.response?.status === 409) load();
    } finally { setBusyId(null); setConfirm(null); }
  };
  const onAction = (b, a) => (NEEDS_CONFIRM.includes(a.status) ? setConfirm({ b, a }) : update(b, a));

  const current = TABS.find(t => t[0] === tab);
  const shown = (bookings || []).filter(current[2]);

  const actionButtons = (b) => (
    <>
      {bookingActions(b, { isProvider }).map(a => (
        <button key={a.status} type="button" disabled={busyId === b.id} onClick={() => onAction(b, a)}
          className={a.primary ? 'btn-accent btn-sm' : a.danger ? 'btn-ghost btn-sm bg-white text-sos' : 'btn-ghost btn-sm'}>{a.label}</button>
      ))}
      {canReview(b, { isProvider }) && <button type="button" onClick={() => setReviewing(b)} className="btn-ink btn-sm">Write a review</button>}
    </>
  );

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="page-title">{isProvider ? 'Booking requests' : 'My bookings'}</h1>
          <p className="page-sub text-[17px]">{isProvider ? 'Accept, start and complete bookings for your services.' : "Requests you've sent and services in progress."}</p>
        </div>
        {!isProvider && <Link to="/dashboard/services" className="btn-ink">Find a service</Link>}
      </div>

      <div role="tablist" className="flex gap-6 border-b border-line mt-6 overflow-x-auto">
        {TABS.map(([k, l, f]) => {
          const n = (bookings || []).filter(f).length;
          return (
            <button key={k} type="button" role="tab" aria-selected={tab === k} className="tab whitespace-nowrap" onClick={() => setParams(k === TABS[0][0] ? {} : { tab: k }, { replace: true })}>
              {l} <span className={`ml-1.5 text-[12.5px] ${tab === k ? 'bg-ink-pill text-white' : 'text-muted'} rounded-full px-2 py-0.5`}>{bookings ? n : ''}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-5">
        {error ? <ErrorState message={error} onRetry={load} />
          : bookings === null ? <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="card h-24 skeleton" />)}</div>
          : shown.length === 0 ? (
            <EmptyState icon={ClipboardList} title={isProvider ? (tab === 'new' ? 'No new requests' : 'Nothing here yet') : (tab === 'active' ? 'No active bookings' : 'Nothing here yet')}
              action={!isProvider && tab === 'active' ? <Link to="/dashboard/services" className="btn-ink">Explore services</Link>
                : isProvider && tab === 'new' ? <Link to="/dashboard/my-services" className="btn-ghost">My services</Link> : null}>
              {isProvider && tab === 'new' ? 'Make sure your services are active.' : !isProvider && tab === 'active' ? 'Requests you send appear here.' : null}
            </EmptyState>
          ) : isProvider ? (
            <>
              <div className="hidden md:block card overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-[#F5F8FC] text-[14px] text-muted"><tr>
                    <th className="font-medium px-4 py-3">Migrant</th><th className="font-medium px-4 py-3">Service</th><th className="font-medium px-4 py-3">Preferred date</th>
                    <th className="font-medium px-4 py-3">Notes</th><th className="font-medium px-4 py-3">Status</th><th className="px-4 py-3"><span className="sr-only">Actions</span></th></tr></thead>
                  <tbody>
                    {shown.map(b => (
                      <tr key={b.id} className="border-t border-line align-middle">
                        <td className="px-4 py-3"><span className="flex items-center gap-3"><Avatar name={b.migrantName} size={34} /><b className="font-semibold">{b.migrantName}</b></span></td>
                        <td className="px-4 py-3 max-w-[200px]">{b.serviceTitle}</td>
                        <td className="px-4 py-3 whitespace-nowrap">{b.scheduledDate ? dateTime(b.scheduledDate) : 'No date'}</td>
                        <td className="px-4 py-3 text-muted max-w-[220px]"><span className="line-clamp-3">{b.notes || '—'}</span></td>
                        <td className="px-4 py-3"><StatusBadge status={b.status} /></td>
                        <td className="px-4 py-3"><div className="flex justify-end gap-2">{actionButtons(b)}<Link to={`/dashboard/bookings/${b.id}`} className="btn-ghost btn-sm">View</Link></div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="md:hidden space-y-3">
                {shown.map(b => (
                  <div key={b.id} className="card p-4">
                    <div className="flex items-start gap-3"><Avatar name={b.migrantName} size={36} />
                      <div className="flex-1 min-w-0"><p className="font-semibold">{b.migrantName}</p><p className="text-[14px] text-muted">{b.serviceTitle}</p>
                        <p className="text-[14px]">{b.scheduledDate ? dateTime(b.scheduledDate) : 'No date'}</p></div><StatusBadge status={b.status} /></div>
                    {b.notes && <p className="text-[14.5px] text-muted mt-2">“{b.notes}”</p>}
                    <div className="flex flex-wrap gap-2 mt-3">{actionButtons(b)}<Link to={`/dashboard/bookings/${b.id}`} className="btn-ghost btn-sm">View</Link></div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="space-y-3">
              {shown.map(b => (
                <div key={b.id} className="card p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                  <img src={coverFor(user?.destinationCountry)} alt="" className="w-14 h-14 rounded-[14px] object-cover shrink-0 hidden sm:block" />
                  <Link to={`/dashboard/bookings/${b.id}`} className="flex-1 min-w-0">
                    <p className="font-display text-[19px] tracking-[-0.025em] leading-snug">{b.serviceTitle}</p>
                    <p className="text-[14.5px] text-muted">{b.providerName} · Booking #{b.id}</p>
                    <p className="text-[14.5px]">{b.scheduledDate ? dateTime(b.scheduledDate) : 'No date requested'}</p>
                  </Link>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={b.status} />
                    <Link to={`/dashboard/bookings/${b.id}`} className="btn-ghost btn-sm bg-white">Details</Link>
                    {actionButtons(b)}
                  </div>
                </div>
              ))}
            </div>
          )}
      </div>

      {confirm && (
        <ConfirmDialog
          title={confirm.a.status === S.Completed ? `Mark “${confirm.b.serviceTitle}” as completed?` : `${confirm.a.label} — ${confirm.b.serviceTitle}?`}
          body={confirm.a.status === S.Completed ? 'The migrant will be able to review you. This is final.' : 'Cancelled bookings are final and cannot be reopened.'}
          confirmLabel={confirm.a.label} danger={confirm.a.status === S.Cancelled} busy={busyId === confirm.b.id}
          onConfirm={() => update(confirm.b, confirm.a)} onCancel={() => setConfirm(null)} />
      )}
      {reviewing && <ReviewModal booking={reviewing} onClose={() => setReviewing(null)}
        onDone={() => setBookings(list => list.map(x => (x.id === reviewing.id ? { ...x, hasReview: true } : x)))} />}
    </div>
  );
}
