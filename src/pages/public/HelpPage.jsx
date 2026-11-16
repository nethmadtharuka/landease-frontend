import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, UserRound, IdCard, ClipboardList, Star, Users, Sparkles, Siren, Lock, Plus, Minus } from 'lucide-react';

// Answers describe real platform behaviour (see backend validators and services).
const TOPICS = [
  ['Account', UserRound], ['Verification (KYC)', IdCard], ['Services & bookings', ClipboardList], ['Reviews', Star],
  ['Communities', Users], ['AI tools', Sparkles], ['SOS & safety', Siren], ['Privacy', Lock],
];
const FAQ = [
  ['Account', 'I was locked out of my account', 'After 5 failed sign-in attempts, your account is locked for 15 minutes. Wait, then try again with the correct password.'],
  ['Account', 'Can I change my email address?', 'Not yet. You can change your name, phone number, countries and migration status from My profile.'],
  ['Verification (KYC)', 'Why can’t I list a service?', 'Service providers must be identity-verified before they can publish a service. Submit your documents from Verification; staff usually decide within 1–2 business days.'],
  ['Verification (KYC)', 'Which files can I upload?', 'A government ID (JPG, PNG or PDF), a selfie holding that ID (JPG or PNG) and, optionally, proof of address (JPG, PNG or PDF). Each file can be up to 5 MB.'],
  ['Services & bookings', 'Why can’t I cancel a completed booking?', 'Completed and cancelled bookings are final. Either side can cancel any time before the provider marks the booking as completed.'],
  ['Services & bookings', 'How do I contact my provider?', 'LandEase doesn’t share contact details or offer messaging yet. Add anything the provider needs to know in the booking notes when you request it.'],
  ['Reviews', 'When can I leave a review?', 'Once the provider marks your booking as completed. You can leave one review per booking and it appears on the provider’s public profile.'],
  ['Communities', 'Can I create a new community?', 'Communities are set up by LandEase staff, one for each origin and destination corridor. Anyone can read posts; join a community to write.'],
  ['AI tools', 'Is the profile-strength score a visa prediction?', 'No. It is a general 0–100 indicator based on a simplified LandEase heuristic. It is not any government’s points test and does not predict visa outcomes.'],
  ['SOS & safety', 'SOS says no responders were alerted', 'SOS reaches registered providers and agencies in your destination country. Set your destination country in My profile. In immediate danger, call your local emergency number.'],
  ['Privacy', 'Who can see my identity documents?', 'Only LandEase staff reviewing your verification. Documents are kept in private storage and reviewers open them through links that expire after 15 minutes.'],
];

export default function HelpPage() {
  const [q, setQ] = useState('');
  const [topic, setTopic] = useState('');
  const [open, setOpen] = useState(0);
  const items = useMemo(() => {
    const s = q.trim().toLowerCase();
    return FAQ.filter(([t, question, a]) => (!topic || t === topic) && (!s || `${t} ${question} ${a}`.toLowerCase().includes(s)));
  }, [q, topic]);

  return (
    <div className="relative">
      <div className="absolute inset-x-0 -top-40 h-[560px] bg-[radial-gradient(ellipse_at_center,#DCEBFD_0%,rgba(237,242,248,0)_65%)]" aria-hidden="true" />
      <div className="relative max-w-[1036px] mx-auto px-4 pt-14">
        <h1 className="display text-center text-[44px] md:text-[56px]">How can we help?</h1>
        <div className="relative max-w-[710px] mx-auto mt-7">
          <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
          <input type="search" aria-label="Search help articles" value={q} onChange={e => { setQ(e.target.value); setOpen(0); }}
            placeholder="Try “locked out”, “KYC”, “SOS”" className="w-full h-[58px] rounded-full bg-white shadow-pill pl-12 pr-5 text-[16px] outline-none focus:ring-2 focus:ring-electric/30" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-10">
          {TOPICS.map(([t, I]) => (
            <button key={t} type="button" aria-pressed={topic === t} onClick={() => { setTopic(topic === t ? '' : t); setOpen(0); }}
              className={`card h-[74px] px-4 flex items-center gap-3 text-left font-semibold transition-colors ${topic === t ? 'ring-2 ring-electric' : 'hover:shadow-hover'}`}>
              <span className="w-9 h-9 rounded-[10px] bg-electric-50 text-electric inline-flex items-center justify-center shrink-0"><I size={17} /></span>{t}
            </button>
          ))}
        </div>

        <section id="faq" className="card px-7 py-2 mt-7 scroll-mt-28">
          {items.length === 0 ? (
            <p className="py-10 text-center text-muted">No answers found. <Link to="/contact" className="link">Contact us</Link></p>
          ) : items.map(([t, question, a], i) => (
            <div key={question} className="border-b border-line last:border-b-0">
              <button type="button" aria-expanded={open === i} onClick={() => setOpen(open === i ? -1 : i)} className="w-full py-4 flex items-center justify-between gap-4 text-left">
                <span><span className="block text-[13px] text-muted">{t}</span><span className="block font-semibold text-[16.5px]">{question}</span></span>
                {open === i ? <Minus size={16} className="shrink-0" /> : <Plus size={16} className="shrink-0" />}
              </button>
              {open === i && <p className="pb-5 -mt-1 text-muted">{a}</p>}
            </div>
          ))}
        </section>

        <section className="card p-6 mt-7 flex flex-wrap items-center justify-between gap-4">
          <div><h2 className="text-[24px]">Still need help?</h2><p className="text-muted">Our team usually replies within two business days.</p></div>
          <Link to="/contact" className="btn-ink">Contact us</Link>
        </section>
      </div>
    </div>
  );
}
