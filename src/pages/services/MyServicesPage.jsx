import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';
import { servicesApi, bookingsApi } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';
import { apiErrorMessage } from '../../lib/apiError';
import { BOOKING_STATUS as S, categoryLabel } from '../../lib/enums';
import { coverFor } from '../../lib/media';
import { money, shortDate } from '../../lib/format';
import { ErrorState } from '../../components/ui';
import { ConfirmDialog } from '../../components/reviews';

const OPEN = [S.Requested, S.Accepted, S.InProgress];

export default function MyServicesPage() {
  const { user } = useAuth();
  const [services, setServices] = useState(null);
  const [openCounts, setOpenCounts] = useState({});
  const [error, setError] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // Only active listings are returned (deactivated ones can't be listed yet — backend gap G03).
    servicesApi.getByProvider(user.id).then(r => setServices(r.data.data || [])).catch(err => setError(apiErrorMessage(err, 'Could not load your services.')));
    bookingsApi.getIncoming().then(r => {
      const counts = {};
      (r.data.data || []).filter(b => OPEN.includes(b.status)).forEach(b => { counts[b.serviceId] = (counts[b.serviceId] || 0) + 1; });
      setOpenCounts(counts);
    }).catch(() => {});
  }, [user.id]);

  const deactivate = async () => {
    setBusy(true);
    try {
      await servicesApi.delete(confirm.id);
      setServices(list => list.filter(s => s.id !== confirm.id));
      toast.success('Service deactivated.');
    } catch (err) { toast.error(apiErrorMessage(err, 'Could not deactivate this service.')); } finally { setBusy(false); setConfirm(null); }
  };

  const verified = user.isKycVerified;
  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><h1 className="page-title">My services</h1><p className="page-sub text-[17px]">{services ? `${services.length} active · visible to migrants in Explore.` : 'Your listings'}</p></div>
        {verified && <Link to="/dashboard/services/new" className="btn-ink">List a new service</Link>}
      </div>
      {!verified && (
        <div className="card p-4 mt-5 flex flex-wrap items-center gap-3" role="note">
          <span className="icon-tile bg-[#FFF4E0] text-[#9A5B00]"><ShieldAlert size={18} /></span>
          <p className="flex-1 min-w-[220px]">Verify your identity to start listing services.</p>
          <Link to="/dashboard/kyc" className="btn-ink">Verify your identity</Link>
        </div>
      )}
      <div className="mt-6">
        {error ? <ErrorState message={error} /> : services === null ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">{[1, 2].map(i => <div key={i} className="card h-[340px] skeleton" />)}</div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {services.map(s => (
              <article key={s.id} className="card overflow-hidden flex flex-col">
                <div className="relative h-[150px]"><img src={coverFor(s.destinationCountry)} alt="" className="w-full h-full object-cover" />
                  <span className="absolute top-3 left-3 badge-completed h-7 px-3">Active</span></div>
                <div className="p-5 flex-1">
                  <p className="text-[14px] text-muted font-medium">{categoryLabel(s.category)} · {s.destinationCountry}</p>
                  <h2 className="text-[20px] leading-snug mt-1">{s.title}</h2>
                  <p className="text-[14.5px] text-muted mt-2 flex flex-wrap gap-x-4"><b className="text-ink">USD {money(s.price)}</b>
                    <Link to={`/dashboard/bookings`} className="hover:text-ink">{openCounts[s.id] || 0} open booking{openCounts[s.id] === 1 ? '' : 's'}</Link><span>Listed {shortDate(s.createdAt)}</span></p>
                </div>
                <div className="border-t border-line px-5 py-3.5 flex items-center gap-2">
                  <Link to={`/dashboard/services/${s.id}/edit`} className="btn-ghost btn-sm">Edit</Link>
                  <Link to={`/dashboard/services/${s.id}`} className="btn-ghost btn-sm">Preview</Link>
                  <button type="button" onClick={() => setConfirm(s)} className="btn-ghost btn-sm text-sos ml-auto">Deactivate</button>
                </div>
              </article>
            ))}
            {verified ? (
              <Link to="/dashboard/services/new" className="rounded-card border border-dashed border-[#C3CCD8] min-h-[300px] flex flex-col items-center justify-center text-center hover:bg-white/60">
                <span className="w-12 h-12 rounded-full bg-electric-50 text-electric inline-flex items-center justify-center"><Plus size={20} /></span>
                <span className="font-semibold text-[17px] mt-3">{services.length ? 'List another service' : 'List your first service'}</span><span className="text-muted text-[14.5px]">Takes about two minutes</span>
              </Link>
            ) : services.length === 0 && <p className="text-muted">You haven&apos;t listed any services yet.</p>}
          </div>
        )}
      </div>
      {confirm && <ConfirmDialog title={`Deactivate “${confirm.title}”?`} body="It will disappear from Explore and can't be restored from LandEase yet. Open bookings are not cancelled." confirmLabel="Deactivate" busy={busy} onConfirm={deactivate} onCancel={() => setConfirm(null)} />}
    </div>
  );
}
