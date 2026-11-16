import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Star, X, ClipboardList, Sparkles, Languages, Gauge, Camera, BadgeCheck, ShieldAlert, IdCard,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { bookingsApi, communityApi, servicesApi, reviewsApi, sosApi, kycApi, adminApi } from '../api/endpoints';
import { getRecommendations } from '../lib/recommendations';
import { apiErrorMessage } from '../lib/apiError';
import { bookingActions } from '../lib/bookingActions';
import { BOOKING_STATUS, categoryLabel, migrationStatusLabel } from '../lib/enums';
import { IMG, CATEGORY_ICONS, coverFor } from '../lib/media';
import { firstName, dateTime, shortDate, timeAgo, money } from '../lib/format';
import { ArrowLink, Avatar, StatusBadge, Stars } from '../components/ui';
import { ReviewModal } from '../components/reviews';
import ExplainDrawer from '../components/ExplainDrawer';

const OPEN = [BOOKING_STATUS.Requested, BOOKING_STATUS.Accepted, BOOKING_STATUS.InProgress];

function useLoad(fn, deps) {
  const [state, setState] = useState({ data: null, error: null });
  useEffect(() => {
    let alive = true;
    fn().then(d => alive && setState({ data: d, error: null })).catch(e => alive && setState({ data: null, error: apiErrorMessage(e) }));
    return () => { alive = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return state;
}

function Stat({ value, label, sub, highlight, icon: Icon, dot }) {
  return (
    <div className={`relative rounded-card p-5 pt-12 min-h-[140px] flex flex-col justify-end ${highlight ? 'bg-electric text-white' : 'card'}`}>
      {Icon && <span className={`absolute top-4 right-4 w-9 h-9 rounded-full inline-flex items-center justify-center ${highlight ? 'bg-white text-electric' : 'bg-canvas'}`}><Icon size={16} /></span>}
      <p className="numeral text-[48px]">{value ?? '—'}{dot && <span className="inline-block w-3 h-3 rounded-full bg-sos ml-2 align-middle" />}</p>
      <p className="stat-label mt-3">{label}</p>
      {sub && <p className={`text-[13.5px] ${highlight ? 'text-white/85' : 'text-muted'}`}>{sub}</p>}
    </div>
  );
}

function Hero({ image, overlay, children, action }) {
  return (
    <section className="relative rounded-media overflow-hidden min-h-[200px] md:min-h-[210px] flex items-end">
      <img src={image} alt="" className="absolute inset-0 w-full h-full object-cover" />
      <div className={`absolute inset-0 ${overlay}`} />
      <div className="relative w-full p-6 md:p-7 flex flex-col md:flex-row md:items-end justify-between gap-4 text-white">
        <div>{children}</div>
        {action}
      </div>
    </section>
  );
}

const AI_TOOLS = [
  ['/dashboard/ai-chat', Sparkles, 'AI Assistant', 'Ask a general question'],
  ['/dashboard/voice-translator', Languages, 'Voice translator', '16 languages'],
  ['/dashboard/immigration', Gauge, 'Profile strength', 'General indicator'],
  ['/dashboard/place-recognition', Camera, 'Place recognition', 'Explore with a photo'],
];

/* ── Migrant ───────────────────────────────────────────── */
function MigrantOverview({ user }) {
  const [bookings, setBookings] = useState(null);
  const communities = useLoad(() => communityApi.getAll({ page: 1, pageSize: 100 }).then(r => r.data.data?.items || []), []);
  const recs = useLoad(() => getRecommendations(), []);
  const [dismissed, setDismissed] = useState(false);
  const [reviewing, setReviewing] = useState(null);
  const [explain, setExplain] = useState(null);

  useEffect(() => {
    bookingsApi.getMine().then(r => setBookings(r.data.data || [])).catch(err => { setBookings([]); toast.error(apiErrorMessage(err, 'Could not load your bookings.')); });
  }, []);

  const list = bookings || [];
  const open = list.filter(b => OPEN.includes(b.status))
    .sort((a, b) => (a.scheduledDate && b.scheduledDate ? new Date(a.scheduledDate) - new Date(b.scheduledDate) : a.scheduledDate ? -1 : b.scheduledDate ? 1 : new Date(b.createdAt) - new Date(a.createdAt)));
  const toReview = list.filter(b => b.status === BOOKING_STATUS.Completed && !b.hasReview);
  const joined = (communities.data || []).filter(c => c.isMember);
  const dest = user.destinationCountry;

  return (
    <div className="space-y-5">
      <Hero image={IMG.surfBeach} overlay="bg-gradient-to-r from-royal/85 via-royal/55 to-royal/10"
        action={<ArrowLink to={dest ? `/dashboard/services?destinationCountry=${encodeURIComponent(dest)}` : '/dashboard/services'}>{dest ? `Find services in ${dest}` : 'Find services'}</ArrowLink>}>
        <h1 className="display text-white text-[40px] md:text-[48px]">Hi {firstName(user.fullName)}</h1>
        <p className="text-[17px] text-white/90 mt-1">{dest ? `Your move to ${dest}` : <Link to="/dashboard/profile" className="underline">Set your destination country</Link>} · {migrationStatusLabel(user.migrationStatus)}</p>
      </Hero>

      {!dest && (
        <div className="card p-4 flex flex-wrap items-center gap-4">
          <span className="icon-tile bg-[#FFF4E0] text-[#9A5B00]"><ShieldAlert size={18} /></span>
          <div className="flex-1 min-w-[200px]"><p className="font-semibold">Add your destination country</p><p className="text-muted text-[14.5px]">SOS alerts and recommendations need it.</p></div>
          <Link to="/dashboard/profile" className="btn-ink">Update profile</Link>
        </div>
      )}
      {toReview[0] && !dismissed && (
        <div className="card p-4 flex flex-wrap items-center gap-4">
          <span className="icon-tile bg-[#FFF4E0] text-[#9A5B00]"><Star size={18} /></span>
          <div className="flex-1 min-w-[200px]">
            <p className="font-semibold">How was your {toReview[0].serviceTitle.toLowerCase()}?</p>
            <p className="text-muted text-[14.5px]">Your booking with {toReview[0].providerName} is completed. Reviews help other newcomers choose.</p>
          </div>
          <button type="button" onClick={() => setReviewing(toReview[0])} className="btn-ink">Write a review</button>
          <button type="button" onClick={() => setDismissed(true)} aria-label="Dismiss" className="w-10 h-10 rounded-full bg-canvas inline-flex items-center justify-center"><X size={16} /></button>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat highlight icon={ClipboardList} value={bookings && open.length} label="Active bookings" />
        <Stat value={bookings && list.filter(b => b.status === BOOKING_STATUS.Completed).length} label="Completed" />
        <Stat value={bookings && toReview.length} label="Awaiting your review" />
        <Stat value={communities.data && joined.length} label="Communities joined" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.45fr_1fr] gap-5 items-start">
        <section className="card p-6">
          <div className="flex items-center justify-between"><h2 className="text-[22px]">Upcoming bookings</h2><Link to="/dashboard/bookings" className="link text-[15px]">All bookings</Link></div>
          {bookings === null ? <div className="space-y-3 mt-4">{[1, 2, 3].map(i => <div key={i} className="skeleton h-14" />)}</div>
            : open.length === 0 ? (
              <div className="mt-4 text-muted">No active bookings. <Link to="/dashboard/services" className="link">Explore services</Link></div>
            ) : (
              <ul className="mt-3">
                {open.slice(0, 3).map(b => {
                  const I = CATEGORY_ICONS[b.category] || ClipboardList;
                  return (
                    <li key={b.id} className="border-b border-line last:border-0">
                      <Link to={`/dashboard/bookings/${b.id}`} className="flex items-center gap-4 py-3.5 hover:bg-canvas/50 -mx-2 px-2 rounded-[12px]">
                        <span className="icon-tile"><I size={18} /></span>
                        <span className="flex-1 min-w-0"><span className="block font-semibold truncate">{b.serviceTitle}</span>
                          <span className="block text-[14.5px] text-muted">{b.providerName} · {b.scheduledDate ? dateTime(b.scheduledDate) : 'No date requested'}</span></span>
                        <StatusBadge status={b.status} />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
        </section>
        <section className="card p-6">
          <h2 className="text-[22px]">Your communities</h2>
          <div className="space-y-2.5 mt-4">
            {(joined.length ? joined : []).slice(0, 2).map(c => (
              <Link key={c.id} to={`/dashboard/community/${c.id}`} className="block rounded-[14px] bg-[#F5F8FC] px-4 py-3 hover:bg-canvas">
                <p className="font-semibold text-[16.5px]">{c.originCountry} → {c.destinationCountry}</p>
                <p className="text-[14px] text-muted">{c.postCount} posts · {c.memberCount} members</p>
              </Link>
            ))}
            {communities.data && joined.length === 0 && <p className="text-muted">You haven&apos;t joined a community yet.</p>}
          </div>
          <Link to="/dashboard/community" className="link inline-block mt-4">Browse communities →</Link>
        </section>
      </div>

      {(recs.data?.length > 0 || !recs.data) && !recs.error && (
        <section>
          <div className="flex items-end justify-between gap-3 mt-4 mb-4">
            <h2 className="text-[26px]">Recommended for you <span className="text-[14.5px] font-sans tracking-normal text-muted">· AI-assisted, based on your destination and status</span></h2>
            <Link to="/dashboard/services?tab=for-you" className="link shrink-0">See all</Link>
          </div>
          <div className="flex md:grid md:grid-cols-3 gap-4 overflow-x-auto snap-x -mx-4 px-4 md:mx-0 md:px-0 pb-1">
            {!recs.data ? [1, 2, 3].map(i => <div key={i} className="card h-[300px] min-w-[260px] skeleton" />) : recs.data.slice(0, 3).map(r => (
              <article key={r.serviceId} className="card overflow-hidden flex flex-col min-w-[260px] snap-start">
                <Link to={`/dashboard/services/${r.serviceId}`} className="group flex-1">
                  <div className="h-[120px] overflow-hidden"><img src={coverFor(r.destinationCountry)} alt="" className="zoom-img w-full h-full object-cover" /></div>
                  <div className="p-4">
                    <p className="text-[13.5px] text-muted">{categoryLabel(r.category)} · USD {money(r.price)}</p>
                    <h3 className="text-[18px] leading-snug mt-1 line-clamp-2">{r.serviceTitle}</h3>
                    <p className="text-[14.5px] text-electric mt-2 line-clamp-2">{r.matchReason}</p>
                  </div>
                </Link>
                <div className="px-4 pb-4"><button type="button" onClick={() => setExplain(r)} className="btn-ghost w-full h-9">Why this?</button></div>
              </article>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-[26px] mt-4 mb-4">AI tools</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {AI_TOOLS.map(([to, I, t, d]) => (
            <Link key={to} to={to} className="card-hover p-4 flex items-center gap-3">
              <span className="icon-tile bg-electric-50"><I size={18} /></span>
              <span><span className="block font-semibold">{t}</span><span className="block text-[14px] text-muted">{d}</span></span>
            </Link>
          ))}
        </div>
      </section>

      {reviewing && <ReviewModal booking={reviewing} onClose={() => setReviewing(null)}
        onDone={() => setBookings(bs => bs.map(b => (b.id === reviewing.id ? { ...b, hasReview: true } : b)))} />}
      {explain && <ExplainDrawer rec={explain} onClose={() => setExplain(null)} />}
    </div>
  );
}

/* ── Service provider (Helper) ─────────────────────────── */
function ProviderOverview({ user }) {
  const [incoming, setIncoming] = useState(null);
  const [busy, setBusy] = useState(null);
  const services = useLoad(() => servicesApi.getByProvider(user.id).then(r => r.data.data || []), [user.id]);
  const reviews = useLoad(() => reviewsApi.getByProvider(user.id).then(r => r.data.data || []), [user.id]);
  const sos = useLoad(() => sosApi.getActive().then(r => r.data.data || []), []);
  const kyc = useLoad(() => kycApi.getStatus().then(r => r.data.data).catch(e => (e.response?.status === 404 ? null : Promise.reject(e))), []);

  useEffect(() => {
    bookingsApi.getIncoming().then(r => setIncoming(r.data.data || [])).catch(err => { setIncoming([]); toast.error(apiErrorMessage(err, 'Could not load requests.')); });
  }, []);

  const act = async (b, status) => {
    setBusy(b.id);
    try {
      const res = await bookingsApi.updateStatus(b.id, status);
      setIncoming(list => list.map(x => (x.id === b.id ? res.data.data : x)));
      toast.success(status === BOOKING_STATUS.Accepted ? 'Booking accepted.' : 'Booking declined.');
    } catch (err) { toast.error(apiErrorMessage(err, 'Could not update the booking.')); } finally { setBusy(null); }
  };

  const list = incoming || [];
  const requested = list.filter(b => b.status === BOOKING_STATUS.Requested);
  const progress = list.filter(b => [BOOKING_STATUS.Accepted, BOOKING_STATUS.InProgress].includes(b.status));
  const verified = user.isKycVerified;
  const active = sos.data || [];

  return (
    <div className="space-y-5">
      <Hero image={IMG.sunsetHiker} overlay="bg-gradient-to-r from-navy/90 via-navy/60 to-navy/20"
        action={verified ? <ArrowLink to="/dashboard/services/new">List a new service</ArrowLink> : <ArrowLink to="/dashboard/kyc">Verify your identity</ArrowLink>}>
        <h1 className="display text-white text-[40px] md:text-[48px]">Hi {firstName(user.fullName)}</h1>
        <p className="text-[17px] text-white/90 mt-1">
          {verified ? <><BadgeCheck size={17} className="inline -mt-1 mr-1" />Identity verified</> : 'Not verified yet'} · Service provider{user.destinationCountry ? ` in ${user.destinationCountry}` : ''}
        </p>
      </Hero>

      {!verified && (
        <div className="card p-5 flex flex-wrap items-center gap-4">
          <span className="icon-tile"><IdCard size={18} /></span>
          <div className="flex-1 min-w-[220px]">
            <p className="font-semibold">{kyc.data?.status === 'Pending' || kyc.data?.status === 'UnderReview' ? `Verification submitted ${shortDate(kyc.data.submittedAt)} — usually 1–2 business days` : kyc.data?.status === 'Rejected' ? 'Your verification was declined' : 'Verify your identity to publish services'}</p>
            <p className="text-muted text-[14.5px]">{kyc.data?.status === 'Rejected' ? `Reason: ${kyc.data.rejectionReason}` : 'Migrants only see services from identity-verified providers.'}</p>
          </div>
          <Link to="/dashboard/kyc" className="btn-ink">{kyc.data?.status === 'Rejected' ? 'Resubmit documents' : 'Open verification'}</Link>
        </div>
      )}

      {active.length > 0 && (
        <Link to="/dashboard/sos" className="rounded-[18px] bg-navy text-white px-5 py-4 flex flex-wrap items-center gap-3 hover:bg-[#0A1D40]">
          <span className="w-4 h-4 rounded-full bg-sos ring-4 ring-sos/30" aria-hidden="true" />
          <span className="flex-1"><b>{active.length} active SOS alert{active.length > 1 ? 's' : ''}{user.destinationCountry ? ` in ${user.destinationCountry}` : ''}</b>
            <span className="text-white/75"> · newest {timeAgo(active[0].createdAt)}</span></span>
          <span className="font-semibold">Open SOS console →</span>
        </Link>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat highlight value={incoming && requested.length} label="New requests" />
        <Stat value={incoming && progress.length} label="In progress" />
        <Stat value={services.data?.length} label="Active services" />
        <Stat value={user.averageRating > 0 ? user.averageRating : '—'} label={`Average rating · ${reviews.data?.length ?? 0} reviews`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.45fr_1fr] gap-5 items-start">
        <section className="card p-6">
          <div className="flex items-center justify-between"><h2 className="text-[22px]">New requests</h2><Link to="/dashboard/bookings" className="link text-[15px]">All requests</Link></div>
          {incoming === null ? <div className="space-y-3 mt-4">{[1, 2].map(i => <div key={i} className="skeleton h-16" />)}</div>
            : requested.length === 0 ? <p className="text-muted mt-4">No new requests. Make sure your services are active.</p> : (
              <ul className="mt-2">
                {requested.slice(0, 5).map(b => (
                  <li key={b.id} className="flex flex-wrap items-center gap-4 py-4 border-b border-line last:border-0">
                    <Avatar name={b.migrantName} size={42} />
                    <Link to={`/dashboard/bookings/${b.id}`} className="flex-1 min-w-[200px]">
                      <p><b className="text-[16.5px]">{b.migrantName}</b> <span className="text-muted text-[14px]">· {b.serviceTitle}</span></p>
                      <p className="text-[14px] text-muted">{b.scheduledDate ? dateTime(b.scheduledDate) : 'No date requested'}</p>
                      {b.notes && <p className="text-[15px] line-clamp-2">“{b.notes}”</p>}
                    </Link>
                    <div className="flex gap-2">
                      {bookingActions(b, { isProvider: true }).map(a => (
                        <button key={a.status} type="button" disabled={busy === b.id} onClick={() => act(b, a.status)}
                          className={a.primary ? 'btn-accent btn-sm' : 'btn-ghost btn-sm'}>{a.label}</button>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            )}
        </section>
        <section className="card p-6">
          <h2 className="text-[22px]">Latest reviews</h2>
          <div className="space-y-2.5 mt-4">
            {(reviews.data || []).slice(0, 2).map(r => (
              <div key={r.id} className="rounded-[14px] bg-[#F5F8FC] px-4 py-3">
                <Stars value={r.rating} />
                {r.comment && <p className="mt-1.5 line-clamp-2">“{r.comment}”</p>}
                <p className="text-[13.5px] text-muted mt-1">{r.reviewerName} · {shortDate(r.createdAt)}</p>
              </div>
            ))}
            {reviews.data?.length === 0 && <p className="text-muted">Reviews appear after migrants complete bookings with you.</p>}
          </div>
          <Link to="/dashboard/reviews" className="link inline-block mt-4">All reviews →</Link>
        </section>
      </div>
    </div>
  );
}

/* ── Staff (Agency + Admin) ────────────────────────────── */
function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}
const daysSince = (d) => Math.max(0, Math.floor((Date.now() - new Date(d)) / 86400000));

function StaffOverview({ user }) {
  const isAgency = user.role === 'Agency';
  const kyc = useLoad(() => kycApi.getPending().then(r => r.data.data || []), []);
  const flags = useLoad(() => adminApi.getFraudFlags().then(r => r.data.data || []), []);
  const listings = useLoad(() => servicesApi.getAll({ page: 1, pageSize: 1 }).then(r => r.data.data?.totalCount ?? 0), []);
  const sos = useLoad(() => (isAgency ? sosApi.getActive().then(r => r.data.data || []) : Promise.resolve(null)), [isAgency]);
  const pending = kyc.data || [];

  return (
    <div className="space-y-5">
      <Hero image={IMG.securityOfficer} overlay="bg-gradient-to-r from-navy via-navy/90 to-navy/30">
        <p className="text-[12.5px] font-semibold uppercase tracking-label text-white/70">LandEase staff · {isAgency ? 'Agency' : 'Admin'}</p>
        <h1 className="display text-white text-[40px] md:text-[48px] mt-2">{greeting()}, {firstName(user.fullName)}</h1>
        <p className="text-[17px] text-white/90 mt-1">Here&apos;s what needs attention today.</p>
      </Hero>

      <div className={`grid grid-cols-2 ${isAgency ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-4`}>
        <Stat highlight value={kyc.data && (pending.length >= 200 ? '200+' : pending.length)} label="KYC reviews waiting"
          sub={pending[0] ? `Oldest: ${daysSince(pending[0].submittedAt)} days` : undefined} />
        {isAgency && <Stat value={sos.data?.length} dot={sos.data?.length > 0} label={`Active SOS${user.destinationCountry ? ` in ${user.destinationCountry}` : ''}`} />}
        <Stat value={flags.data?.length} label="Unresolved fraud flags" />
        <Stat value={listings.data} label="Active listings" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.45fr_1fr] gap-5 items-start">
        <section className="card p-6">
          <div className="flex items-center justify-between"><h2 className="text-[22px]">Oldest KYC submissions</h2><Link to="/dashboard/admin/kyc" className="link text-[15px]">Review queue</Link></div>
          {kyc.error ? <p className="text-sos mt-4">{kyc.error}</p> : !kyc.data ? <div className="space-y-3 mt-4">{[1, 2, 3].map(i => <div key={i} className="skeleton h-12" />)}</div>
            : pending.length === 0 ? <p className="text-muted mt-4">No submissions waiting.</p> : (
              <ul className="mt-2">
                {pending.slice(0, 5).map(k => (
                  <li key={k.id} className="flex items-center gap-3 py-3 border-b border-line last:border-0">
                    <Avatar name={k.userFullName} size={38} />
                    <div className="flex-1 min-w-0"><p className="font-semibold truncate">{k.userFullName}</p><p className="text-[14px] text-muted">Submitted {shortDate(k.submittedAt)}</p></div>
                    <span className={daysSince(k.submittedAt) >= 2 ? 'badge-requested' : 'badge-cancelled'}>{daysSince(k.submittedAt) === 0 ? 'Waiting since today' : `Waiting ${daysSince(k.submittedAt)} day${daysSince(k.submittedAt) === 1 ? '' : 's'}`}</span>
                  </li>
                ))}
              </ul>
            )}
        </section>
        <section className="card p-6">
          <h2 className="text-[22px]">Quick actions</h2>
          <div className="space-y-2.5 mt-4">
            <Link to="/dashboard/admin/moderation" className="btn-ghost w-full justify-start h-12 px-5">Check text for policy issues</Link>
            <Link to="/dashboard/admin/listings" className="btn-ghost w-full justify-start h-12 px-5">Review listings</Link>
            {isAgency && <Link to="/dashboard/sos" className="btn-ghost w-full justify-start h-12 px-5">Open SOS console</Link>}
            {!isAgency && <Link to="/dashboard/admin/users" className="btn-ghost w-full justify-start h-12 px-5">Users &amp; roles</Link>}
          </div>
          <p className="note mt-4 border border-dashed border-[#BBD3EE]">Platform metrics (sign-ups, bookings per week) need a reporting endpoint — backend gap G07.</p>
        </section>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  if (!user) return null;
  if (user.role === 'Migrant') return <MigrantOverview user={user} />;
  if (user.role === 'Helper') return <ProviderOverview user={user} />;
  return <StaffOverview user={user} />;
}
