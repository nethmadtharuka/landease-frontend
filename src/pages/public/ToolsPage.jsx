import { Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ArrowLink } from '../../components/ui';
import { IMG } from '../../lib/media';
import { Link } from 'react-router-dom';

function ToolSection({ id, title, body, check, warnTitle, warn, data, cta, to, media, flip }) {
  const { user } = useAuth();
  const href = user ? to : `/login?next=${encodeURIComponent(to)}`;
  return (
    <section id={id} className="card p-4 grid lg:grid-cols-2 gap-6 lg:gap-8 items-center scroll-mt-28">
      <div className={`${flip ? 'lg:order-2' : ''}`}>{media}</div>
      <div className="px-3 py-4 lg:px-4">
        <h2 className="display text-[32px] md:text-[34px]">{title}</h2>
        <p className="text-muted text-[17px] mt-4">{body}</p>
        <p className="flex gap-3 text-muted mt-4"><Check size={18} className="text-[#0F7B4F] shrink-0 mt-0.5" aria-hidden="true" />{check}</p>
        <p className="warn mt-4 text-[15px]"><b>{warnTitle}</b> {warn}</p>
        <p className="text-[13.5px] text-muted mt-4">Data: {data}</p>
        <ArrowLink to={href} className="mt-5">{cta}</ArrowLink>
      </div>
    </section>
  );
}

const EMERGENCY = [['Australia', '000'], ['United Kingdom', '999'], ['Canada & US', '911'], ['New Zealand', '111'], ['Germany & EU', '112']];

export default function ToolsPage() {
  const { user } = useAuth();
  return (
    <div className="container-x pt-6">
      <section className="relative rounded-media overflow-hidden bg-navy min-h-[440px] flex items-center">
        <img src={IMG.holoWave} alt="" className="absolute right-0 top-0 h-full w-[70%] object-cover object-right" />
        <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/85 to-transparent" />
        <div className="relative px-8 md:px-12 py-14 max-w-[600px] text-white">
          <p className="text-[12.5px] font-semibold uppercase tracking-label text-white/70">AI &amp; safety tools</p>
          <h1 className="display text-white text-[44px] md:text-[60px] mt-3">Useful tools, <span className="text-[#A9B8E6]">with their limits written down.</span></h1>
          <p className="text-[17px] text-white/85 mt-5">Five tools, all available after you sign in. Here&apos;s exactly what each does, what it doesn&apos;t, and what happens to your data.</p>
        </div>
      </section>

      <nav aria-label="Tools on this page" className="flex flex-wrap gap-2 mt-6">
        {[['#assistant', 'AI Assistant'], ['#translator', 'Voice translator'], ['#profile-strength', 'Profile strength'], ['#place-recognition', 'Place recognition']].map(([h, l]) => (
          <a key={h} href={h} className="chip h-10 px-4">{l}</a>
        ))}
        <a href="#sos" className="chip h-10 px-4 text-sos">SOS</a>
      </nav>

      <div className="space-y-6 mt-8">
        <ToolSection id="assistant" title="AI Assistant" to="/dashboard/ai-chat" cta="Try the assistant"
          body="Ask about visas in general, banking, housing, work, healthcare and culture. It remembers your conversation so you can follow up."
          check="You can delete your chat history at any time." warnTitle="Not legal advice." warn="LandEase AI provides general information only. Always confirm with official government sources or a licensed adviser."
          data="your messages are processed by Google Gemini to generate replies."
          media={<img src={IMG.aiHead} alt="" className="rounded-[20px] w-full h-[340px] object-cover" />} />

        <ToolSection id="translator" flip title="Voice translator" to="/dashboard/voice-translator" cta="Try the translator"
          body="Speak or type in one of 16 languages and hear the translation read aloud — useful at the bank, the doctor or the ward office."
          check="Includes Sinhala, Tamil, Hindi, Nepali, Bengali, Urdu, Arabic, Chinese, Japanese and Korean." warnTitle="Browser support." warn="Voice input works in Chrome and Edge. You can always type instead."
          data="text is sent to Google Gemini for translation and is not saved by LandEase."
          media={(
            <div className="relative rounded-[20px] overflow-hidden h-[340px]">
              <img src={IMG.kyotoStreet} alt="" className="w-full h-full object-cover" />
              <p className="absolute left-4 bottom-[76px] bg-white rounded-full px-4 py-2 text-[14.5px]">Can you write that down for me?</p>
              <p lang="ja" className="absolute right-4 bottom-4 bg-ink-pill/90 text-white rounded-full px-4 py-2 text-[14.5px]">それを書いてもらえますか？</p>
            </div>
          )} />

        <ToolSection id="profile-strength" title="Profile strength check" to="/dashboard/immigration" cta="Check your profile"
          body="A general 0–100 indicator across education (25), work (25), language (20), financial (15) and personal (15) factors, with an explanation and suggestions."
          check="Covers Australia, Canada, UK, New Zealand and Germany. Optional document check only with your explicit consent." warnTitle="Not a visa prediction." warn="This is not an official points test. Immigration decisions are made only by government authorities."
          data="your answers aren't saved. Documents you choose to add are analysed by Google Gemini."
          media={(
            <div className="relative rounded-[20px] overflow-hidden h-[400px]">
              <img src={IMG.holoLiquid} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-white/90 backdrop-blur rounded-[20px] px-7 py-5 text-center shadow-float">
                  <p className="text-[12.5px] font-medium uppercase tracking-label">Example result</p>
                  <p className="numeral text-[56px] mt-1">68<span className="text-[24px]">/100</span></p>
                  <span className="badge-requested">Moderate</span>
                </div>
              </div>
            </div>
          )} />

        <ToolSection id="place-recognition" flip title="Explore with a photo" to="/dashboard/place-recognition" cta="Try it with a photo"
          body="Take or upload a photo of a landmark. Get its name, a short history, what it's famous for and practical tips."
          check="JPG or PNG up to 5 MB. Works with your phone camera." warnTitle="Best for landmarks." warn="Everyday streets or interiors may not be recognised."
          data="your photo is sent to Google Gemini and isn't stored by LandEase."
          media={(
            <div className="relative rounded-[20px] overflow-hidden h-[340px]">
              <img src={IMG.tokyoTower} alt="" className="w-full h-full object-cover" />
              <div className="absolute left-4 bottom-4 bg-white rounded-[14px] px-4 py-3 leading-tight">
                <p className="text-[13.5px] font-semibold text-electric">Identified</p>
                <p className="font-display text-[19px] tracking-[-0.03em]">Tokyo Tower</p>
                <p className="text-[13px] text-muted">Minato, Tokyo · Japan</p>
              </div>
            </div>
          )} />

        <section id="sos" className="rounded-card bg-navy text-white p-8 md:p-9 grid lg:grid-cols-2 gap-8 scroll-mt-28">
          <div>
            <p className="text-[12.5px] font-semibold uppercase tracking-label text-[#FF8A80]"><span className="inline-block w-2 h-2 rounded-full bg-sos mr-2" />Safety</p>
            <h2 className="display text-white text-[34px] mt-2">SOS alerts</h2>
            <p className="text-[17px] text-white/85 mt-3">Send an alert to registered helpers and agencies in your destination country. See who&apos;s responding and mark yourself safe when it&apos;s over.</p>
            <p className="mt-5 border border-white/25 rounded-[14px] px-4 py-3 text-[15px]"><b>Not an emergency service.</b> LandEase can&apos;t dispatch police or ambulances. In immediate danger, call your local emergency number first.</p>
            <p className="text-[13.5px] text-white/70 mt-4">Data: your name, phone and location (if you allow it) are shared with responders in your destination country.</p>
            <Link to={user ? '/dashboard/sos' : '/login?next=%2Fdashboard%2Fsos'} className="btn-danger mt-5">Set up SOS</Link>
          </div>
          <dl className="grid grid-cols-2 gap-3 content-start">
            {EMERGENCY.map(([c, n], i) => (
              <div key={c} className={`rounded-[16px] bg-white/10 px-4 py-3.5 ${i === 4 ? 'col-span-2' : ''}`}>
                <dt className="text-[13.5px] text-white/75">{c}</dt><dd className="numeral text-[30px] mt-1">{n}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </div>
  );
}
