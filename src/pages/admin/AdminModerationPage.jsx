import { useState } from 'react';
import { CheckCircle2, TriangleAlert } from 'lucide-react';
import { adminApi } from '../../api/endpoints';
import { apiErrorMessage } from '../../lib/apiError';

const MAX = 4000;
const EXAMPLES = [
  ['Clean listing', 'I help newcomers open their first bank account. We go through the documents banks usually ask for and book an appointment together.'],
  ['Off-platform payment', 'Great service! Pay me directly via bank transfer to save fees and message me on WhatsApp instead.'],
  ['Contact details', 'Call me on 0412555019 or visit www.example.com for a discount.'],
];

export default function AdminModerationPage() {
  const [text, setText] = useState('');
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const check = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setBusy(true); setError(''); setResult(null);
    try { const res = await adminApi.moderateReview({ content: text.trim() }); setResult(res.data.data); }
    catch (err) { setError(apiErrorMessage(err, 'The check failed. Please try again.')); } finally { setBusy(false); }
  };

  return (
    <div>
      <h1 className="page-title">Moderation check</h1>
      <p className="page-sub text-[17px]">Paste a listing, post or review to check it against content rules before taking action.</p>
      <div className="grid grid-cols-1 lg:grid-cols-[1.25fr_1fr] gap-5 mt-6 items-start">
        <form onSubmit={check} className="card p-6">
          <div className="flex flex-wrap items-center gap-2"><span className="text-[14.5px] font-medium text-muted mr-1">Try an example:</span>
            {EXAMPLES.map(([l, t]) => <button key={l} type="button" onClick={() => { setText(t); setResult(null); }} className="chip">{l}</button>)}</div>
          <label htmlFor="mod-text" className="label mt-5">Text to check</label>
          <textarea id="mod-text" className="input h-48 resize-y" maxLength={MAX} placeholder="Paste the content here" value={text} onChange={e => { setText(e.target.value); setResult(null); }} />
          <p className="text-right text-[13px] text-muted mt-1">{text.length} / {MAX}</p>
          <button type="submit" disabled={busy || !text.trim()} className="btn-ink mt-3">{busy && <span className="spinner w-4 h-4" />}Check text</button>
        </form>
        <div className="space-y-4">
          <div className="card p-6 min-h-[90px] flex items-center justify-center" aria-live="polite">
            {error ? <p className="text-sos">{error}</p> : !result ? <p className="text-muted text-[17px]">The result appears here.</p> : result.isFlagged ? (
              <div className="w-full"><p className="flex items-center gap-2 font-semibold text-[18px] text-sos"><TriangleAlert size={20} />Flagged</p><p className="mt-2">{result.reason}</p></div>
            ) : (
              <div className="w-full"><p className="flex items-center gap-2 font-semibold text-[18px] text-[#0F7B4F]"><CheckCircle2 size={20} />Looks safe</p><p className="text-muted mt-2">No phone numbers, links or policy issues were found.</p></div>
            )}
          </div>
          <p className="note border border-dashed border-[#BBD3EE]">Checks run on demand. Phone numbers and links are caught by rules; the AI check is skipped if it&apos;s unavailable. Automatic checks when content is posted, and post removal, need backend work (S2-08, G09).</p>
        </div>
      </div>
    </div>
  );
}
