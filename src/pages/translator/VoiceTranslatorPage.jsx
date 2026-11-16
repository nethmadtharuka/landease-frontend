import { useEffect, useRef, useState } from 'react';
import { Mic, Square, ArrowLeftRight, Volume2, VolumeX, Copy, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { aiApi } from '../../api/endpoints';
import { apiErrorMessage } from '../../lib/apiError';
import { IMG } from '../../lib/media';

const LANGUAGES = [
  { code: 'en', label: 'English', voice: 'en-US' }, { code: 'si', label: 'Sinhala', voice: 'si-LK' },
  { code: 'ta', label: 'Tamil', voice: 'ta-IN' }, { code: 'hi', label: 'Hindi', voice: 'hi-IN' },
  { code: 'zh', label: 'Chinese', voice: 'zh-CN' }, { code: 'ar', label: 'Arabic', voice: 'ar-SA', rtl: true },
  { code: 'fr', label: 'French', voice: 'fr-FR' }, { code: 'de', label: 'German', voice: 'de-DE' },
  { code: 'es', label: 'Spanish', voice: 'es-ES' }, { code: 'pt', label: 'Portuguese', voice: 'pt-BR' },
  { code: 'ja', label: 'Japanese', voice: 'ja-JP' }, { code: 'ko', label: 'Korean', voice: 'ko-KR' },
  { code: 'ne', label: 'Nepali', voice: 'ne-NP' }, { code: 'ur', label: 'Urdu', voice: 'ur-PK', rtl: true },
  { code: 'bn', label: 'Bengali', voice: 'bn-BD' }, { code: 'tl', label: 'Filipino', voice: 'fil-PH' },
];
const PHRASES = [
  ['Emergency', ['I need help', 'Please call an ambulance', 'Where is the nearest hospital?']],
  ['Transport', ['Which platform goes to the city?', 'How much is a ticket?']],
  ['Housing', ['When is the rent due?', 'The heater is not working']],
  ['Official', ['I have an appointment at 10', 'Can you write that down for me?']],
];
const MAX = 2000; // TranslateValidator
const lang = (code) => LANGUAGES.find(l => l.code === code);
const SpeechRecognition = typeof window !== 'undefined' ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null;

export default function VoiceTranslatorPage() {
  const [fromLang, setFromLang] = useState('en');
  const [toLang, setToLang] = useState('ja');
  const [text, setText] = useState('');
  const [result, setResult] = useState('');
  const [recording, setRecording] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState([]);
  const recognition = useRef(null);
  const finalText = useRef('');
  const canSpeak = typeof window !== 'undefined' && 'speechSynthesis' in window;

  useEffect(() => () => { recognition.current?.abort?.(); if (canSpeak) window.speechSynthesis.cancel(); }, [canSpeak]);

  const speak = (value, code) => {
    if (!canSpeak || !value) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(value);
    const voice = lang(code)?.voice || 'en-US';
    u.lang = voice; u.rate = 0.9;
    const match = window.speechSynthesis.getVoices().find(v => v.lang.startsWith(voice.split('-')[0]));
    if (match) u.voice = match;
    u.onstart = () => setSpeaking(true); u.onend = () => setSpeaking(false); u.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(u);
  };

  const translate = async (value = text) => {
    const source = value.trim();
    if (!source) { toast.error('Speak or type something first.'); return; }
    setTranslating(true); setResult('');
    try {
      const res = await aiApi.translate({ text: source, fromLanguage: lang(fromLang).label, toLanguage: lang(toLang).label });
      const out = res.data.data?.reply || '';
      setResult(out);
      setHistory(h => [{ source, out, from: fromLang, to: toLang, at: Date.now() }, ...h].slice(0, 10));
      speak(out, toLang);
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Translation failed. Please try again.'));
    } finally { setTranslating(false); }
  };

  // Tap to start, tap again to stop (works with keyboard as well as touch); translates when speech ends.
  const toggleRecording = () => {
    if (!SpeechRecognition) { toast.error('Voice input works in Chrome and Edge. You can still type.'); return; }
    if (recording) { recognition.current?.stop(); return; }
    const r = new SpeechRecognition();
    r.lang = lang(fromLang)?.voice || 'en-US';
    r.continuous = false; r.interimResults = true;
    finalText.current = '';
    r.onstart = () => { setRecording(true); setText(''); setResult(''); };
    r.onresult = (e) => {
      const all = Array.from(e.results);
      setText(all.map(x => x[0].transcript).join(''));
      const fin = all.filter(x => x.isFinal).map(x => x[0].transcript).join('');
      if (fin) finalText.current = fin;
    };
    r.onerror = (e) => { setRecording(false); toast.error(e.error === 'no-speech' ? 'No speech detected. Please try again.' : e.error === 'not-allowed' ? 'Microphone permission was denied.' : `Recording error: ${e.error}`); };
    r.onend = () => { setRecording(false); if (finalText.current) translate(finalText.current); };
    recognition.current = r;
    r.start();
  };

  const swap = () => { setFromLang(toLang); setToLang(fromLang); setText(result); setResult(''); };
  const copy = async () => {
    try { await navigator.clipboard.writeText(result); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { toast.error('Could not copy.'); }
  };
  const to = lang(toLang); const from = lang(fromLang);

  return (
    <div className="space-y-5">
      <section className="relative rounded-media overflow-hidden h-[170px] flex items-end">
        <img src={IMG.kyotoStreet} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-royal/90 via-royal/60 to-transparent" />
        <div className="relative p-6 text-white"><h1 className="display text-white text-[36px] md:text-[40px]">Voice translator</h1><p className="text-[17px] text-white/90">Speak or type, then play the translation out loud.</p></div>
      </section>

      <div className="card p-3 grid grid-cols-[1fr_auto_1fr] items-end gap-2.5">
        <div><label htmlFor="t-from" className="label text-[14px] pl-1">From</label>
          <select id="t-from" className="input" value={fromLang} onChange={e => setFromLang(e.target.value)}>{LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}</select></div>
        <button type="button" onClick={swap} aria-label="Swap languages" className="w-12 h-12 rounded-full border border-line bg-white inline-flex items-center justify-center hover:border-twotone"><ArrowLeftRight size={17} /></button>
        <div><label htmlFor="t-to" className="label text-[14px] pl-1">To</label>
          <select id="t-to" className="input" value={toLang} onChange={e => setToLang(e.target.value)}>{LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}</select></div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="card p-5 flex flex-col">
          <div className="flex justify-between items-center"><label htmlFor="t-text" className="font-semibold text-[17px]">{from.label}</label><span className="text-[13.5px] text-muted">{text.length} / {MAX}</span></div>
          <textarea id="t-text" lang={fromLang} dir={from.rtl ? 'rtl' : undefined} className="input h-36 resize-y mt-3" maxLength={MAX}
            placeholder={recording ? 'Listening…' : 'Type or tap the microphone'} value={text} onChange={e => setText(e.target.value)} />
          <div className="flex items-center gap-3 mt-4">
            <button type="button" onClick={toggleRecording} aria-pressed={recording} aria-label={recording ? 'Stop recording' : `Start speaking in ${from.label}`}
              className={`w-14 h-14 rounded-full inline-flex items-center justify-center text-white shrink-0 transition-colors ${recording ? 'bg-sos ring-8 ring-sos/15 animate-pulse' : 'bg-ink-pill hover:bg-ink'}`}>
              {recording ? <Square size={18} fill="currentColor" /> : <Mic size={20} />}
            </button>
            <span className="text-[14.5px] text-muted flex-1" aria-live="polite">{recording ? 'Listening… tap to stop' : SpeechRecognition ? `Tap to speak in ${from.label}` : 'Voice input works in Chrome and Edge'}</span>
            <button type="button" onClick={() => translate()} disabled={!text.trim() || translating} className="btn-ink">{translating && <span className="spinner w-4 h-4" />}Translate</button>
          </div>
        </div>
        <div className="rounded-card bg-navy text-white p-5 flex flex-col min-h-[260px]">
          <p className="font-semibold text-[17px]">{to.label}</p>
          <div className="flex-1 mt-3" aria-live="polite">
            {translating ? <div className="space-y-2"><div className="h-4 rounded bg-white/10 animate-pulse" /><div className="h-4 w-2/3 rounded bg-white/10 animate-pulse" /></div>
              : result ? <p lang={toLang} dir={to.rtl ? 'rtl' : undefined} className="text-[20px] leading-relaxed break-words">{result}</p>
              : <p className="text-white/60 text-[17px]">Your translation appears here.</p>}
          </div>
          <div className="flex gap-2 mt-4">
            <button type="button" disabled={!result || !canSpeak} onClick={() => (speaking ? (window.speechSynthesis.cancel(), setSpeaking(false)) : speak(result, toLang))}
              className="btn-sm btn bg-white/90 text-ink hover:bg-white disabled:bg-white/20 disabled:text-white/50">{speaking ? <><VolumeX size={15} />Stop</> : <><Volume2 size={15} />Play aloud</>}</button>
            <button type="button" disabled={!result} onClick={copy} className="btn-sm btn bg-white/10 text-white hover:bg-white/20 disabled:text-white/40">{copied ? <><Check size={15} />Copied</> : <><Copy size={15} />Copy</>}</button>
          </div>
        </div>
      </div>

      <section>
        <h2 className="text-[24px] mb-3">Quick phrases</h2>
        <div className="space-y-2.5">
          {PHRASES.map(([cat, list]) => (
            <div key={cat} className="flex flex-wrap items-center gap-2"><span className="w-[90px] text-[14.5px] font-medium text-muted">{cat}</span>
              {list.map(p => <button key={p} type="button" onClick={() => { setText(p); translate(p); }} className="chip h-10 px-4 text-[15px]">{p}</button>)}</div>
          ))}
        </div>
      </section>

      {history.length > 0 && (
        <section className="card p-5">
          <div className="flex items-center justify-between"><h2 className="text-[20px]">This session</h2><button type="button" onClick={() => setHistory([])} className="text-[14px] text-muted hover:text-ink">Clear</button></div>
          <ul className="mt-2">{history.map(h => (
            <li key={h.at} className="py-3 border-b border-line last:border-0 flex gap-3 items-start">
              <div className="flex-1 min-w-0"><p className="text-[14px] text-muted">{lang(h.from).label} → {lang(h.to).label}</p><p className="break-words">{h.source}</p><p lang={h.to} className="font-semibold break-words">{h.out}</p></div>
              {canSpeak && <button type="button" onClick={() => speak(h.out, h.to)} aria-label="Play translation" className="w-9 h-9 rounded-full bg-canvas inline-flex items-center justify-center shrink-0"><Volume2 size={15} /></button>}
            </li>))}</ul>
        </section>
      )}
      <p className="note border border-dashed border-[#BBD3EE]">Voice input works in Chrome and Edge. Text is sent to Google Gemini for translation and isn&apos;t saved by LandEase.</p>
    </div>
  );
}
