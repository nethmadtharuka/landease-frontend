import { useState } from 'react';
import { TriangleAlert, Mail, Users } from 'lucide-react';
import { BackendBadge } from '../../components/ui';

// Addresses are configuration, not code: set VITE_SUPPORT_EMAIL / VITE_PARTNERSHIPS_EMAIL when the team supplies them.
const SUPPORT = import.meta.env.VITE_SUPPORT_EMAIL || '';
const PARTNERS = import.meta.env.VITE_PARTNERSHIPS_EMAIL || '';
const TOPICS = ['Account', 'Verification (KYC)', 'Services & bookings', 'Communities', 'AI tools', 'SOS & safety', 'Privacy', 'Partnerships', 'Something else'];

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', topic: TOPICS[0], message: '', consent: false });
  const [errors, setErrors] = useState({});
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  // There is no contact endpoint yet (backend gap G11): the form composes an email in the visitor's mail app.
  const submit = (e) => {
    e.preventDefault();
    const err = {};
    if (!form.name.trim()) err.name = 'Enter your name.';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) err.email = 'Enter a valid email address.';
    if (form.message.trim().length < 5) err.message = 'Write a short message (at least 5 characters).';
    if (!form.consent) err.consent = 'Please confirm we can use these details to reply.';
    setErrors(err);
    if (Object.keys(err).length || !SUPPORT) return;
    const body = `${form.message}\n\n— ${form.name} (${form.email})`;
    window.location.href = `mailto:${SUPPORT}?subject=${encodeURIComponent(`[${form.topic}] Message from ${form.name}`)}&body=${encodeURIComponent(body)}`;
  };

  const field = (k) => `input ${errors[k] ? 'input-error' : ''}`;
  return (
    <div className="max-w-[936px] mx-auto px-4 pt-12">
      <h1 className="display text-[44px] md:text-[56px]">Contact us</h1>
      <p role="note" className="mt-6 rounded-[18px] border-2 border-sos bg-[#FDECEC] text-[#7A1A12] px-5 py-4 flex gap-3">
        <TriangleAlert size={20} className="text-sos shrink-0 mt-0.5" aria-hidden="true" />
        <span><b>LandEase cannot dispatch emergency services.</b> If you are in danger, call your local emergency number now — 000 in Australia, 999 in the UK, 911 in Canada and the US, 112 in the EU.</span>
      </p>

      <div className="grid md:grid-cols-2 gap-4 mt-6">
        {[[Mail, 'Support', 'Account, bookings, verification or something not working.', SUPPORT, '[support email]'],
          [Users, 'Partnerships', 'Settlement agencies, NGOs and community organisations.', PARTNERS, '[partnerships email]']].map(([I, t, d, addr, ph]) => (
          <div key={t} className="card p-6">
            <span className="w-10 h-10 rounded-[12px] bg-electric-50 text-electric inline-flex items-center justify-center"><I size={18} /></span>
            <h2 className="font-sans font-semibold text-[18px] tracking-normal mt-4">{t}</h2>
            <p className="text-muted">{d}</p>
            {addr ? <a href={`mailto:${addr}`} className="link inline-block mt-3">{addr}</a> : <span className="inline-block mt-3 text-electric font-semibold">{ph}</span>}
          </div>
        ))}
      </div>
      <p className="text-[13.5px] text-muted mt-3">{SUPPORT ? 'Links open your mail app.' : 'Addresses to be supplied by the LandEase team. Links open your mail app.'}</p>

      <form onSubmit={submit} noValidate className="card p-7 mt-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-[24px]">Send us a message</h2>
          <BackendBadge id="G11 contact endpoint" />
        </div>
        <div className="grid sm:grid-cols-2 gap-4 mt-5 sm:max-w-[600px]">
          <div><label htmlFor="ct-name" className="label">Name</label><input id="ct-name" className={field('name')} value={form.name} onChange={set('name')} aria-invalid={!!errors.name} aria-describedby="ct-name-e" />{errors.name && <p id="ct-name-e" className="field-error">{errors.name}</p>}</div>
          <div><label htmlFor="ct-email" className="label">Email</label><input id="ct-email" type="email" className={field('email')} value={form.email} onChange={set('email')} aria-invalid={!!errors.email} aria-describedby="ct-email-e" />{errors.email && <p id="ct-email-e" className="field-error">{errors.email}</p>}</div>
        </div>
        <label htmlFor="ct-topic" className="label mt-4">Topic</label>
        <select id="ct-topic" className="input" value={form.topic} onChange={set('topic')}>{TOPICS.map(t => <option key={t}>{t}</option>)}</select>
        <label htmlFor="ct-msg" className="label mt-4">Message</label>
        <textarea id="ct-msg" className={`${field('message')} h-36`} value={form.message} onChange={set('message')} maxLength={2000} aria-invalid={!!errors.message} aria-describedby="ct-msg-e" />
        {errors.message && <p id="ct-msg-e" className="field-error">{errors.message}</p>}
        <label className="flex items-center gap-3 mt-4 text-[15px]">
          <input type="checkbox" checked={form.consent} onChange={set('consent')} className="w-5 h-5 accent-electric" />I agree that LandEase can use these details to reply to me.
        </label>
        {errors.consent && <p className="field-error">{errors.consent}</p>}
        {!SUPPORT && <p className="warn mt-4">The contact form isn&apos;t connected yet. Please use the support address once it&apos;s published.</p>}
        <button type="submit" className="btn-ink mt-5" disabled={!SUPPORT}>Send message</button>
      </form>
    </div>
  );
}
