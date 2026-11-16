import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight, ArrowUpRight, Search, ShieldCheck, ClipboardList, Users, Sparkles, Languages, Gauge, Camera, Siren,
  Lock, Info, Flag, Plus, X, Play, TriangleAlert, Star,
} from 'lucide-react';
import { servicesApi, communityApi } from '../api/endpoints';
import { PublicHeader, PublicFooter } from '../components/PublicLayout';
import { ArrowLink, Avatar, TwoTone } from '../components/ui';
import { SERVICE_CATEGORIES, categoryLabel } from '../lib/enums';
import { IMG, CATEGORY_ICONS, coverFor } from '../lib/media';
import { money } from '../lib/format';

const FEATURE_CHIPS = [
  [ShieldCheck, 'Identity-verified providers'], [ClipboardList, 'Bookings with clear status'], [Users, 'Corridor communities'],
  [Sparkles, 'AI assistant'], [Languages, 'Voice translator'], [Gauge, 'Profile strength check'], [Camera, 'Place recognition'], [Siren, 'SOS alerts'],
];

const FEATURES = [
  [ShieldCheck, 'Verified service providers', 'Every provider confirms their identity with LandEase staff before they can list a service.', '/how-it-works#providers', 'How verification works'],
  [ClipboardList, 'Bookings & reviews', 'Request a service, follow it from requested to completed, then leave an honest review.', '/services', 'Explore services'],
  [Users, 'Corridor communities', 'Groups that connect your origin and destination country. Ask questions, share what worked.', '/community', 'Find your corridor'],
  [Sparkles, 'AI assistant & translator', 'General answers about housing, banking and work, plus spoken translation in 16 languages.', '/tools', 'See the AI tools'],
  [Gauge, 'Profile-strength check', 'A general 0–100 indicator across education, work, language, finances and personal factors. Not a visa prediction.', '/tools#profile-strength', 'Learn what it measures'],
  [Siren, 'SOS emergency alerts', 'Alert registered responders in your destination country and see who is responding.', '/tools#sos', 'How SOS works'],
];

const COMMITMENTS = [
  [ShieldCheck, 'Identity checks for providers', 'No provider can publish a service until staff approve their documents.'],
  [Lock, 'Private document storage', 'ID documents sit in private storage; reviewers get links that expire after 15 minutes.'],
  [Info, 'No legal-advice claims', 'AI tools give general information and always show their limits.'],
  [Flag, 'Report concerns', 'Staff review flagged listings and can deactivate them.'],
];

const FAQ = [
  ['Is LandEase free for migrants?', 'Creating an account, browsing services and communities, and using the AI tools are free. Providers set their own prices for services, shown in USD on each listing.'],
  ['How are service providers verified?', 'Providers upload a government ID and a selfie holding it. LandEase staff review them by hand and only approved providers can publish services. Approved providers show a “Verified” badge.'],
  ['Is the AI assistant giving legal advice?', 'No. The assistant gives general information and always tells you to confirm requirements on the official government website or with a licensed immigration adviser.'],
  ['Who receives my SOS alert?', 'Registered service providers and agencies whose destination country matches yours. If nobody is registered there, LandEase tells you straight away so you can call local emergency services.'],
];

function useHomeData() {
  const [services, setServices] = useState([]);
  const [communities, setCommunities] = useState({ items: [], total: 0 });
  const [post, setPost] = useState(null);
  useEffect(() => {
    let alive = true;
    servicesApi.getAll({ page: 1, pageSize: 3 }).then(r => alive && setServices(r.data.data?.items || [])).catch(() => {});
    communityApi.getAll({ page: 1, pageSize: 100 }).then(async r => {
      const items = (r.data.data?.items || []).slice().sort((a, b) => b.memberCount - a.memberCount);
      if (!alive) return;
      setCommunities({ items, total: r.data.data?.totalCount ?? items.length });
      const withPosts = items.find(c => c.postCount > 0);
      if (withPosts) {
        const p = await communityApi.getPosts(withPosts.id, { page: 1, pageSize: 1 }).catch(() => null);
        const first = p?.data.data?.items?.[0];
        if (alive && first) setPost({ ...first, community: withPosts });
      }
    }).catch(() => {});
    return () => { alive = false; };
  }, []);
  return { services, communities, post };
}

function SearchBar() {
  const navigate = useNavigate();
  const [q, setQ] = useState({ searchTerm: '', category: '', destinationCountry: '' });
  const submit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams(Object.entries(q).filter(([, v]) => v.trim()));
    navigate(`/services${params.toString() ? `?${params}` : ''}`);
  };
  const seg = 'flex-1 px-6 py-3 text-left';
  return (
    <form onSubmit={submit} role="search" className="bg-white rounded-[22px] shadow-float p-2 flex flex-col md:flex-row md:items-center gap-1">
      <label className={`${seg} md:flex-[1.6]`}>
        <span className="block text-[13px] font-medium">Keyword</span>
        <input value={q.searchTerm} onChange={e => setQ({ ...q, searchTerm: e.target.value })} placeholder="e.g. rental help, bank account"
          className="w-full text-[15.5px] placeholder-muted outline-none bg-transparent" />
      </label>
      <label className={`${seg} md:border-l border-line`}>
        <span className="block text-[13px] font-medium">Category</span>
        <select value={q.category} onChange={e => setQ({ ...q, category: e.target.value })} className="w-full text-[15.5px] outline-none bg-transparent -ml-1">
          <option value="">All categories</option>
          {SERVICE_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </label>
      <label className={`${seg} md:border-l border-line`}>
        <span className="block text-[13px] font-medium">Destination country</span>
        <input value={q.destinationCountry} onChange={e => setQ({ ...q, destinationCountry: e.target.value })} placeholder="Any country"
          className="w-full text-[15.5px] placeholder-ink outline-none bg-transparent" />
      </label>
      <button type="submit" className="btn-ink h-14 px-7 rounded-[16px] text-[15.5px]"><Search size={18} aria-hidden="true" />Search services</button>
    </form>
  );
}

function Phone({ className = '', children }) {
  return (
    <div className={`absolute w-[220px] h-[470px] rounded-[38px] border-[7px] border-ink bg-white shadow-float overflow-hidden ${className}`}>{children}</div>
  );
}

function PhoneTrio() {
  return (
    <div className="relative h-[520px] max-w-[680px] mx-auto" aria-hidden="true">
      <div className="absolute inset-x-[-15%] bottom-0 h-[420px] rounded-t-full bg-[radial-gradient(ellipse_at_center,#DDEBFC_0%,rgba(237,242,248,0)_70%)]" />
      <Phone className="left-[2%] top-[70px] -rotate-6">
        <div className="p-4 text-[11px] space-y-3 bg-canvas h-full">
          <div className="flex justify-between bg-white rounded-full px-3 py-2 font-medium"><span>English</span><span className="text-electric">⇄</span><span>Japanese</span></div>
          <p className="bg-white rounded-[14px] p-3">Where is the nearest hospital?</p>
          <p className="bg-ink text-white rounded-[14px] p-3">一番近い病院はどこですか？</p>
          <span className="absolute bottom-10 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-electric" />
        </div>
      </Phone>
      <Phone className="left-[34%] top-0 z-10">
        <div className="relative h-[190px]"><img src={IMG.surfBeach} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/90" />
          <p className="absolute bottom-3 inset-x-0 text-center text-[12px]">Ready to settle in<br /><span className="font-display text-[19px] font-semibold">Melbourne!</span></p></div>
        <div className="p-3 space-y-3 text-[10.5px]">
          <p className="border border-line rounded-full px-3 py-2 text-muted">Ask about housing, banking, visas…</p>
          <p className="font-semibold">AI tools</p>
          <div className="grid grid-cols-2 gap-2">
            {[[Sparkles, 'Assistant'], [Languages, 'Translator'], [Gauge, 'Profile strength'], [Camera, 'Place recognition']].map(([I, l]) => (
              <div key={l} className="bg-canvas rounded-[10px] p-2.5"><I size={14} className="text-electric mb-1.5" />{l}</div>
            ))}
          </div>
        </div>
      </Phone>
      <Phone className="right-[2%] top-[70px] rotate-6">
        <img src={IMG.tokyoTower} alt="" className="w-full h-[230px] object-cover" />
        <div className="p-4 text-[11px] space-y-1.5">
          <p className="text-electric font-semibold">Identified</p>
          <p className="font-display text-[17px] font-medium">Tokyo Tower</p>
          <p className="text-muted">Minato, Tokyo · Japan</p>
          <div className="flex gap-1.5 pt-1"><span className="badge-accepted">History</span><span className="badge-accepted">Tips</span></div>
        </div>
      </Phone>
    </div>
  );
}

export default function HomePage() {
  const { services, communities, post } = useHomeData();
  const [open, setOpen] = useState(0);
  const featured = services[0];

  return (
    <div className="bg-canvas">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 btn-ink">Skip to content</a>
      {/* ── Hero ─────────────────────────────────────── */}
      <section className="relative">
        <div className="relative h-[700px] md:h-[780px] overflow-hidden">
          <img src={IMG.alpineAerial} alt="" className="absolute inset-0 w-full h-full object-cover" fetchPriority="high" />
          <div className="absolute inset-0 bg-gradient-to-b from-royal/70 via-royal/25 to-navy/50 mix-blend-multiply" />
          <div className="absolute inset-0 bg-gradient-to-br from-royal/30 via-transparent to-cyan/10" />
          <p aria-hidden="true" className="absolute inset-x-0 top-[60px] md:top-[70px] text-center font-display font-semibold leading-none tracking-[-0.06em] select-none
             text-[22vw] lg:text-[250px] bg-gradient-to-b from-white via-white/80 to-white/0 bg-clip-text text-transparent">LandEase</p>
        <div id="main" className="absolute inset-x-0 bottom-[76px] md:bottom-[96px]">
          <div className="container-x flex items-end justify-between gap-8">
            <div className="text-white max-w-[560px]">
              <h1 className="font-display font-medium tracking-display text-[40px] md:text-[48px] leading-[1.05] text-white">Settle into your new country with people who&apos;ve done it.</h1>
              <div className="flex flex-wrap gap-3 mt-7">
                <ArrowLink to="/services">Explore services</ArrowLink>
                <Link to="/register" className="btn-ghost-light">Create free account</Link>
              </div>
            </div>
            <div className="hidden lg:block w-[330px] bg-white rounded-[22px] p-2.5 shadow-float">
              <p className="text-center text-[15px] font-medium pt-2"><span className="inline-block w-1.5 h-1.5 rounded-full bg-electric mr-2 align-middle" />Plan your arrival</p>
              <p className="text-center text-[13px] text-muted px-4 pb-3">Verified help with housing, banking, transport and paperwork</p>
              <div className="relative h-[230px] rounded-[16px] overflow-hidden">
                <img src={IMG.airportBoard} alt="" className="w-full h-full object-cover" />
                {featured && (
                  <Link to={`/services/${featured.id}`} className="absolute inset-x-2 bottom-2 bg-white/95 rounded-[14px] p-2.5 flex items-center gap-2.5">
                    <Avatar name={featured.providerName} size={34} />
                    <span className="min-w-0 flex-1 leading-tight">
                      <span className="block text-[14px] font-medium truncate">{featured.title}</span>
                      <span className="block text-[12.5px] text-electric font-medium">{featured.providerIsKycVerified ? 'Identity-verified provider' : featured.providerName}</span>
                    </span>
                    <span className="arrow-disc"><ArrowUpRight size={15} /></span>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
        </div>
        <PublicHeader overlay />
        <div className="container-x relative -mt-[44px] z-10"><SearchBar /></div>
      </section>

      {/* ── Intro ────────────────────────────────────── */}
      <section className="container-x pt-24 pb-16 grid md:grid-cols-[260px_1fr_190px] gap-10 items-start">
        <img src={IMG.alpineLake} alt="Turquoise alpine lake with a rowing boat" className="rounded-[22px] h-[230px] w-full object-cover" />
        <div>
          <p className="font-display text-[26px] md:text-[30px] leading-[1.25] tracking-[-0.03em]">
            LandEase connects newcomers with identity-verified people who know the way{' '}
            <span className="two">housing, banking, transport and paperwork, plus communities from your own corridor and calm safety tools for when things go wrong.</span>
          </p>
          <ArrowLink to="/how-it-works" className="mt-8">See how it works</ArrowLink>
        </div>
        <img src={IMG.sunsetHiker} alt="" className="hidden md:block rounded-[22px] h-[180px] w-full object-cover mt-[110px]" />
      </section>

      <section className="container-x pb-16 grid sm:grid-cols-3 gap-5">
        {[[SERVICE_CATEGORIES.length, 'Service categories', false], [communities.total || 20, 'Corridor communities', true], [4, 'AI tools, with honest limits', false]].map(([n, l, hi]) => (
          <div key={l} className={`relative rounded-card p-6 pt-12 ${hi ? 'bg-electric text-white' : 'card'}`}>
            {hi && <span className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white text-electric inline-flex items-center justify-center"><Users size={16} /></span>}
            <p className="numeral text-[60px]">{n}</p>
            <p className="stat-label mt-3">{l}</p>
          </div>
        ))}
      </section>

      {/* ── What you can do ──────────────────────────── */}
      <section className="bg-white py-24 overflow-hidden">
        <p className="text-center text-muted text-[15px] mb-6">What you can do on LandEase</p>
        <div className="relative [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]">
          <div className="flex gap-3 w-max animate-marquee hover:[animation-play-state:paused]">
            {[...FEATURE_CHIPS, ...FEATURE_CHIPS].map(([I, l], i) => (
              <span key={i} className="chip h-10 px-4 text-[15px]" aria-hidden={i >= FEATURE_CHIPS.length}><I size={16} aria-hidden="true" />{l}</span>
            ))}
          </div>
        </div>
        <div className="container-x">
          <TwoTone first="Everything a newcomer needs," second="kept simple to follow and honest about what it can't do." className="text-center text-[34px] md:text-[48px] max-w-[820px] mx-auto mt-16 text-balance" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-12">
            {FEATURES.map(([I, t, d, to, cta]) => (
              <div key={t} className="rounded-card bg-[#F5F8FC] border border-line p-6 flex flex-col">
                <span className="w-11 h-11 rounded-[12px] bg-white border border-line inline-flex items-center justify-center text-electric"><I size={19} /></span>
                <h3 className="text-[21px] mt-5">{t}</h3>
                <p className="text-muted mt-2 flex-1">{d}</p>
                <Link to={to} className="link mt-5">{cta} →</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Categories ───────────────────────────────── */}
      <section className="container-x py-24 grid lg:grid-cols-[485px_1fr] gap-6">
        <div className="relative rounded-media overflow-hidden min-h-[320px]">
          <img src={IMG.airportBoard} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-navy/90 via-navy/30 to-transparent" />
          <div className="absolute bottom-7 left-7 right-7 text-white">
            <p className="text-[13px] font-semibold uppercase tracking-label">Find help by category</p>
            <p className="font-display text-[34px] tracking-display leading-[1.05] mt-2">From the arrivals hall to your first payslip.</p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {SERVICE_CATEGORIES.map(c => {
            const I = CATEGORY_ICONS[c.value];
            return (
              <Link key={c.value} to={`/services?category=${c.value}`} className="group card-hover p-5 flex flex-col justify-between min-h-[136px]">
                <span className="icon-tile w-10 h-10"><I size={18} /></span>
                <span className="flex items-center justify-between font-semibold">{c.label}<ArrowUpRight size={15} className="text-muted group-hover:text-electric" /></span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ── Featured services ────────────────────────── */}
      {services.length > 0 && (
        <section className="container-x pb-24">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
            <TwoTone first="Services for" second="your first weeks" className="text-[36px] md:text-[44px]" />
            <div className="flex items-center gap-4"><span className="text-muted text-[15px]">Sorted by provider rating</span><Link to="/services" className="btn-ghost">See all services</Link></div>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {services.map(s => (
              <Link key={s.id} to={`/services/${s.id}`} className="group relative rounded-media overflow-hidden h-[400px]">
                <img src={coverFor(s.destinationCountry)} alt="" className="zoom-img absolute inset-0 w-full h-full object-cover" />
                <span className="absolute top-4 left-4 badge bg-white text-ink h-7 px-3 text-[13px] font-medium">{categoryLabel(s.category)} · USD {money(s.price)}</span>
                <div className="absolute inset-x-4 bottom-4 bg-white/85 backdrop-blur rounded-[18px] p-4 flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] text-muted">{s.providerRating > 0 && <><Star size={12} className="inline text-[#F5A524] -mt-0.5" fill="currentColor" /> {s.providerRating} · </>}{s.providerName}</p>
                    <p className="font-display text-[19px] leading-tight tracking-[-0.025em] line-clamp-2">{s.title}</p>
                    <p className="text-[13px] text-muted mt-1">{s.destinationCountry}</p>
                  </div>
                  <span className="w-10 h-10 rounded-full bg-white inline-flex items-center justify-center shrink-0"><ArrowRight size={16} /></span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Tools ────────────────────────────────────── */}
      <section className="bg-white pt-24 overflow-hidden">
        <div className="container-x text-center">
          <span className="inline-flex items-center gap-2 bg-white shadow-pill rounded-full pl-3 pr-1 py-1 text-[13.5px]">General information, not legal advice
            <Link to="/tools" className="bg-soft-sky text-white rounded-full px-2.5 py-0.5 font-medium">Read the limits →</Link></span>
          <h2 className="display text-[40px] md:text-[60px] max-w-[760px] mx-auto mt-6 text-balance">Smart tools for settling in, built to say what they can&apos;t do.</h2>
          <p className="text-muted text-[17px] max-w-[540px] mx-auto mt-5">Ask the assistant, translate a conversation at the bank, check your profile strength or identify a landmark from a photo.</p>
          <div className="flex justify-center flex-wrap gap-3 mt-8">
            <Link to="/tools" className="btn-ink">Explore the tools</Link>
            <Link to="/how-it-works" className="btn-pale"><Play size={14} aria-hidden="true" />How it works</Link>
          </div>
          <div className="mt-14"><PhoneTrio /></div>
        </div>
      </section>

      {/* ── Communities ──────────────────────────────── */}
      <section className="container-x py-24 grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <p className="overline text-[13px]">Corridor communities</p>
          <TwoTone first="Meet people who made" second="the same move you're making." className="text-[38px] md:text-[44px] mt-3" />
          <p className="text-muted text-[17px] mt-5 max-w-[470px]">Each community connects one origin country to one destination. Read posts without an account; join to share your own.</p>
          <div className="flex flex-wrap gap-2.5 mt-8">
            {communities.items.slice(0, 6).map(c => (
              <Link key={c.id} to={`/community/${c.id}`} className="h-11 px-4 rounded-full bg-white shadow-xs inline-flex items-center gap-2 text-[15px] hover:shadow-hover">
                {c.originCountry} <span className="text-twotone">→</span> {c.destinationCountry} <span className="text-muted">· {c.memberCount} members</span>
              </Link>
            ))}
          </div>
          <ArrowLink to="/community" className="mt-8">Browse all communities</ArrowLink>
        </div>
        <div className="relative rounded-media overflow-hidden h-[420px] md:h-[520px]">
          <img src={IMG.kyotoStreet} alt="Evening street in Kyoto with a pagoda" className="w-full h-full object-cover" />
          {post && (
            <Link to={`/community/${post.community.id}`} className="absolute left-4 bottom-4 max-w-[300px] bg-white/95 rounded-[18px] p-3.5 flex gap-3">
              <Avatar name={post.authorName} size={34} />
              <span className="text-[13.5px] leading-snug"><span className="font-semibold block">{post.community.originCountry} → {post.community.destinationCountry}</span>
                <span className="line-clamp-2">“{post.content}”</span></span>
            </Link>
          )}
        </div>
      </section>

      {/* ── SOS band ─────────────────────────────────── */}
      <section className="bg-navy text-white py-24">
        <div className="container-x grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-[13px] font-semibold uppercase tracking-label text-[#FF8A80]"><span className="inline-block w-2 h-2 rounded-full bg-sos mr-2" />SOS safety</p>
            <h2 className="display text-white text-[40px] md:text-[44px] mt-3">When something goes wrong, <span className="text-[#9FB3E8]">help is one tap away.</span></h2>
            <ol className="mt-8 space-y-5">
              {[['Choose what\'s happening', ' — medical, safety, legal, lost or other.'], ['Responders in your destination country are alerted', ' with your location if you share it.'], ['See who is responding', ', and mark yourself safe when it\'s over.']].map(([b, r], i) => (
                <li key={i} className="flex gap-4 text-[16.5px]"><span className="w-8 h-8 rounded-full border border-white/40 inline-flex items-center justify-center shrink-0 font-medium">{i + 1}</span><span><b className="font-semibold">{b}</b><span className="text-white/80">{r}</span></span></li>
              ))}
            </ol>
            <p className="mt-8 border border-white/25 rounded-[16px] px-5 py-4 flex gap-3 text-[15px]"><TriangleAlert size={18} className="shrink-0 mt-0.5" aria-hidden="true" />LandEase is not an emergency service. In immediate danger, call your local emergency number first.</p>
          </div>
          <div className="relative rounded-media overflow-hidden h-[500px]">
            <img src={IMG.securityOfficer} alt="" className="w-full h-full object-cover" />
            <div className="absolute top-4 right-4 w-[260px] bg-white text-ink rounded-[18px] p-4 shadow-float" aria-label="Example of an active SOS alert">
              <p className="text-[12.5px] font-semibold uppercase tracking-label text-sos">● SOS active · Example</p>
              <p className="font-semibold mt-1.5">6 responders alerted in Australia</p>
              <p className="text-[13.5px] text-muted">Harbour Settlement Services is responding</p>
              <p className="mt-3 bg-navy text-white rounded-[10px] px-3 py-2 text-[14px]">Emergency number: <b>000</b></p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Provider band ────────────────────────────── */}
      <section className="container-x pt-24">
        <div className="relative rounded-media overflow-hidden">
          <img src={IMG.sunsetHiker} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-navy/80 via-navy/50 to-transparent" />
          <div className="relative p-8 md:p-11 py-16 md:py-24 text-white max-w-[620px]">
            <p className="text-[13px] font-semibold uppercase tracking-label text-white/85">For service providers</p>
            <h2 className="display text-white text-[36px] md:text-[44px] mt-3">Know your way around? Help newcomers and earn.</h2>
            <div className="flex flex-wrap gap-2 mt-6">
              {['1 · Sign up as a provider', '2 · Verify your identity', '3 · List your services'].map(s => <span key={s} className="h-8 px-3.5 rounded-full bg-white/20 backdrop-blur inline-flex items-center text-[14.5px]">{s}</span>)}
            </div>
            <ArrowLink to="/register?role=Helper" className="mt-7">Become a provider</ArrowLink>
          </div>
        </div>
      </section>

      {/* ── Commitments ──────────────────────────────── */}
      <section className="container-x py-24 grid lg:grid-cols-[400px_1fr] gap-6 items-stretch">
        <div className="rounded-media bg-[#B0D236] overflow-hidden min-h-[300px]"><img src={IMG.padlock} alt="" className="w-full h-full object-cover" /></div>
        <div>
          <TwoTone first="Our commitments" second="instead of big numbers." className="text-[34px] md:text-[40px]" />
          <div className="grid sm:grid-cols-2 gap-4 mt-6">
            {COMMITMENTS.map(([I, t, d]) => (
              <div key={t} className="card p-5">
                <span className="w-9 h-9 rounded-[10px] bg-electric-50 text-electric inline-flex items-center justify-center"><I size={17} /></span>
                <p className="font-semibold text-[16.5px] mt-4">{t}</p>
                <p className="text-muted text-[15px] mt-1">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────── */}
      <section className="bg-white py-24">
        <div className="max-w-[816px] mx-auto px-4">
          <h2 className="display text-center text-[36px] md:text-[44px]">Questions people ask first</h2>
          <div className="mt-10 border-t border-line">
            {FAQ.map(([q, a], i) => (
              <div key={q} className="border-b border-line">
                <h3>
                  <button type="button" aria-expanded={open === i} onClick={() => setOpen(open === i ? -1 : i)}
                    className="w-full flex items-center justify-between gap-4 py-6 text-left font-display text-[19px] tracking-[-0.025em]">
                    {q}<span className="w-9 h-9 rounded-full bg-canvas inline-flex items-center justify-center shrink-0">{open === i ? <X size={15} /> : <Plus size={15} />}</span>
                  </button>
                </h3>
                {open === i && <p className="pb-6 -mt-1 text-muted text-[16px] max-w-[760px]">{a}</p>}
              </div>
            ))}
          </div>
          <div className="text-center mt-8"><Link to="/help" className="btn-ghost">Visit the help centre</Link></div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────── */}
      <section className="container-x py-24">
        <div className="relative rounded-media overflow-hidden text-center text-white">
          <img src={IMG.balloon} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-navy/45" />
          <div className="relative px-6 py-24">
            <h2 className="display text-white text-[40px] md:text-[56px] max-w-[540px] mx-auto">Start your move with a plan.</h2>
            <p className="text-[17px] mt-5 text-white/90">Free for migrants. Browse services and communities before you sign up.</p>
            <div className="flex flex-wrap justify-center gap-3 mt-8">
              <ArrowLink to="/register">Create free account</ArrowLink>
              <Link to="/services" className="btn-ghost-light">Explore services</Link>
            </div>
          </div>
        </div>
      </section>
      <PublicFooter full />
    </div>
  );
}
