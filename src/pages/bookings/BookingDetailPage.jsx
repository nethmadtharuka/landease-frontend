import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Check, ChevronRight, BadgeCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { bookingsApi, servicesApi } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';
import { apiErrorMessage } from '../../lib/apiError';
import { bookingActions, canReview } from '../../lib/bookingActions';
import { BOOKING_STATUS as S } from '../../lib/enums';
import { dateTime, shortDate, money } from '../../lib/format';
import { Avatar, EmptyState, PageSpinner, StatusBadge } from '../../components/ui';
import { ConfirmDialog, ReviewModal } from '../../components/reviews';
import StatusPage from '../public/StatusPage';

const STEPS = [[S.Requested, 'Requested'], [S.Accepted, 'Accepted'], [S.InProgress, 'In progress'], [S.Completed, 'Completed']];
const HINT = {
  migrant: { Requested: 'Waiting for the provider to accept or decline.', Accepted: 'The provider will start the service on the day.', InProgress: 'The provider is working on it.', Completed: 'Completed — you can review the provider.', Cancelled: 'This booking was cancelled.' },
  provider: { Requested: 'Accept or decline this request.', Accepted: 'Start the service on the day.', InProgress: 'Mark it as completed when you are done.', Completed: 'Completed.', Cancelled: 'This booking was cancelled.' },
};

function Stepper({ status }) {
  const idx = STEPS.findIndex(([s]) => s === status);
  const cancelled = status === S.Cancelled;
  return (
    <ol className="grid grid-cols-4 mt-5" aria-label="Booking progress">
      {STEPS.map(([s, label], i) => {
        const done = !cancelled && i < idx; const current = !cancelled && i === idx;
        return (
          <li key={s} className="relative flex flex-col items-center text-center" aria-current={current ? 'step' : undefined}>
            {i > 0 && <span className={`absolute top-4 right-1/2 w-full h-0.5 -z-0 ${!cancelled && i <= idx ? 'bg-electric' : 'bg-line'}`} aria-hidden="true" />}
            <span className={`relative z-10 w-8 h-8 rounded-full inline-flex items-center justify-center text-[14px] font-semibold border-2
              ${done || (current && s === S.Completed) ? 'bg-electric border-electric text-white' : current ? 'bg-white border-electric text-electric ring-4 ring-electric/15' : 'bg-white border-line text-muted'}`}>
              {done || (current && s === S.Completed) ? <Check size={15} /> : i + 1}
            </span>
            <span className={`mt-2 text-[14.5px] ${current ? 'font-semibold' : 'text-muted'}`}>{label}</span>
          </li>
        );
      })}
    </ol>
  );
}

export default function BookingDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [booking, setBooking] = useState(null);
  const [service, setService] = useState(null);
  const [state, setState] = useState('loading');
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [reviewing, setReviewing] = useState(false);

  useEffect(() => {
    let alive = true;
    bookingsApi.getById(id).then(async r => {
      if (!alive) return;
      setBooking(r.data.data); setState('ok');
      // Price, destination and provider details live on the listing (it may since have been deactivated).
      const s = await servicesApi.getById(r.data.data.serviceId).catch(() => null);
      if (alive && s) setService(s.data.data);
    }).catch(err => alive && setState(err.response?.status === 403 ? 'forbidden' : err.response?.status === 404 ? 'missing' : apiErrorMessage(err)));
    return () => { alive = false; };
  }, [id]);

  if (state === 'loading') return <PageSpinner />;
  if (state === 'forbidden') return <StatusPage code={403} />;
  if (state !== 'ok') return <EmptyState title="Booking not found" action={<Link to="/dashboard/bookings" className="btn-ink">Back to bookings</Link>}>{state === 'missing' ? null : state}</EmptyState>;

  const isProvider = booking.providerId === user.id;
  const actions = bookingActions(booking, { isProvider });
  const update = async (a) => {
    setBusy(true);
    try {
      const res = await bookingsApi.updateStatus(booking.id, a.status);
      setBooking(res.data.data);
      toast.success(`${a.label}: done`);
    } catch (err) { toast.error(apiErrorMessage(err, 'Could not update the booking.')); } finally { setBusy(false); setConfirm(null); }
  };
  const onAction = (a) => ([S.Cancelled, S.Completed].includes(a.status) ? setConfirm(a) : update(a));
  const listLabel = isProvider ? 'Booking requests' : 'My bookings';

  return (
    <div>
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[14.5px] text-muted sm:hidden mb-3">
        <Link to="/dashboard/bookings" className="hover:text-ink">{listLabel}</Link><ChevronRight size={14} /><span className="text-ink font-medium">Booking #{booking.id}</span>
      </nav>
      <p className="text-[14.5px] text-muted font-medium">Booking #{booking.id}</p>
      <h1 className="page-title">{booking.serviceTitle}</h1>

      <section className="card p-6 mt-5">
        <div className="flex items-center justify-between gap-3"><StatusBadge status={booking.status} /><p className="text-[14.5px] text-muted">Last updated {shortDate(booking.updatedAt || booking.createdAt)}</p></div>
        {booking.status === S.Cancelled
          ? <p className="mt-4 rounded-[14px] bg-[#EEF1F5] px-4 py-3 text-[#475467]">Cancelled on {shortDate(booking.updatedAt)}. Cancelled bookings are final.</p>
          : <Stepper status={booking.status} />}
        <div className="flex flex-wrap items-center gap-3 mt-6">
          {actions.map(a => (
            <button key={a.status} type="button" disabled={busy} onClick={() => onAction(a)}
              className={a.primary ? 'btn-accent' : a.danger ? 'btn-ghost bg-white text-sos' : 'btn-ghost'}>{a.label === 'Cancel' || a.label === 'Cancel request' ? 'Cancel booking' : a.label}</button>
          ))}
          {canReview(booking, { isProvider }) && <button type="button" onClick={() => setReviewing(true)} className="btn-ink">Write a review</button>}
          <span className="text-muted">{HINT[isProvider ? 'provider' : 'migrant'][booking.status]}</span>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-5 mt-5 items-start">
        <section className="card p-6">
          <h2 className="text-[22px]">Booking details</h2>
          <dl className="grid sm:grid-cols-3 gap-3 mt-4">
            {[['Preferred date', booking.scheduledDate ? dateTime(booking.scheduledDate) : 'No date requested'], ['Requested', shortDate(booking.createdAt)],
              ['Price', service ? `USD ${money(service.price)}` : '—'], ['Destination', service?.destinationCountry || '—']].map(([k, v]) => (
              <div key={k} className="rounded-[14px] bg-[#F5F8FC] px-4 py-3"><dt className="text-[13.5px] text-muted font-medium">{k}</dt><dd className="font-semibold text-[16.5px]">{v}</dd></div>
            ))}
          </dl>
          <h3 className="font-sans font-semibold text-[16px] tracking-normal mt-5">{isProvider ? 'Notes from the migrant' : 'Notes from you'}</h3>
          <p className="rounded-[14px] bg-[#F5F8FC] px-4 py-3 mt-2 whitespace-pre-line break-words">{booking.notes || 'No notes.'}</p>
        </section>
        <section className="card p-6">
          <h2 className="text-[22px]">{isProvider ? 'Migrant' : 'Your provider'}</h2>
          <div className="flex items-center gap-3 mt-4">
            <Avatar name={isProvider ? booking.migrantName : booking.providerName} size={48} />
            <div>
              <p className="font-semibold text-[17px]">{isProvider ? booking.migrantName : booking.providerName}</p>
              {!isProvider && service && <p className="text-[14.5px] text-muted">{service.providerIsKycVerified && <><BadgeCheck size={14} className="inline -mt-0.5" /> Identity verified</>}{service.providerRating > 0 && ` · ★ ${service.providerRating}`}</p>}
            </div>
          </div>
          <p className="note mt-4 border border-dashed border-[#BBD3EE]">Phone and email aren&apos;t shared in bookings yet. Messaging is planned (backend gap G06).</p>
          <div className="grid gap-2 mt-4">
            <Link to={`/dashboard/services/${booking.serviceId}`} className="btn-ghost w-full">View service</Link>
            {!isProvider && <Link to={`/dashboard/providers/${booking.providerId}`} className="btn-ghost w-full">Provider profile</Link>}
          </div>
        </section>
      </div>

      {confirm && (
        <ConfirmDialog title={confirm.status === S.Completed ? `Mark “${booking.serviceTitle}” as completed?` : `Cancel “${booking.serviceTitle}”?`}
          body={confirm.status === S.Completed ? 'The migrant will be able to review you. This is final.' : 'Cancelled bookings are final and cannot be reopened.'}
          confirmLabel={confirm.status === S.Completed ? 'Mark as completed' : 'Cancel booking'} danger={confirm.status === S.Cancelled} busy={busy}
          onConfirm={() => update(confirm)} onCancel={() => setConfirm(null)} />
      )}
      {reviewing && <ReviewModal booking={booking} onClose={() => setReviewing(false)} onDone={() => setBooking(b => ({ ...b, hasReview: true }))} />}
    </div>
  );
}
