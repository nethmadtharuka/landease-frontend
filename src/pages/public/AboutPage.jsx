import { Link } from 'react-router-dom';
import { ShieldCheck, Lock, Info, Users } from 'lucide-react';
import { ArrowLink, TwoTone } from '../../components/ui';
import { IMG } from '../../lib/media';

const PRINCIPLES = [
  [ShieldCheck, 'Safety first', 'SOS is calm, fast and always shows your local emergency number.'],
  [Lock, 'Privacy by default', 'Identity documents stay in private storage with short-lived reviewer access.'],
  [Info, 'Honest about AI', 'General information, clearly labelled. Never presented as legal advice or a visa prediction.'],
  [Users, "People who've done it", 'Help comes from verified providers and communities, not anonymous listings.'],
];
const NOT = [
  ['Not a law firm', "We don't give legal or immigration advice. Providers in the Legal category are independent."],
  ['Not a government service', 'Visa decisions are made only by government authorities.'],
  ['Not an emergency service', 'SOS alerts registered responders. In immediate danger, call your local emergency number.'],
];

export default function AboutPage() {
  return (
    <div className="-mb-24">
      <section className="container-x pt-6">
        <div className="relative rounded-media overflow-hidden h-[420px] md:h-[540px]">
          <img src={IMG.alpineLake} alt="Turquoise alpine lake surrounded by mountains" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-navy/70 via-navy/10 to-transparent" />
          <div className="absolute left-6 md:left-11 bottom-8 md:bottom-12 text-white max-w-[640px]">
            <p className="text-[12.5px] font-semibold uppercase tracking-label">About LandEase</p>
            <h1 className="display text-white text-[40px] md:text-[64px] mt-3">Nobody should have to figure out a new country alone.</h1>
          </div>
        </div>
      </section>

      <section className="container-x py-20 grid md:grid-cols-[1fr_1.15fr] gap-10">
        <div>
          <p className="overline text-[12.5px]">Why we built it</p>
          <TwoTone first="The first weeks decide" second="how the rest goes." className="text-[36px] md:text-[40px] mt-3" />
        </div>
        <div className="text-muted text-[17px] leading-relaxed space-y-4">
          <p>Finding a rental without local history, opening a bank account, registering with the right office, getting to the first job interview — newcomers face all of it at once, often in a second language.</p>
          <p>LandEase brings together people who have already made the move and are verified to help, communities organised by migration corridor, and tools that answer everyday questions while being clear about their limits.</p>
        </div>
      </section>

      <section className="container-x pb-20">
        <h2 className="display text-[36px] md:text-[40px]">Principles we design by</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
          {PRINCIPLES.map(([I, t, d]) => (
            <div key={t} className="card p-6">
              <span className="w-10 h-10 rounded-[12px] bg-electric-50 text-electric inline-flex items-center justify-center"><I size={17} /></span>
              <h3 className="font-sans font-semibold text-[17.5px] tracking-normal mt-6">{t}</h3>
              <p className="text-muted text-[15px] mt-1">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-navy text-white py-20">
        <div className="container-x">
          <h2 className="display text-white text-[36px] md:text-[40px]">What LandEase is not</h2>
          <div className="grid md:grid-cols-3 gap-4 mt-8">
            {NOT.map(([t, d]) => <div key={t} className="rounded-card border border-white/20 p-6"><h3 className="font-sans text-white font-semibold text-[18px] tracking-normal">{t}</h3><p className="text-white/75 mt-2">{d}</p></div>)}
          </div>
        </div>
      </section>

      <section className="py-24 text-center px-4">
        <h2 className="display text-[36px] md:text-[44px]">Partner with us, or just say hello.</h2>
        <div className="flex flex-wrap justify-center gap-3 mt-7">
          <ArrowLink to="/contact">Contact the team</ArrowLink>
          <Link to="/how-it-works" className="btn-ghost">How it works</Link>
        </div>
      </section>
    </div>
  );
}
