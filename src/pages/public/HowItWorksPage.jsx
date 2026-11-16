import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { UserRound, Search, ClipboardList, CircleCheck, Star, Users, Siren, IdCard, Lock, Clock, Store, Inbox } from 'lucide-react';
import { ArrowLink, StatusBadge, TwoTone } from '../../components/ui';
import { IMG } from '../../lib/media';

const MIGRANT = [
  [UserRound, 'Create your account', 'Choose “I’m moving”, then set your origin and destination country.'],
  [Search, 'Explore or ask', 'Browse services by category, or ask the AI assistant a general question.'],
  [ClipboardList, 'Request a booking', 'Pick a preferred date if you like and add notes for the provider.'],
  [CircleCheck, 'Provider takes it from there', 'They accept, start and complete the service; you see each status.'],
  [Star, 'Leave a review', 'Rate the provider once the booking is completed.'],
  [Users, 'Join your corridor', 'Ask people who made the same move what worked for them.'],
  [Siren, 'SOS if you need it', 'Alert responders in your destination country and see who is responding.'],
];
const PROVIDER = [
  [UserRound, 'Sign up as a provider', 'Choose “I want to offer services” and set the country you work in.'],
  [IdCard, 'Verify your identity', 'Upload a government ID and a selfie holding it.'],
  [Clock, 'Staff review', 'Usually 1–2 business days. We email you the decision.'],
  [Store, 'List your services', 'Describe what you offer, set a price in USD and your destination country.'],
  [Inbox, 'Manage requests', 'Accept or decline, then start and complete each booking.'],
  [Star, 'Earn reviews', 'Migrants rate you after a completed booking.'],
  [Siren, 'Respond to SOS', 'Get alerts from migrants in your country and tell them you are coming.'],
];
const LIFECYCLE = [
  ['Requested', 'You send a request with an optional date and notes.'],
  ['Accepted', 'The provider accepts — or declines, which cancels it.'],
  ['InProgress', 'The provider starts the service on the day.'],
  ['Completed', 'You can now leave one public review of the provider.'],
];

export default function HowItWorksPage() {
  const { hash } = useLocation();
  const [who, setWho] = useState(hash === '#providers' ? 'providers' : 'migrants');
  const steps = who === 'providers' ? PROVIDER : MIGRANT;

  return (
    <>
      <section className="relative overflow-hidden">
        <div className="absolute inset-x-0 -top-40 h-[620px] bg-[radial-gradient(ellipse_at_center,#DCEBFD_0%,rgba(237,242,248,0)_65%)]" aria-hidden="true" />
        <div className="container-x relative pt-16 pb-20 text-center">
          <p className="overline text-[12.5px]">How it works</p>
          <h1 className="h2-two text-[44px] md:text-[64px] max-w-[800px] mx-auto mt-4 text-balance">From your first search <span className="two">to feeling settled.</span></h1>
          <p className="text-muted text-[18px] max-w-[600px] mx-auto mt-5">Two journeys share one platform: people who are moving, and people who help them.</p>
          <div className="seg shadow-pill border-0 mt-8 p-1.5" role="group" aria-label="Choose a journey">
            <button type="button" className="!h-10 !px-5 !text-[15px]" aria-pressed={who === 'migrants'} onClick={() => setWho('migrants')}>I&apos;m moving</button>
            <button type="button" className="!h-10 !px-5 !text-[15px]" aria-pressed={who === 'providers'} onClick={() => setWho('providers')}>I want to help</button>
          </div>
          <ol id={who} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-12 text-left">
            {steps.map(([I, t, d], i) => (
              <li key={t} className="card p-6">
                <div className="flex items-start justify-between"><span className="numeral text-[44px] text-[#B8C0CC]">{String(i + 1).padStart(2, '0')}</span>
                  <span className="w-10 h-10 rounded-[12px] bg-electric-50 text-electric inline-flex items-center justify-center"><I size={17} /></span></div>
                <h2 className="font-sans text-[17.5px] font-semibold tracking-normal mt-4">{t}</h2>
                <p className="text-muted text-[15px] mt-2">{d}</p>
              </li>
            ))}
          </ol>
          <ArrowLink to={`/register?role=${who === 'providers' ? 'Helper' : 'Migrant'}`} className="mt-8">Create a {who === 'providers' ? 'provider' : 'migrant'} account</ArrowLink>
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="container-x">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_420px] gap-8 items-end">
            <TwoTone first="The booking lifecycle —" second="one clear status at every step." className="text-[36px] md:text-[44px] max-w-[560px]" />
            <p className="text-muted">Only the provider moves a booking forward. Either side can cancel before it&apos;s completed; completed and cancelled are final.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-10">
            {LIFECYCLE.map(([s, d]) => <div key={s} className="rounded-card bg-[#F5F8FC] p-5"><StatusBadge status={s} /><p className="text-muted mt-3">{d}</p></div>)}
          </div>
        </div>
      </section>

      <section id="providers" className="container-x py-24 grid lg:grid-cols-2 gap-8 items-center">
        <img src={IMG.securityOfficer} alt="" className="rounded-media w-full h-[480px] object-cover" />
        <div>
          <p className="overline text-[12.5px]">Identity verification</p>
          <TwoTone first="Every provider is checked" second="before they can list a service." className="text-[36px] md:text-[44px] mt-3" />
          <div className="space-y-3 mt-7">
            {[[IdCard, 'What we check', 'A government ID, a selfie holding that ID, and optionally a proof of address.'],
              [Lock, 'How documents are stored', 'In private storage. Reviewers open them through links that expire after 15 minutes.'],
              [Clock, 'How long it takes', 'Usually 1–2 business days. We email you the decision, and the reason if it\'s declined.']].map(([I, t, d]) => (
              <div key={t} className="card p-5 flex gap-4"><span className="icon-tile w-10 h-10"><I size={17} /></span><div><p className="font-semibold">{t}</p><p className="text-muted text-[15px]">{d}</p></div></div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-x grid md:grid-cols-2 gap-5">
        <div className="rounded-card bg-electric text-white p-8 flex flex-col">
          <h2 className="display text-white text-[30px]">I&apos;m moving or have moved</h2>
          <p className="mt-3 text-white/90">Book services, join your corridor and use SOS if you need help.</p>
          <Link to="/register?role=Migrant" className="mt-14 font-semibold hover:underline">Create a migrant account →</Link>
        </div>
        <div className="card p-8 flex flex-col">
          <h2 className="display text-[30px]">I want to offer services</h2>
          <p className="mt-3 text-muted">Verify your identity, list services and respond to SOS alerts in your country.</p>
          <Link to="/register?role=Helper" className="mt-14 link">Create a provider account →</Link>
        </div>
      </section>
    </>
  );
}
