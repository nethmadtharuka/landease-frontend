import { Fragment, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Send, MessageSquarePlus, Copy, RotateCw, Siren, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { aiApi } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';
import { apiErrorMessage } from '../../lib/apiError';
import { IMG } from '../../lib/media';
import { firstName } from '../../lib/format';
import { ConfirmDialog } from '../../components/reviews';

const SESSION_KEY = 'landease.chat.sessionId';
const DISCLAIMER = 'LandEase AI provides general information only. It is not legal or immigration advice. Always confirm with official government sources or a licensed adviser.';
const BASE_SUGGESTIONS = {
  Planning: ['How do I research visa options?', 'What documents should I prepare?', 'How do I open a bank account before I move?', 'How do I find a place to stay?', 'What should I know about the culture?'],
  NewlyArrived: ['How do I open a bank account?', 'What do I need for a rental application?', 'How do I register with a doctor?', 'How do I get a tax file number?', 'How do I make friends at work?'],
  Settled: ['How do I get my qualifications recognised?', 'How do I find a better job?', 'How do I enrol my children in school?', 'How do I make friends at work?', 'What community groups can I join?'],
};
const readSession = () => { try { return localStorage.getItem(SESSION_KEY) || null; } catch { return null; } };
const writeSession = (id) => { try { if (id) localStorage.setItem(SESSION_KEY, id); else localStorage.removeItem(SESSION_KEY); } catch { /* storage unavailable */ } };

/* Minimal safe Markdown: paragraphs, bullet/numbered lists and **bold**. Rendered as React elements (no HTML injection). */
function inline(text) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((p, i) => (p.startsWith('**') && p.endsWith('**') ? <strong key={i}>{p.slice(2, -2)}</strong> : <Fragment key={i}>{p.replace(/(^|\s)\*(\S[^*]*\S|\S)\*/g, '$1$2')}</Fragment>));
}
function Markdown({ text }) {
  const blocks = text.split(/\n{2,}/);
  return blocks.map((b, i) => {
    const lines = b.split('\n').filter(Boolean);
    if (lines.length && lines.every(l => /^\s*([-*•]|\d+[.)])\s+/.test(l))) {
      const ordered = /^\s*\d/.test(lines[0]);
      const Tag = ordered ? 'ol' : 'ul';
      return <Tag key={i} className={`${ordered ? 'list-decimal' : 'list-disc'} pl-5 space-y-1 my-2`}>{lines.map((l, j) => <li key={j}>{inline(l.replace(/^\s*([-*•]|\d+[.)])\s+/, ''))}</li>)}</Tag>;
    }
    return <p key={i} className="my-2 first:mt-0 last:mb-0">{lines.map((l, j) => <Fragment key={j}>{j > 0 && <br />}{inline(l.replace(/^#+\s*/, ''))}</Fragment>)}</p>;
  });
}

export default function AiChatPage() {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const [messages, setMessages] = useState([]);
  const [sessionId, setSessionId] = useState(readSession);
  const [input, setInput] = useState(params.get('q') || '');
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(Boolean(readSession()));
  const [confirmDelete, setConfirmDelete] = useState(false);
  const bottom = useRef(null);
  const field = useRef(null);
  const suggestions = BASE_SUGGESTIONS[user?.migrationStatus] || BASE_SUGGESTIONS.NewlyArrived;
  const dest = user?.destinationCountry;

  // Resume the last conversation from the server (the backend keeps per-session history).
  useEffect(() => {
    const id = readSession();
    if (!id) return;
    aiApi.getHistory({ sessionId: id, page: 1, pageSize: 50 })
      .then(res => setMessages((res.data.data?.items || []).slice().reverse().map(m => ({ role: m.role, content: m.content }))))
      .catch(err => toast.error(apiErrorMessage(err, 'Could not load your previous conversation.')))
      .finally(() => setHistoryLoading(false));
  }, []);
  useEffect(() => { bottom.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, [messages, loading]);

  const send = async (raw) => {
    const text = (raw ?? input).trim();
    if (!text || loading) return;
    setMessages(m => [...m, { role: 'user', content: text }]);
    setInput('');
    setLoading(true);
    try {
      const res = await aiApi.chat({ message: text, sessionId });
      const data = res.data.data;
      setSessionId(data.sessionId); writeSession(data.sessionId);
      setMessages(m => [...m, { role: 'assistant', content: data.reply, truncated: data.truncated }]);
    } catch (err) {
      const code = err.response?.data?.errorCode;
      const msg = code === 'ai_blocked' ? "I can't help with that request. Try rephrasing it."
        : err.response?.status === 429 ? "You're sending messages quickly — wait a minute and try again."
        : apiErrorMessage(err, 'Sorry, I could not answer that. Please try again.');
      setMessages(m => [...m, { role: 'assistant', error: true, content: msg, retry: text }]);
    } finally { setLoading(false); field.current?.focus(); }
  };

  const newConversation = () => { writeSession(null); setSessionId(null); setMessages([]); field.current?.focus(); };
  const clearHistory = async () => {
    try { await aiApi.clearHistory(); newConversation(); toast.success('Chat history deleted.'); }
    catch (err) { toast.error(apiErrorMessage(err, 'Failed to delete history.')); } finally { setConfirmDelete(false); }
  };
  const copy = async (t) => { try { await navigator.clipboard.writeText(t); toast.success('Copied.'); } catch { toast.error('Could not copy.'); } };
  const mentionsEmergency = (t) => /\b(SOS|emergency|danger|ambulance|police)\b/i.test(t);

  return (
    <div className={`flex border-t border-line ${user?.role === 'Migrant' ? 'h-[calc(100dvh-4rem-72px)]' : 'h-[calc(100dvh-4rem)]'} sm:h-[calc(100dvh-4rem)]`}>
      <aside className="hidden xl:flex w-[280px] shrink-0 flex-col bg-white border-r border-line p-5">
        <img src={IMG.aiHead} alt="" className="rounded-[18px] h-[150px] w-full object-cover" />
        <h2 className="text-[20px] mt-5">Try asking about</h2>
        <div className="space-y-2 mt-3">
          {suggestions.map(s => <button key={s} type="button" onClick={() => send(s)} className="w-full text-left rounded-[12px] border border-line px-3.5 py-2.5 text-[14.5px] hover:border-twotone">{s}</button>)}
        </div>
        <div className="mt-auto pt-4 border-t border-line space-y-2">
          <button type="button" onClick={newConversation} className="btn-ghost w-full"><MessageSquarePlus size={16} />New conversation</button>
          <button type="button" onClick={() => setConfirmDelete(true)} className="btn-ghost w-full text-sos/80">Delete chat history</button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 bg-[#F4F7FB]">
        <p role="note" className="bg-[#FFF4E0] text-[#7A4B00] text-[14.5px] px-5 py-3 border-b border-[#F3D8A6]">{DISCLAIMER}</p>
        <div className="xl:hidden flex justify-end gap-2 px-4 pt-3">
          <button type="button" onClick={newConversation} className="btn-ghost btn-sm bg-white"><MessageSquarePlus size={15} />New</button>
          <button type="button" onClick={() => setConfirmDelete(true)} className="btn-ghost btn-sm bg-white text-sos/80">Delete history</button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6" aria-live="polite" aria-busy={loading || historyLoading}>
          {messages.length === 0 && !historyLoading ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-[560px] mx-auto">
              <img src={IMG.aiHead} alt="" className="w-[72px] h-[72px] rounded-full object-cover" />
              <h1 className="display text-[30px] mt-4">What can I help with, {firstName(user?.fullName)}?</h1>
              <p className="text-muted text-[17px] mt-2">Questions about settling in{dest ? ` ${dest}` : ''} — housing, banking, work, healthcare or culture.</p>
              <div className="flex flex-wrap justify-center gap-2 mt-5">
                {suggestions.slice(0, 4).map(s => <button key={s} type="button" onClick={() => send(s)} className="chip h-10 px-4 text-[15px]">{s}</button>)}
              </div>
            </div>
          ) : (
            <div className="max-w-[780px] mx-auto space-y-4">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'gap-3'}`}>
                  {m.role !== 'user' && <img src={IMG.aiHead} alt="" className="w-8 h-8 rounded-full object-cover shrink-0 mt-1" />}
                  <div className={`max-w-[85%] rounded-[20px] px-4 py-3 text-[15.5px] leading-relaxed break-words
                    ${m.role === 'user' ? 'bg-ink-pill text-white rounded-br-[6px] whitespace-pre-wrap' : m.error ? 'bg-[#FDECEC] text-[#7A1A12] rounded-tl-[6px]' : 'bg-white border border-line rounded-tl-[6px]'}`}>
                    <span className="sr-only">{m.role === 'user' ? 'You said: ' : 'Assistant: '}</span>
                    {m.role === 'user' || m.error ? m.content : <Markdown text={m.content} />}
                    {m.role === 'assistant' && !m.error && (
                      <div className="flex flex-wrap gap-2 mt-2.5">
                        <button type="button" onClick={() => copy(m.content)} className="text-[13px] text-muted hover:text-ink inline-flex items-center gap-1"><Copy size={13} />Copy</button>
                        {m.truncated && <button type="button" onClick={() => send('Please continue')} className="text-[13px] text-electric font-medium">Continue</button>}
                        {mentionsEmergency(m.content) && <Link to="/dashboard/sos" className="text-[13px] text-sos font-medium inline-flex items-center gap-1"><Siren size={13} />Open SOS</Link>}
                        {/service|provider|agent|lawyer/i.test(m.content) && <Link to={`/dashboard/services${dest ? `?destinationCountry=${encodeURIComponent(dest)}` : ''}`} className="text-[13px] text-electric font-medium inline-flex items-center gap-1"><Search size={13} />Explore services</Link>}
                      </div>
                    )}
                    {m.error && m.retry && <button type="button" onClick={() => { setMessages(ms => ms.filter((_, j) => j !== i)); send(m.retry); }} className="mt-2 text-[13px] font-semibold inline-flex items-center gap-1"><RotateCw size={13} />Retry</button>}
                  </div>
                </div>
              ))}
              {(loading || historyLoading) && (
                <div className="flex gap-3"><img src={IMG.aiHead} alt="" className="w-8 h-8 rounded-full object-cover" />
                  <div className="bg-white border border-line rounded-[20px] rounded-tl-[6px] px-4 py-3.5 flex gap-1" aria-label={historyLoading ? 'Loading conversation' : 'Assistant is thinking'}>
                    {[0, 1, 2].map(n => <span key={n} className="w-2 h-2 rounded-full bg-electric animate-bounce" style={{ animationDelay: `${n * 0.15}s` }} />)}</div></div>
              )}
              <div ref={bottom} />
            </div>
          )}
        </div>

        <form onSubmit={e => { e.preventDefault(); send(); }} className="px-4 sm:px-8 pb-4 pt-2" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
          <div className="max-w-[860px] mx-auto">
            <div className="flex items-end gap-2 bg-white border border-field rounded-[22px] pl-4 pr-2 py-2 focus-within:border-electric focus-within:ring-2 focus-within:ring-electric/20">
              <label htmlFor="chat-input" className="sr-only">Your question</label>
              <textarea id="chat-input" ref={field} rows={1} maxLength={2000} value={input} onChange={e => setInput(e.target.value)} disabled={loading}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                placeholder="Ask a question..." className="flex-1 resize-none outline-none bg-transparent py-2 text-[16px] max-h-40" />
              <button type="submit" disabled={loading || !input.trim()} aria-label="Send message"
                className="w-11 h-11 rounded-full bg-ink-pill text-white inline-flex items-center justify-center disabled:bg-[#9A9A9E] shrink-0"><Send size={17} /></button>
            </div>
            <p className="text-right text-[13px] text-muted mt-1.5">{input.length} / 2000 · Your messages are processed by Google Gemini.</p>
          </div>
        </form>
      </div>
      {confirmDelete && <ConfirmDialog title="Delete all AI chat history?" body="This permanently deletes every conversation with the assistant." confirmLabel="Delete history" onConfirm={clearHistory} onCancel={() => setConfirmDelete(false)} />}
    </div>
  );
}
