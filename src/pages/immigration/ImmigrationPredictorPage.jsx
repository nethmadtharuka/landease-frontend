import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, X, Upload, Printer, Sparkles, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { immigrationApi } from '../../api/endpoints';
import { apiErrorMessage } from '../../lib/apiError';
import { IMG } from '../../lib/media';
import { humanize } from '../../lib/format';

const MAX_DOC_BYTES = 5 * 1024 * 1024; // ImmigrationCatalog.MaxDocumentBytes
const MAX_DOCS = 6;
const SCORE_RANGES = { IELTS: [0, 9, 0.5], TOEFL: [0, 120, 1], PTE: [10, 90, 1], OET: [0, 500, 10] };
const DOC_TYPES = ['Passport', 'EmploymentLetter', 'BankStatement', 'LanguageCertificate', 'EducationCertificate', 'PreviousVisa'];
const FALLBACK_COUNTRIES = ['Australia', 'Canada', 'UK', 'NewZealand', 'Germany'];
const FALLBACK_VISAS = ['SkilledWorker', 'StudentVisa', 'FamilyReunification', 'InvestorVisa', 'HumanitarianVisa'];
const COUNTRY_LABEL = { UK: 'United Kingdom', NewZealand: 'New Zealand' };
const EDUCATION = ['HighSchool', 'Diploma', 'Bachelor', 'Master', 'PhD'];
const STEPS = ['Target country', 'Visa pathway', 'Your profile', 'Language & money', 'Personal & documents'];
const DRAFT_KEY = 'landease.profileStrength.draft';

const initialForm = {
  visaType: 'SkilledWorker', destinationCountry: 'Australia', educationLevel: 'Bachelor', yearsOfWorkExperience: 3,
  jobTitle: '', hasJobOffer: false, languageTest: 'IELTS', languageScore: 6.5, annualIncome: 0, savingsAmount: 20000,
  maritalStatus: 'Single', hasFamilyInDestination: false, age: 28, hasPriorVisaRefusal: false, hasCriminalRecord: false,
};
const loadDraft = () => { try { return { ...initialForm, ...JSON.parse(sessionStorage.getItem(DRAFT_KEY) || '{}') }; } catch { return initialForm; } };
const tone = (pct) => (pct >= 80 ? ['text-[#0F7B4F]', 'bg-[#0F7B4F]', 'badge-completed'] : pct >= 50 ? ['text-[#9A5B00]', 'bg-[#E3A33A]', 'badge-requested'] : ['text-sos', 'bg-sos', 'badge-sos']);

function Choice({ options, value, onChange, label = humanize }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
      {options.map(o => (
        <button key={o} type="button" aria-pressed={value === o} onClick={() => onChange(o)}
          className={`h-14 rounded-[16px] border text-[15.5px] font-medium px-3 ${value === o ? 'bg-ink-pill border-ink-pill text-white' : 'bg-white border-line hover:border-twotone'}`}>{label(o)}</button>
      ))}
    </div>
  );
}
function YesNo({ label, value, onChange }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-3 border-b border-line last:border-0">
      <span className="text-[16px]">{label}</span>
      <div className="seg">{[true, false].map(v => <button key={String(v)} type="button" aria-pressed={value === v} onClick={() => onChange(v)}>{v ? 'Yes' : 'No'}</button>)}</div>
    </div>
  );
}

export default function ImmigrationPredictorPage() {
  const [form, setForm] = useState(loadDraft);
  const [step, setStep] = useState(0);
  const [files, setFiles] = useState([]); // [{ file, docType }]
  const [consent, setConsent] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countries, setCountries] = useState(FALLBACK_COUNTRIES);
  const [visas, setVisas] = useState(FALLBACK_VISAS);

  useEffect(() => {
    immigrationApi.getCountries().then(r => r.data.data?.length && setCountries(r.data.data)).catch(() => {});
    immigrationApi.getVisaTypes().then(r => r.data.data?.length && setVisas(r.data.data)).catch(() => {});
  }, []);
  // Answers survive a refresh during the wizard (session only; cleared after results).
  useEffect(() => { try { sessionStorage.setItem(DRAFT_KEY, JSON.stringify(form)); } catch { /* storage unavailable */ } }, [form]);

  const set = (k) => (v) => setForm(f => ({ ...f, [k]: v }));
  const num = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value === '' ? '' : Number(e.target.value) }));
  const range = SCORE_RANGES[form.languageTest];

  const validate = () => {
    if (step === 2) {
      if (!(form.age >= 16 && form.age <= 100)) return 'Age must be between 16 and 100.';
      if (!(form.yearsOfWorkExperience >= 0 && form.yearsOfWorkExperience <= 60)) return 'Work experience must be between 0 and 60 years.';
    }
    if (step === 3) {
      if (range && !(form.languageScore >= range[0] && form.languageScore <= range[1])) return `${form.languageTest} score must be between ${range[0]} and ${range[1]}.`;
      if (!(form.savingsAmount >= 0)) return 'Savings can’t be negative.';
    }
    if (step === 4 && files.length > 0 && !consent) return 'Please confirm consent before uploading documents, or remove them.';
    return '';
  };

  const next = async () => {
    const er = validate();
    setError(er);
    if (er) return;
    if (step < STEPS.length - 1) { setStep(step + 1); return; }
    setLoading(true);
    try {
      const res = await immigrationApi.analyze({ ...form, languageScore: form.languageTest === 'None' ? 0 : form.languageScore, aiDocumentConsent: consent }, files);
      setResult(res.data.data);
      try { sessionStorage.removeItem(DRAFT_KEY); } catch { /* storage unavailable */ }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err.response?.status === 413 ? 'Your files are too large. Each must be under 5 MB.' : apiErrorMessage(err, 'Assessment failed.'));
    } finally { setLoading(false); }
  };

  const addFile = (file, docType) => {
    if (!file) return;
    if (!/\.(pdf|jpe?g|png)$/i.test(file.name)) { toast.error('Use a PDF, JPG or PNG file.'); return; }
    if (file.size > MAX_DOC_BYTES) { toast.error(`${file.name} is larger than 5 MB.`); return; }
    setFiles(f => [...f.filter(x => x.docType !== docType), { file, docType }].slice(0, MAX_DOCS));
  };

  return (
    <div className="space-y-4">
      <section className="relative rounded-media overflow-hidden bg-navy h-[170px] flex items-end">
        <img src={IMG.holoLiquid} alt="" className="absolute right-0 top-0 h-full w-[60%] object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/90 to-transparent" />
        <div className="relative p-6 text-white"><h1 className="display text-white text-[36px] md:text-[40px]">Profile strength check</h1>
          <p className="text-[17px] text-white/85">A general 0–100 indicator with suggestions. Your answers aren&apos;t saved.</p></div>
      </section>
      <p className="warn text-[15px]">This is a general profile-strength indicator, not a visa prediction or an official points test. Immigration decisions are made only by government authorities.</p>

      {result ? <Results result={result} form={form} onEdit={() => { setResult(null); setStep(0); }} /> : (
        <>
          <div className="flex gap-2 pt-2" aria-hidden="true">{STEPS.map((s, i) => <span key={s} className={`h-1 flex-1 rounded-full ${i <= step ? 'bg-electric' : 'bg-line'}`} />)}</div>
          <p className="text-[14.5px] font-medium text-muted">Step {step + 1} of {STEPS.length} · {STEPS[step]}</p>
          <div className="card p-6 max-w-[880px]">
            {step === 0 && (<><h2 className="text-[24px] mb-4">Which country are you planning for?</h2>
              <Choice options={countries} value={form.destinationCountry} onChange={set('destinationCountry')} label={c => COUNTRY_LABEL[c] || humanize(c)} /></>)}
            {step === 1 && (<><h2 className="text-[24px] mb-4">Which visa pathway?</h2>
              <Choice options={visas} value={form.visaType} onChange={set('visaType')} /></>)}
            {step === 2 && (
              <><h2 className="text-[24px] mb-4">About you</h2>
                <p className="label">Highest education</p><Choice options={EDUCATION} value={form.educationLevel} onChange={set('educationLevel')} />
                <div className="grid sm:grid-cols-3 gap-4 mt-5">
                  <div><label htmlFor="ps-age" className="label">Age</label><input id="ps-age" type="number" inputMode="numeric" min={16} max={100} className="input" value={form.age} onChange={num('age')} /></div>
                  <div><label htmlFor="ps-exp" className="label">Years of work experience</label><input id="ps-exp" type="number" inputMode="numeric" min={0} max={60} className="input" value={form.yearsOfWorkExperience} onChange={num('yearsOfWorkExperience')} /></div>
                  <div><label htmlFor="ps-job" className="label">Job title <span className="font-normal text-muted">(optional)</span></label><input id="ps-job" className="input" maxLength={150} value={form.jobTitle} onChange={e => set('jobTitle')(e.target.value)} /></div>
                </div>
                <div className="mt-3"><YesNo label="I have a job offer in the destination country" value={form.hasJobOffer} onChange={set('hasJobOffer')} /></div>
              </>)}
            {step === 3 && (
              <><h2 className="text-[24px] mb-4">Language and finances</h2>
                <p className="label">English test</p><Choice options={['None', 'IELTS', 'TOEFL', 'PTE', 'OET']} value={form.languageTest} onChange={v => setForm(f => ({ ...f, languageTest: v, languageScore: SCORE_RANGES[v] ? Math.min(Math.max(f.languageScore, SCORE_RANGES[v][0]), SCORE_RANGES[v][1]) : 0 }))} label={v => v} />
                <div className="grid sm:grid-cols-2 gap-4 mt-5">
                  {range && <div><label htmlFor="ps-score" className="label">{form.languageTest} overall score <span className="font-normal text-muted">({range[0]}–{range[1]})</span></label>
                    <input id="ps-score" type="number" inputMode="decimal" min={range[0]} max={range[1]} step={range[2]} className="input" value={form.languageScore} onChange={num('languageScore')} /></div>}
                  <div><label htmlFor="ps-sav" className="label">Savings (USD)</label><input id="ps-sav" type="number" inputMode="decimal" min={0} className="input" value={form.savingsAmount} onChange={num('savingsAmount')} /></div>
                </div>
              </>)}
            {step === 4 && (
              <><h2 className="text-[24px] mb-2">Personal factors</h2>
                <label htmlFor="ps-mar" className="label mt-2">Marital status</label>
                <select id="ps-mar" className="input max-w-[300px]" value={form.maritalStatus} onChange={e => set('maritalStatus')(e.target.value)}>{['Single', 'Married', 'Divorced', 'Widowed'].map(m => <option key={m}>{m}</option>)}</select>
                <div className="mt-3">
                  <YesNo label="I have family in the destination country" value={form.hasFamilyInDestination} onChange={set('hasFamilyInDestination')} />
                  <YesNo label="I have had a visa refused before" value={form.hasPriorVisaRefusal} onChange={set('hasPriorVisaRefusal')} />
                  <YesNo label="I have a criminal record" value={form.hasCriminalRecord} onChange={set('hasCriminalRecord')} />
                </div>
                <h3 className="font-sans font-semibold text-[17px] tracking-normal mt-6">Documents <span className="text-muted font-normal">(optional, up to {MAX_DOCS})</span></h3>
                <p className="text-muted text-[14.5px]">PDF, JPG or PNG up to 5 MB. We check completeness and expiry — not authenticity.</p>
                <div className="grid sm:grid-cols-2 gap-2.5 mt-3">
                  {DOC_TYPES.map(t => {
                    const f = files.find(x => x.docType === t);
                    return (
                      <div key={t} className={`rounded-[14px] border border-dashed px-3.5 py-3 flex items-center gap-3 ${f ? 'border-electric bg-[#F8F9FF]' : 'border-[#B8C2D0] bg-[#F5F8FC]'}`}>
                        <FileText size={18} className="text-electric shrink-0" />
                        <span className="flex-1 min-w-0"><span className="block font-medium text-[15px]">{humanize(t)}</span>{f && <span className="block text-[13px] text-muted truncate">{f.file.name}</span>}</span>
                        {f ? <button type="button" aria-label={`Remove ${humanize(t)}`} onClick={() => setFiles(x => x.filter(y => y.docType !== t))} className="w-8 h-8 rounded-full bg-white border border-line inline-flex items-center justify-center"><X size={14} /></button>
                          : <label className="btn-ghost btn-sm bg-white cursor-pointer focus-within:ring-2 focus-within:ring-electric"><Upload size={14} />Add<input type="file" accept=".pdf,.jpg,.jpeg,.png" className="sr-only" aria-label={`Upload ${humanize(t)}`} onChange={e => { addFile(e.target.files[0], t); e.target.value = ''; }} /></label>}
                      </div>
                    );
                  })}
                </div>
                {files.length > 0 && (
                  <label className="flex items-start gap-3 mt-4 text-[15px] note">
                    <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} className="w-5 h-5 mt-0.5 accent-electric" />
                    I consent to these documents being sent to LandEase&apos;s AI provider (Google Gemini) to generate a completeness check. They are not stored by LandEase.
                  </label>
                )}
              </>)}
            {error && <p role="alert" className="field-error text-[14.5px] mt-4">{error}</p>}
            <div className="flex justify-between gap-3 mt-6">
              {step > 0 ? <button type="button" onClick={() => { setError(''); setStep(step - 1); }} className="btn-ghost">Back</button> : <span />}
              <button type="button" onClick={next} disabled={loading} className="btn-ink">{loading && <span className="spinner w-4 h-4" />}{step < STEPS.length - 1 ? 'Continue' : loading ? (files.length ? 'Checking documents…' : 'Scoring…') : 'Check profile strength'}</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Results({ result, form, onEdit }) {
  const [c, , badge] = tone(result.overallScore);
  const list = (title, items, cls) => items?.length > 0 && (
    <div className="card p-5"><h3 className={`font-sans font-semibold text-[17px] tracking-normal ${cls}`}>{title}</h3><ul className="list-disc pl-5 mt-2 space-y-1 text-muted">{items.map((s, i) => <li key={i}>{s}</li>)}</ul></div>
  );
  return (
    <div className="space-y-4 animate-fade-up">
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4">
        <div className="card p-6 text-center">
          <p className="text-[13.5px] text-muted">{result.assessmentType}</p>
          <p className={`numeral text-[80px] mt-2 ${c}`}>{result.overallScore}<span className="text-[28px] text-twotone">/100</span></p>
          <span className={`${badge} h-7 px-3 text-[14px]`}>{result.strengthLevel}</span>
          <p className="text-[13.5px] text-muted mt-4">{result.officialSourceHint}</p>
        </div>
        <div className="card p-6">
          <h2 className="text-[22px]">Category breakdown</h2>
          <div className="space-y-3.5 mt-4">
            {result.categories.map(cat => {
              const pct = Math.round((cat.score * 100) / cat.maxScore); const [tc, bar] = tone(pct);
              return (
                <div key={cat.category}>
                  <div className="flex justify-between text-[15px]"><span className="font-medium">{cat.category}</span><span className={tc}>{cat.score}/{cat.maxScore}</span></div>
                  <div className="h-2 rounded-full bg-[#E3E8F0] mt-1.5 overflow-hidden"><div className={`h-full rounded-full ${bar}`} style={{ width: `${pct}%` }} /></div>
                  {cat.note && <p className="text-[13.5px] text-muted mt-1">{cat.note}</p>}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div className="card p-6">
        <h2 className="text-[22px] flex items-center gap-2"><Sparkles size={18} className="text-electric" />What this means</h2>
        <p className="text-[16px] mt-2">{result.aiAnalysisAvailable ? result.aiAnalysis : 'The AI explanation is unavailable right now. The category scores above are still valid.'}</p>
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        {list('Strengths', result.strengths, 'text-[#0F7B4F]')}{list('Areas to improve', result.weaknesses, 'text-sos')}{list('Suggestions', result.suggestions, 'text-electric')}
      </div>
      {result.documentsChecked && (
        <div className="card p-6">
          <h2 className="text-[22px]">Document check</h2>
          {result.documentFlags?.length > 0 && <ul className="warn mt-3 list-disc pl-8 space-y-1">{result.documentFlags.map((f, i) => <li key={i}>{f}</li>)}</ul>}
          <div className="grid md:grid-cols-2 gap-3 mt-4">
            {result.documentResults.map((d, i) => (
              <div key={i} className="rounded-[16px] bg-[#F5F8FC] p-4">
                <div className="flex flex-wrap items-center justify-between gap-2"><p className="font-semibold">{humanize(d.documentType)}</p>
                  <span className="flex gap-1.5"><span className={d.isComplete ? 'badge-completed' : 'badge-requested'}>{d.isComplete ? 'Complete' : 'Incomplete'}</span>{d.isExpired && <span className="badge-sos">Expired</span>}</span></div>
                {d.expiryDate && <p className="text-[14px] text-muted mt-1">Expiry: {d.expiryDate}</p>}
                {d.missingFields?.map((m, j) => <p key={j} className="text-[14px] text-sos">Missing: {m}</p>)}
                {d.inconsistencies?.map((m, j) => <p key={j} className="text-[14px] text-[#9A5B00]">{m}</p>)}
              </div>
            ))}
          </div>
        </div>
      )}
      <p className="note">{result.disclaimer}</p>
      <div className="flex flex-wrap gap-3 print:hidden">
        <Link to={`/dashboard/ai-chat?q=${encodeURIComponent(`My general profile-strength score for ${COUNTRY_LABEL[form.destinationCountry] || form.destinationCountry} is ${result.overallScore}/100 (${result.strengthLevel}). What general steps could strengthen my profile?`)}`} className="btn-ink"><Sparkles size={15} />Ask the assistant about my results</Link>
        <Link to={`/dashboard/services?category=Legal&destinationCountry=${encodeURIComponent(COUNTRY_LABEL[form.destinationCountry] || form.destinationCountry)}`} className="btn-ghost"><Search size={15} />Find legal services</Link>
        <button type="button" onClick={() => window.print()} className="btn-ghost"><Printer size={15} />Print / save as PDF</button>
        <button type="button" onClick={onEdit} className="btn-ghost">Edit answers</button>
      </div>
    </div>
  );
}
