import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ChevronRight, BadgeCheck, Star, Pencil, Ban } from 'lucide-react';
import toast from 'react-hot-toast';
import { servicesApi, bookingsApi, reviewsApi } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';
import { apiErrorMessage } from '../../lib/apiError';
import { BOOKING_STATUS, categoryLabel } from '../../lib/enums';
import { coverFor } from '../../lib/media';
import { money, shortDate } from '../../lib/format';
import { Avatar, PageSpinner, StatusBadge, EmptyState } from '../../components/ui';
import { RatingSummary, ReviewList, ReviewModal, ConfirmDialog } from '../../components/reviews';

const OPEN = [BOOKING_STATUS.Requested, BOOKING_STATUS.Accepted, BOOKING_STATUS.InProgress];

export default function ServiceDetailPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const inApp = Boolean(user);
  const base = inApp ? '/dashboard' : '';
  const isMigrant = user?.role === 'Migrant';
  const isStaff = ['Admin', 'Agency'].includes(user?.role);

  const [service, setService] = useState(null);
  const [providerServices, setProviderServices] = useState(0);
  const [reviews, setReviews] = useState([]);
  const [mine, setMine] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [booking, setBooking] = useState({ scheduledDate: '', notes: '' });
  const [bookingBusy, setBookingBusy] = useState(false);
  const [created, setCreated] = useState(null);
  const [reviewing, setReviewing] = useState(null);
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);
  const [deactivating, setDeactivating] = useState(false);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      setLoading(true);
      try {
        const svc = (await servicesApi.getById(id)).data.data;
        if (!alive) return;
        setService(svc);
        const [rev, mineRes, prov] = await Promise.all([
          reviewsApi.getByProvider(svc.providerId),
          isMigrant ? bookingsApi.getMine() : Promise.resolve({ data: { data: [] } }),
          servicesApi.getByProvider(svc.providerId).catch(() => ({ data: { data: [] } })),
        ]);
        if (!alive) return;
        setReviews(rev.data.data || []);
        setMine((mineRes.data.data || []).filter(b => b.serviceId === svc.id));
        setProviderServices((prov.data.data || []).length);
      } catch (err) {
        if (!alive) return;
        if (err.response?.status === 404) setNotFound(true);
        else toast.error(apiErrorMessage(err, 'Could not load this service.'));
      } finally {
        if (alive) setLoading(false);
      }
    };
    load();
    return () => { alive = false; };
  }, [id, isMigrant]);

  const reviewable = mine.filter(b => b.status === BOOKING_STATUS.Completed && !b.hasReview);
  const openBooking = mine.find(b => OPEN.includes(b.status));

  // Deep link from bookings: ?review={bookingId} opens the review dialog.
  useEffect(() => {
    const target = Number(searchParams.get('review'));
    if (target && reviewable.some(b => b.id === target)) setReviewing(reviewable.find(b => b.id === target));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, mine.length]);

  const handleBook = async (e) => {
    e.preventDefault();
    setBookingBusy(true);
    try {
      const res = await bookingsApi.create({
        serviceId: Number(id),
        notes: booking.notes.trim() || null,
        scheduledDate: booking.scheduledDate ? new Date(booking.scheduledDate).toISOString() : null,
      });
      toast.success('Booking request sent.');
      setCreated(res.data.data);
      setMine(m => [res.data.data, ...m]);
      setBooking({ scheduledDate: '', notes: '' });
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Booking failed.'));
      if (err.response?.status === 409) bookingsApi.getMine().then(r => setMine((r.data.data || []).filter(b => b.serviceId === Number(id)))).catch(() => {});
    } finally {
      setBookingBusy(false);
    }
  };

  const deactivate = async () => {
    setDeactivating(true);
    try {
      await servicesApi.delete(id);
      toast.success('Service deactivated.');
      navigate(user?.role === 'Helper' ? '/dashboard/my-services' : '/dashboard/admin/listings');
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not deactivate this service.'));
      setDeactivating(false); setConfirmDeactivate(false);
    }
  };

  if (loading) return <PageSpinner />;
  if (notFound || !service) return (
    <div className={inApp ? '' : 'container-x pt-12'}>
      <EmptyState title="This service is no longer available" action={<Link to={`${base}/services`} className="btn-ink">Explore services</Link>}>
        The provider may have deactivated it.
      </EmptyState>
    </div>
  );

  const isOwner = user?.id === service.providerId;
  const minDate = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  const paragraphs = service.description.split(/\n\s*\n/);

  const actionCard = (() => {
    if (!user) return (
      <>
        <p className="text-muted text-[14.5px]">Sign in as a migrant to request this service. Browsing is free.</p>
        <Link to={`/login?next=${encodeURIComponent(`/dashboard/services/${id}`)}`} className="btn-accent w-full h-12 mt-5">Sign in to request</Link>
        <p className="text-center text-[14px] text-muted mt-4">New here? <Link to="/register" className="link">Create an account</Link></p>
      </>
    );
    if (isOwner) return (
      <>
        <p className="font-semibold">This is your service</p>
        <p className="text-muted text-[14.5px] mt-1">Migrants see it in Explore while it&apos;s active.</p>
        <Link to={`/dashboard/services/${id}/edit`} className="btn-ink w-full mt-5"><Pencil size={15} />Edit service</Link>
        <button type="button" onClick={() => setConfirmDeactivate(true)} className="btn-ghost w-full mt-2 text-sos">Deactivate</button>
      </>
    );
    if (isStaff) return (
      <>
        <p className="text-muted text-[14.5px]">Only migrants can book services.</p>
        <button type="button" onClick={() => setConfirmDeactivate(true)} className="btn-danger w-full mt-5"><Ban size={15} />Deactivate listing</button>
        <p className="text-[13px] text-muted mt-3 text-center">Moderation action · hides it from search.</p>
      </>
    );
    if (!isMigrant) return <p className="text-muted text-[14.5px]">Only migrants can book services.</p>;
    if (created || openBooking) {
      const b = created || openBooking;
      return (
        <>
          <p className="font-semibold">{created ? 'Request sent' : 'You have an active booking'}</p>
          <p className="text-muted text-[14.5px] mt-1">{created ? 'The provider will accept or decline. Track it in My bookings.' : 'Follow its progress or cancel it from the booking page.'}</p>
          <div className="mt-4 flex items-center justify-between rounded-[14px] bg-canvas px-4 py-3"><span className="text-[14.5px]">Booking #{b.id}</span><StatusBadge status={b.status} /></div>
          <Link to={`/dashboard/bookings/${b.id}`} className="btn-ink w-full mt-4">View booking</Link>
        </>
      );
    }
    return (
      <form onSubmit={handleBook}>
        <label htmlFor="booking-date" className="label">Preferred date &amp; time <span className="text-muted font-normal">(optional)</span></label>
        <input id="booking-date" type="datetime-local" className="input" min={minDate} value={booking.scheduledDate}
          onChange={e => setBooking({ ...booking, scheduledDate: e.target.value })} />
        <label htmlFor="booking-notes" className="label mt-4">Notes for the provider <span className="text-muted font-normal">(optional)</span></label>
        <textarea id="booking-notes" className="input h-28 resize-y" maxLength={1000} placeholder="Flight number, luggage, anything they should know"
          value={booking.notes} onChange={e => setBooking({ ...booking, notes: e.target.value })} />
        <p className="text-right text-[13px] text-muted mt-1">{booking.notes.length} / 1000</p>
        <button type="submit" disabled={bookingBusy} className="btn-accent w-full h-12 mt-3">{bookingBusy && <span className="spinner w-4 h-4" />}Request booking</button>
        <p className="text-center text-[13.5px] text-muted mt-3">The provider accepts or declines. You can cancel any time before it&apos;s completed.</p>
      </form>
    );
  })();

  return (
    <div className={inApp ? 'pt-2' : 'container-x pt-6'}>
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[14.5px] text-muted flex-wrap">
        <Link to={`${base}/services`} className="hover:text-ink">Explore services</Link><ChevronRight size={14} />
        <Link to={`${base}/services?category=${service.category}`} className="hover:text-ink">{categoryLabel(service.category)}</Link><ChevronRight size={14} />
        <span className="text-ink font-medium truncate max-w-[60vw]">{service.title}</span>
      </nav>

      <div className="relative mt-4 h-[220px] md:h-[340px] rounded-media overflow-hidden">
        <img src={coverFor(service.destinationCountry)} alt="" className="w-full h-full object-cover" />
        <div className="absolute left-4 bottom-4 flex gap-2">
          <span className="badge bg-white text-ink h-8 px-3.5 text-[14px]">{categoryLabel(service.category)}</span>
          <span className="badge bg-white text-ink h-8 px-3.5 text-[14px]">{service.destinationCountry}</span>
        </div>
        <span className="absolute right-4 bottom-4 badge bg-navy/70 text-white h-7 px-3 text-[12.5px]">Destination photo</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-7 mt-7 items-start">
        <div className="min-w-0 space-y-5">
          <div>
            <h1 className="display text-[34px] md:text-[44px] break-words">{service.title}</h1>
            <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[15px] text-muted">
              {service.providerIsKycVerified && <span className="text-electric font-medium inline-flex items-center gap-1"><BadgeCheck size={15} />Provider identity verified</span>}
              <span>{service.destinationCountry}</span><span>Listed {shortDate(service.createdAt)}</span>
            </p>
          </div>

          {/* Mobile: action card right after the title */}
          <div className="lg:hidden card p-6"><p className="mb-4"><span className="text-[13px] font-medium mr-1">USD</span><span className="numeral text-[36px]">{money(service.price)}</span></p>{actionCard}</div>

          <section className="card p-6">
            <h2 className="text-[21px]">About this service</h2>
            {paragraphs.map((p, i) => <p key={i} className="text-muted text-[16px] leading-relaxed mt-3 whitespace-pre-line break-words">{p}</p>)}
            <dl className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
              {[['Category', categoryLabel(service.category)], ['Destination', service.destinationCountry], ['Price', `USD ${money(service.price)}`], ['Listed since', shortDate(service.createdAt)]].map(([k, v]) => (
                <div key={k} className="rounded-[14px] bg-[#F5F8FC] px-3.5 py-2.5"><dt className="text-[13px] text-muted">{k}</dt><dd className="font-medium">{v}</dd></div>
              ))}
            </dl>
          </section>

          <section className="card p-5 flex flex-wrap items-center gap-4">
            <Avatar name={service.providerName} size={56} />
            <div className="flex-1 min-w-[180px]">
              <p className="font-semibold text-[17px]">{service.providerName}</p>
              <p className="text-[14.5px] text-muted">
                {service.providerIsKycVerified && <span className="text-electric font-medium">✓ Identity verified · </span>}
                {service.providerRating > 0 && <>★ {service.providerRating} · </>}{reviews.length} review{reviews.length === 1 ? '' : 's'} · {providerServices} active service{providerServices === 1 ? '' : 's'}
              </p>
            </div>
            <Link to={`${base}/providers/${service.providerId}`} className="btn-ghost">View profile</Link>
          </section>

          <section className="card p-6">
            <h2 className="text-[21px]">Reviews of {service.providerName}</h2>
            <p className="text-muted text-[14.5px] mt-0.5">Reviews cover all of this provider&apos;s services.</p>
            {reviews.length === 0 ? <p className="text-muted mt-4">No reviews yet.</p> : (
              <>
                <div className="mt-5 pb-4 border-b border-line"><RatingSummary reviews={reviews} /></div>
                <ReviewList reviews={reviews} />
              </>
            )}
            {isMigrant && reviewable.length > 0 && (
              <div className="mt-4 note flex flex-wrap items-center justify-between gap-3">
                <span><Star size={14} className="inline -mt-0.5 mr-1" />Your booking is completed — share how it went.</span>
                <button type="button" className="btn-ink btn-sm" onClick={() => setReviewing(reviewable[0])}>Write a review</button>
              </div>
            )}
          </section>
        </div>

        <aside className="hidden lg:block card p-6 shadow-hover sticky top-24">
          <p><span className="text-[13px] font-medium mr-1">USD</span><span className="numeral text-[40px]">{money(service.price)}</span></p>
          <p className="text-[14px] text-muted mt-1 pb-5 mb-5 border-b border-line">Price set by the provider. Shown in USD.</p>
          {actionCard}
        </aside>
      </div>

      {reviewing && (
        <ReviewModal booking={reviewing} onClose={() => setReviewing(null)}
          onDone={(r) => { if (r) setReviews(prev => [r, ...prev]); setMine(m => m.map(b => (b.id === reviewing.id ? { ...b, hasReview: true } : b))); }} />
      )}
      {confirmDeactivate && (
        <ConfirmDialog title={`Deactivate “${service.title}”?`} busy={deactivating} confirmLabel="Deactivate"
          body={`It will disappear from search and can't be restored from LandEase yet.${isStaff && !isOwner ? ` The provider (${service.providerName}) keeps their account.` : ''}`}
          onConfirm={deactivate} onCancel={() => setConfirmDeactivate(false)} />
      )}
    </div>
  );
}
