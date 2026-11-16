import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { communityApi } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';
import { apiErrorMessage } from '../../lib/apiError';
import { IMG } from '../../lib/media';
import { EmptyState, ErrorState } from '../../components/ui';

const norm = (s = '') => s.toLowerCase().replace(/^uk$/, 'united kingdom').replace(/^usa?$/, 'united states');

function Corridor({ c, className = '' }) {
  return <span className={className}>{c.originCountry} <span className="text-twotone font-normal">→</span> {c.destinationCountry}</span>;
}

export default function CommunityPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const base = user ? '/dashboard' : '';
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState(null);

  // ~20 seeded corridors: load all once and filter locally (the API has no search parameter).
  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await communityApi.getAll({ page: 1, pageSize: 100 });
      setCommunities(res.data.data?.items || []);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not load communities.'));
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const origins = useMemo(() => [...new Set(communities.map(c => c.originCountry))].sort(), [communities]);
  const destinations = useMemo(() => [...new Set(communities.map(c => c.destinationCountry))].sort(), [communities]);
  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return communities.filter(c => (!from || c.originCountry === from) && (!to || c.destinationCountry === to)
      && (!q || [c.name, c.description, c.originCountry, c.destinationCountry].some(v => v?.toLowerCase().includes(q))));
  }, [communities, from, to, search]);
  const joined = communities.filter(c => c.isMember);
  const suggested = user ? communities.filter(c => !c.isMember
    && (norm(c.originCountry) === norm(user.originCountry) || norm(c.destinationCountry) === norm(user.destinationCountry))).slice(0, 3) : [];

  const join = async (c) => {
    if (!user) { navigate(`/login?next=${encodeURIComponent(`/dashboard/community/${c.id}`)}`); return; }
    setBusyId(c.id);
    setCommunities(list => list.map(x => (x.id === c.id ? { ...x, isMember: true, memberCount: x.memberCount + 1 } : x)));
    try {
      await communityApi.join(c.id);
      toast.success(`Joined ${c.name}`);
    } catch (err) {
      setCommunities(list => list.map(x => (x.id === c.id ? c : x)));
      toast.error(apiErrorMessage(err, 'Could not join.'));
    } finally { setBusyId(null); }
  };

  const card = (c) => (
    <div key={c.id} className="card-hover p-5 flex flex-col">
      <Link to={`${base}/community/${c.id}`} className="font-display text-[22px] tracking-[-0.03em] hover:underline"><Corridor c={c} /></Link>
      <p className="text-muted text-[15px] mt-2 line-clamp-2 flex-1">{c.description}</p>
      <div className="flex items-center justify-between mt-4">
        <span className="text-[14px] text-muted">{c.memberCount} members <span className="ml-3">{c.postCount} posts</span></span>
        {c.isMember ? <Link to={`${base}/community/${c.id}`} className="badge-completed h-8 px-3.5">Joined</Link>
          : <button type="button" onClick={() => join(c)} disabled={busyId === c.id} className="btn-ghost h-9 px-4 text-[15px] bg-white">Join</button>}
      </div>
    </div>
  );

  return (
    <div className={user ? '' : 'container-x pt-6'}>
      <section className="grid grid-cols-1 lg:grid-cols-[1.25fr_1fr] gap-5">
        <div className="card p-8 md:p-10 flex flex-col justify-center">
          <p className="overline text-[12px]">Corridor communities</p>
          <h1 className="h2-two text-[40px] md:text-[52px] mt-3">Find people on <span className="two">your migration corridor.</span></h1>
          <p className="text-muted text-[16.5px] mt-5 max-w-[520px]">Each community links one origin country to one destination. Anyone can read; join to post.</p>
        </div>
        <img src={IMG.kyotoStreet} alt="Evening street in Kyoto with a pagoda" className="rounded-media w-full h-[260px] lg:h-full object-cover" />
      </section>

      <div className="card p-3.5 mt-5 grid gap-3 md:grid-cols-[1fr_1fr_1.6fr]">
        <div><label htmlFor="c-from" className="label text-[13.5px]">From</label>
          <select id="c-from" className="input" value={from} onChange={e => setFrom(e.target.value)}><option value="">Any origin</option>{origins.map(o => <option key={o}>{o}</option>)}</select></div>
        <div><label htmlFor="c-to" className="label text-[13.5px]">To</label>
          <select id="c-to" className="input" value={to} onChange={e => setTo(e.target.value)}><option value="">Any destination</option>{destinations.map(o => <option key={o}>{o}</option>)}</select></div>
        <div><label htmlFor="c-q" className="label text-[13.5px]">Search</label>
          <input id="c-q" type="search" className="input" placeholder="Country or keyword" value={search} onChange={e => setSearch(e.target.value)} /></div>
      </div>

      {error ? <div className="mt-6"><ErrorState message={error} onRetry={load} /></div> : loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-8">{Array.from({ length: 6 }, (_, i) => <div key={i} className="card p-5 space-y-3"><div className="skeleton h-6 w-2/3" /><div className="skeleton h-4" /><div className="skeleton h-4 w-1/2" /></div>)}</div>
      ) : (
        <>
          {joined.length > 0 && (
            <section className="mt-8">
              <h2 className="text-[24px] mb-4">Your communities</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">{joined.map(card)}</div>
            </section>
          )}
          {suggested.length > 0 && (
            <section className="mt-8">
              <h2 className="text-[24px] mb-4">Suggested for you</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">{suggested.map(card)}</div>
            </section>
          )}
          <section className="mt-8">
            <div className="flex items-end justify-between mb-4"><h2 className="text-[24px]">All communities</h2><span className="text-[14px] text-muted">{visible.length} shown</span></div>
            {visible.length === 0 ? (
              <EmptyState icon={Users} title="No community for this corridor yet"
                action={user ? <Link to="/dashboard/ai-chat" className="btn-ghost">Ask the AI assistant</Link> : null}>
                LandEase staff add corridors. Try another origin or destination.
              </EmptyState>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">{visible.map(card)}</div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
