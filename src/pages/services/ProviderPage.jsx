import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ChevronRight, BadgeCheck } from 'lucide-react';
import { servicesApi, reviewsApi } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';
import { apiErrorMessage } from '../../lib/apiError';
import { categoryLabel } from '../../lib/enums';
import { coverFor } from '../../lib/media';
import { money } from '../../lib/format';
import { Avatar, ErrorState, PageSpinner, ServiceCard } from '../../components/ui';
import { RatingSummary, ReviewList } from '../../components/reviews';

export default function ProviderPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const base = user ? '/dashboard' : '';
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') === 'reviews' ? 'reviews' : 'services';
  const [services, setServices] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const [s, r] = await Promise.all([servicesApi.getByProvider(id), reviewsApi.getByProvider(id)]);
        if (alive) { setServices(s.data.data || []); setReviews(r.data.data || []); }
      } catch (err) { if (alive) setError(apiErrorMessage(err, 'Could not load this provider.')); }
      finally { if (alive) setLoading(false); }
    })();
    return () => { alive = false; };
  }, [id]);

  if (loading) return <PageSpinner />;
  const wrap = user ? 'pt-2' : 'container-x pt-6';
  if (error) return <div className={wrap}><ErrorState message={error} /></div>;

  // Provider details come from their listings (no public provider endpoint yet — backend gap G01).
  const p = services[0];
  const name = p?.providerName || 'Provider';
  const avg = p?.providerRating || (reviews.length ? reviews.reduce((a, r) => a + r.rating, 0) / reviews.length : 0);
  const categories = [...new Set(services.map(s => s.category))];

  return (
    <div className={wrap}>
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[14.5px] text-muted">
        <Link to={`${base}/services`} className="hover:text-ink">Explore services</Link><ChevronRight size={14} /><span className="text-ink font-medium">Provider</span>
      </nav>

      <section className="card mt-4 overflow-hidden">
        <img src={coverFor(p?.destinationCountry)} alt="" className="w-full h-[150px] md:h-[200px] object-cover" />
        <div className="px-6 md:px-8 pb-6 pt-3 flex flex-col md:flex-row md:items-start gap-4">
          <span className="rounded-full border-4 border-white shadow-pill w-fit -mt-14 shrink-0"><Avatar name={name} size={96} /></span>
          <div className="flex-1">
            <h1 className="display text-[34px] md:text-[40px]">{name}</h1>
            <p className="flex flex-wrap gap-x-4 text-[15px] text-muted mt-1">
              {p?.providerIsKycVerified && <span className="text-electric font-medium inline-flex items-center gap-1"><BadgeCheck size={15} />Identity verified</span>}
              {avg > 0 && <span>★ {Number(avg).toFixed(1)} average</span>}<span>{reviews.length} review{reviews.length === 1 ? '' : 's'}</span>
            </p>
          </div>
          <p className="text-[13px] text-muted md:max-w-[280px]">Bio, languages and member-since aren&apos;t stored yet (backend gap G01).</p>
        </div>
      </section>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5">
        <div className="card p-5"><p className="text-[14px] font-medium">Active services</p><p className="numeral text-[36px] mt-2">{services.length}</p></div>
        <div className="rounded-card p-5 bg-electric text-white"><p className="text-[14px] font-medium">Average rating</p><p className="numeral text-[36px] mt-2">{avg ? Number(avg).toFixed(1) : '—'}</p></div>
        <div className="card p-5"><p className="text-[14px] font-medium">Reviews</p><p className="numeral text-[36px] mt-2">{reviews.length}</p></div>
        <div className="card p-5"><p className="text-[14px] font-medium">Categories</p>
          <div className="flex flex-wrap gap-1.5 mt-3">{categories.length ? categories.map(c => <span key={c} className="badge-progress">{categoryLabel(c)}</span>) : <span className="text-muted">—</span>}</div></div>
      </div>

      <div role="tablist" className="flex gap-6 border-b border-line mt-8">
        {[['services', `Services (${services.length})`], ['reviews', `Reviews (${reviews.length})`]].map(([k, l]) => (
          <button key={k} type="button" role="tab" aria-selected={tab === k} className="tab"
            onClick={() => setParams(k === 'reviews' ? { tab: 'reviews' } : {}, { replace: true })}>{l}</button>
        ))}
      </div>

      <div className="mt-6">
        {tab === 'services' ? (
          services.length === 0 ? <p className="text-muted">This provider has no active services.</p> : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {services.map(s => (
                <ServiceCard key={s.id} service={s} to={`${base}/services/${s.id}`}
                  eyebrow={`${categoryLabel(s.category)} · ${s.destinationCountry}`} meta={<span />}
                  footer={<p className="px-5 pb-5"><span className="text-[12px] font-medium mr-1">USD</span><span className="font-display text-[22px] tracking-[-0.04em]">{money(s.price)}</span></p>} />
              ))}
            </div>
          )
        ) : (
          <div className="card p-6 max-w-[780px]">
            {reviews.length === 0 ? <p className="text-muted">No reviews yet.</p> : (
              <><div className="pb-4 border-b border-line"><RatingSummary reviews={reviews} average={avg || undefined} /></div><ReviewList reviews={reviews} initial={10} /></>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
