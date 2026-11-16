import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BadgeCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { servicesApi } from '../../api/endpoints';
import { apiErrorMessage } from '../../lib/apiError';
import { categoryLabel } from '../../lib/enums';
import { money } from '../../lib/format';
import { ErrorState } from '../../components/ui';
import { ConfirmDialog } from '../../components/reviews';

export default function AdminListingsPage() {
  const [items, setItems] = useState(null);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState(null);
  const [q, setQ] = useState('');
  const [country, setCountry] = useState('');
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);

  // Up to 100 newest/highest-rated active listings; search filters title and provider locally.
  const load = useCallback(() => {
    setError(null);
    servicesApi.getAll({ page: 1, pageSize: 100 }).then(r => { setItems(r.data.data?.items || []); setTotal(r.data.data?.totalCount || 0); })
      .catch(err => setError(apiErrorMessage(err, 'Could not load listings.')));
  }, []);
  useEffect(() => { load(); }, [load]);

  const countries = useMemo(() => [...new Set((items || []).map(s => s.destinationCountry))].sort(), [items]);
  const shown = useMemo(() => {
    const s = q.trim().toLowerCase();
    return (items || []).filter(x => (!country || x.destinationCountry === country) && (!s || x.title.toLowerCase().includes(s) || x.providerName.toLowerCase().includes(s)));
  }, [items, q, country]);

  const deactivate = async () => {
    setBusy(true);
    try { await servicesApi.delete(confirm.id); setItems(l => l.filter(x => x.id !== confirm.id)); setTotal(t => t - 1); toast.success('Listing deactivated.'); }
    catch (err) { toast.error(apiErrorMessage(err, 'Could not deactivate this listing.')); } finally { setBusy(false); setConfirm(null); }
  };

  return (
    <div>
      <h1 className="page-title">Listings</h1>
      <p className="page-sub text-[17px]">All active services. Deactivate anything that breaks the rules.</p>
      <div className="card p-3.5 mt-6 grid md:grid-cols-[1.6fr_1fr] gap-3">
        <div><label htmlFor="l-q" className="label text-[14px]">Search</label><input id="l-q" type="search" className="input" placeholder="Title or provider" value={q} onChange={e => setQ(e.target.value)} /></div>
        <div><label htmlFor="l-c" className="label text-[14px]">Country</label>
          <select id="l-c" className="input" value={country} onChange={e => setCountry(e.target.value)}><option value="">All countries</option>{countries.map(c => <option key={c}>{c}</option>)}</select></div>
      </div>
      <div className="mt-5">
        {error ? <ErrorState message={error} onRetry={load} /> : items === null ? <div className="card h-72 skeleton" /> : (
          <div className="card overflow-x-auto">
            <table className="w-full text-left min-w-[760px]">
              <thead className="bg-[#F5F8FC] text-[14px] text-muted"><tr>
                {['Service', 'Provider', 'Category', 'Country', 'Price', 'Status'].map(h => <th key={h} className="font-medium px-4 py-3">{h}</th>)}<th className="px-4 py-3"><span className="sr-only">Action</span></th></tr></thead>
              <tbody>
                {shown.length === 0 ? <tr><td colSpan={7} className="px-4 py-10 text-center text-muted">No listings match.</td></tr> : shown.map(s => (
                  <tr key={s.id} className="border-t border-line">
                    <td className="px-4 py-3 font-semibold max-w-[280px]"><Link to={`/dashboard/services/${s.id}`} className="hover:underline">{s.title}</Link></td>
                    <td className="px-4 py-3 whitespace-nowrap"><Link to={`/dashboard/providers/${s.providerId}`} className="hover:underline">{s.providerName}</Link>{s.providerIsKycVerified && <BadgeCheck size={15} className="inline ml-1 text-electric" aria-label="Verified" />}</td>
                    <td className="px-4 py-3">{categoryLabel(s.category)}</td>
                    <td className="px-4 py-3">{s.destinationCountry}</td>
                    <td className="px-4 py-3 whitespace-nowrap">USD {money(s.price)}</td>
                    <td className="px-4 py-3"><span className="badge-completed">Active</span></td>
                    <td className="px-4 py-3 text-right"><button type="button" onClick={() => setConfirm(s)} className="btn-ghost btn-sm text-sos">Deactivate</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {items && <p className="text-[14px] text-muted mt-3">Showing {shown.length} of {total} listing{total === 1 ? '' : 's'}. Reactivation and reported-content queues need backend work (G03, G09).</p>}
      </div>
      {confirm && <ConfirmDialog title={`Deactivate “${confirm.title}” by ${confirm.providerName}?`} body="It will disappear from search. This can't be undone in the app yet." confirmLabel="Deactivate" busy={busy} onConfirm={deactivate} onCancel={() => setConfirm(null)} />}
    </div>
  );
}
