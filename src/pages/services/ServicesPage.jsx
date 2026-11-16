import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Sparkles, Briefcase } from 'lucide-react';
import toast from 'react-hot-toast';
import { servicesApi } from '../../api/endpoints';
import { getRecommendations } from '../../lib/recommendations';
import ExplainDrawer from '../../components/ExplainDrawer';
import { useAuth } from '../../context/AuthContext';
import { apiErrorMessage } from '../../lib/apiError';
import { SERVICE_CATEGORIES } from '../../lib/enums';
import { money } from '../../lib/format';
import { ArrowLink, EmptyState, ErrorState, Pagination, ServiceCard, ServiceCardSkeleton, Verified } from '../../components/ui';

const COUNTRIES = ['Australia', 'Canada', 'United Kingdom', 'New Zealand', 'Germany', 'Japan', 'United States', 'Portugal'];
const PAGE_SIZE = 9;

function InAppFooter({ s }) {
  return (
    <div className="border-t border-line px-5 py-3.5 flex items-center justify-between">
      <span className="text-[14.5px] text-muted">{s.destinationCountry}</span>
      <span><span className="text-[12px] font-medium mr-1">USD</span><span className="font-display text-[22px] tracking-[-0.04em]">{money(s.price)}</span></span>
    </div>
  );
}

function ProviderLine({ s }) {
  return (
    <p className="text-[14.5px] text-muted mt-1.5 flex flex-wrap items-center gap-x-1.5">
      {s.providerName}{s.providerIsKycVerified && <>· <Verified /></>}{s.providerRating > 0 && <>· ★ {s.providerRating}</>}
    </p>
  );
}

export default function ServicesPage() {
  const { user } = useAuth();
  const inApp = Boolean(user);
  const base = inApp ? '/dashboard' : '';
  const isMigrant = user?.role === 'Migrant';
  const [params, setParams] = useSearchParams();

  const searchTerm = params.get('searchTerm') || '';
  const category = params.get('category') || '';
  // Migrants see their own destination first unless they chose another filter (design: "Showing services for your destination first").
  const destinationCountry = params.has('destinationCountry') ? params.get('destinationCountry') : (isMigrant ? user.destinationCountry || '' : '');
  const maxPrice = params.get('maxPrice') || '';
  const page = Number(params.get('page')) || 1;
  const tab = isMigrant && params.get('tab') === 'for-you' ? 'for-you' : 'all';

  const [keyword, setKeyword] = useState(searchTerm);
  const [data, setData] = useState({ items: [], totalCount: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reload, setReload] = useState(0);
  const [recs, setRecs] = useState(null);
  const [recError, setRecError] = useState(null);
  const [explain, setExplain] = useState(null);

  const update = (patch) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => (v === '' || v == null ? next.delete(k) : next.set(k, v)));
    if (!('page' in patch)) next.delete('page');
    setParams(next, { replace: true });
  };

  // Debounce the keyword into the URL.
  useEffect(() => {
    const t = setTimeout(() => { if (keyword.trim() !== searchTerm) update({ searchTerm: keyword.trim() }); }, 300);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyword]);

  useEffect(() => {
    if (tab !== 'all') return undefined;
    let alive = true;
    setLoading(true); setError(null);
    const q = { page, pageSize: PAGE_SIZE };
    if (searchTerm) q.searchTerm = searchTerm;
    if (category) q.category = category;
    if (destinationCountry) q.destinationCountry = destinationCountry;
    if (maxPrice) q.maxPrice = maxPrice;
    servicesApi.getAll(q)
      .then(r => alive && setData(r.data.data || { items: [] }))
      .catch(err => alive && setError(apiErrorMessage(err, 'Could not load services.')))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [searchTerm, category, destinationCountry, maxPrice, page, tab, reload]);

  useEffect(() => {
    if (tab !== 'for-you' || recError) return;
    getRecommendations().then(setRecs)
      .catch(err => { setRecError(apiErrorMessage(err, 'Could not load recommendations.')); toast.error(apiErrorMessage(err)); });
  }, [tab, recError]);

  const hasFilters = Boolean(searchTerm || category || maxPrice || params.has('destinationCountry'));
  const countries = useMemo(() => (destinationCountry && !COUNTRIES.includes(destinationCountry) ? [destinationCountry, ...COUNTRIES] : COUNTRIES), [destinationCountry]);

  const cardFor = (s) => inApp
    ? <ServiceCard key={s.id} service={s} to={`${base}/services/${s.id}`} meta={<ProviderLine s={s} />} footer={<InAppFooter s={s} />} />
    : <ServiceCard key={s.id} service={s} to={`/services/${s.id}`} />;

  return (
    <div className={inApp ? '' : 'container-x pt-12'}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className={inApp ? 'page-title' : 'display text-[44px] md:text-[56px]'}>Explore services</h1>
          <p className="text-muted text-[17px] mt-2">
            {inApp && isMigrant && destinationCountry && !params.has('destinationCountry')
              ? <>Showing services for your destination first · <b className="text-ink font-semibold">{destinationCountry}</b></>
              : <><b className="text-ink font-semibold">{data.totalCount ?? 0} services</b> · Sorted by provider rating</>}
          </p>
        </div>
        {isMigrant && (
          <div className="seg shadow-pill border-0" role="group" aria-label="View">
            <button type="button" aria-pressed={tab === 'all'} onClick={() => update({ tab: '' })}>All services</button>
            <button type="button" aria-pressed={tab === 'for-you'} onClick={() => update({ tab: 'for-you' })}><Sparkles size={13} className="inline -mt-0.5 mr-1" />For you</button>
          </div>
        )}
      </div>

      {tab === 'all' && (
        <>
          <div className="card mt-6 p-3.5 grid gap-3 md:grid-cols-[1.6fr_1fr_1fr_auto] items-end">
            <div>
              <label htmlFor="f-keyword" className="label text-[13.5px]">Keyword</label>
              <div className="relative">
                {!inApp && <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />}
                <input id="f-keyword" type="search" className={`input ${inApp ? '' : 'pl-11'}`} placeholder="Search title or description"
                  value={keyword} onChange={e => setKeyword(e.target.value)} />
              </div>
            </div>
            <div>
              <label htmlFor="f-country" className="label text-[13.5px]">{inApp ? 'Destination' : 'Destination country'}</label>
              <select id="f-country" className="input" value={destinationCountry} onChange={e => update({ destinationCountry: e.target.value })}>
                <option value="">Any country</option>
                {countries.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="f-price" className="label text-[13.5px]">Max price (USD)</label>
              <input id="f-price" type="number" min="0" inputMode="decimal" className="input" placeholder="No limit"
                value={maxPrice} onChange={e => update({ maxPrice: e.target.value })} />
            </div>
            {!inApp && <button type="button" className="btn-ghost h-12 bg-white" disabled={!hasFilters} onClick={() => { setKeyword(''); setParams({}, { replace: true }); }}>Clear filters</button>}
          </div>

          <div className="flex gap-2 mt-5 overflow-x-auto pb-1 -mx-1 px-1" role="group" aria-label="Category">
            {[{ value: '', label: 'All' }, ...SERVICE_CATEGORIES].map(c => (
              <button key={c.value || 'all'} type="button" aria-pressed={category === c.value} onClick={() => update({ category: c.value })}
                className={`${category === c.value ? 'chip-active' : 'chip'} h-11 px-4 text-[15px] shrink-0`}>{c.label}</button>
            ))}
          </div>

          <div className="mt-6">
            {error ? <ErrorState message={error} onRetry={() => setReload(n => n + 1)} />
              : loading ? <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">{Array.from({ length: 6 }, (_, i) => <ServiceCardSkeleton key={i} />)}</div>
              : data.items?.length === 0 ? (
                <EmptyState icon={Briefcase} title={hasFilters ? 'No services match these filters' : 'No services listed yet'}
                  action={hasFilters ? <button type="button" className="btn-ghost" onClick={() => { setKeyword(''); setParams({}, { replace: true }); }}>Clear filters</button> : null}>
                  {hasFilters ? 'Try another category, a different country or a higher price limit.' : 'Providers are verifying their identity. Check back soon.'}
                </EmptyState>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {data.items.map(cardFor)}
                </div>
              )}
          </div>
          {!loading && !error && (
            <div className="mt-10"><Pagination page={page} totalPages={data.totalPages || 1} onPage={p => update({ page: String(p) })} /></div>
          )}
        </>
      )}

      {tab === 'for-you' && (
        <div className="mt-6">
          <p className="text-muted mb-5">AI-assisted, based on your destination and migration status.</p>
          {recError ? <ErrorState message={recError} onRetry={() => setRecError(null)} />
            : !recs ? <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">{Array.from({ length: 3 }, (_, i) => <ServiceCardSkeleton key={i} />)}</div>
            : recs.length === 0 ? (
              <EmptyState icon={Sparkles} title="No suggestions yet" action={<Link to="/dashboard/profile" className="btn-ghost">Update profile</Link>}>
                Add your destination country and migration status to get better suggestions.
              </EmptyState>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {recs.map(r => {
                  const s = { id: r.serviceId, title: r.serviceTitle, providerName: r.providerName, providerRating: r.providerRating, category: r.category, price: r.price, destinationCountry: r.destinationCountry };
                  return (
                    <ServiceCard key={r.serviceId} service={s} to={`/dashboard/services/${r.serviceId}`}
                      meta={<p className="text-[14.5px] text-electric mt-2 line-clamp-2">{r.matchReason}</p>} footer={<span />}
                      after={<div className="px-5 pb-5"><button type="button" className="btn-ghost w-full h-10" onClick={() => setExplain(r)}>Why this?</button></div>} />
                  );
                })}
              </div>
            )}
        </div>
      )}

      {!inApp && (
        <div className="mt-14 rounded-card bg-navy text-white p-7 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div><p className="font-display text-[26px] tracking-[-0.03em]">Know your city? Offer a service.</p><p className="text-white/80 mt-1">Verify your identity once, then list as many services as you like.</p></div>
          <ArrowLink to="/register?role=Helper">Become a provider</ArrowLink>
        </div>
      )}
      {inApp && !isMigrant && user?.role === 'Helper' && (
        <div className="mt-8"><Link to="/dashboard/services/new" className="btn-ink">List a service</Link></div>
      )}
      {explain && <ExplainDrawer rec={explain} onClose={() => setExplain(null)} />}
    </div>
  );
}
