import { Link } from 'react-router-dom';

// Outline only: final wording must come from the owner's legal adviser (roadmap OWN-12/OWN-13).
const PLACEHOLDER = "[Final wording to be supplied by the owner's legal adviser]";
const CONTENT = {
  privacy: {
    title: 'Privacy policy',
    sections: [
      ['Identity documents', 'Must explain KYC uploads, private storage, who reviews them and how long they are kept.'],
      ['Location data', 'Must explain that SOS shares your location with responders in your destination country.'],
      ['Sensitive answers', 'Profile-strength answers (such as refusals or criminal record) are not stored but are sent to the AI provider.'],
      ['AI processing', 'Chat, translation, documents (with consent) and photos are processed by Google Gemini.'],
      ['Chat history', 'How long conversations are kept and how to delete them in Account & security.'],
      ['Emails', 'Which transactional emails LandEase sends (for example verification decisions).'],
      ['Retention periods', 'How long each kind of data is kept and how to ask for deletion.'],
    ],
  },
  terms: {
    title: 'Terms of service',
    sections: [
      ['Who can use LandEase', 'Eligibility, account types (migrant, service provider, staff-granted agency) and one account per person.'],
      ['Verification', 'Service providers must pass identity verification before publishing services.'],
      ['Services and bookings', 'Providers are independent; LandEase does not take part in the service or handle payment.'],
      ['AI tools', 'General information only — not legal advice and not a visa prediction.'],
      ['SOS', 'LandEase is not an emergency service and cannot dispatch police or ambulances.'],
      ['Community rules', 'What may be posted, and how staff review flagged content.'],
      ['Liability and changes', 'Limits of liability and how these terms are updated.'],
    ],
  },
};
const slug = (s) => s.toLowerCase().replace(/[^a-z]+/g, '-');

export default function LegalPage({ kind }) {
  const { title, sections } = CONTENT[kind];
  return (
    <div className="max-w-[1036px] mx-auto px-4 pt-10">
      <div className="seg shadow-pill border-0 p-1.5">
        <Link to="/privacy" aria-current={kind === 'privacy' ? 'page' : undefined} className={`h-9 px-4 rounded-full inline-flex items-center text-[15px] font-medium ${kind === 'privacy' ? 'bg-ink-pill text-white' : 'text-muted'}`}>Privacy policy</Link>
        <Link to="/terms" aria-current={kind === 'terms' ? 'page' : undefined} className={`h-9 px-4 rounded-full inline-flex items-center text-[15px] font-medium ${kind === 'terms' ? 'bg-ink-pill text-white' : 'text-muted'}`}>Terms of service</Link>
      </div>
      <h1 className="display text-[44px] md:text-[56px] mt-6">{title}</h1>
      <p className="text-muted text-[17px] mt-1">Last updated: [date]</p>
      <span className="badge-backend h-7 px-3 text-[13.5px] mt-3">Draft — pending legal review. Not linked from sign-up until final.</span>

      <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-8 mt-8 items-start">
        <nav aria-label="Contents" className="card p-5 md:sticky md:top-24">
          <p className="overline mb-3">Contents</p>
          <ul className="space-y-2 text-[15px]">{sections.map(([h]) => <li key={h}><a href={`#${slug(h)}`} className="hover:text-electric">{h}</a></li>)}</ul>
        </nav>
        <div className="card px-8 py-2">
          {sections.map(([h, d]) => (
            <section key={h} id={slug(h)} className="py-7 border-b border-line last:border-b-0 scroll-mt-28">
              <h2 className="text-[24px]">{h}</h2>
              <p className="text-muted text-[16.5px] mt-2">{d}</p>
              <p className="note mt-4">{PLACEHOLDER}</p>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
