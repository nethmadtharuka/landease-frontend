import { useCallback, useEffect, useState } from 'react';
import { X, ExternalLink, IdCard, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminApi } from '../../api/endpoints';
import { apiErrorMessage } from '../../lib/apiError';
import { shortDate } from '../../lib/format';
import { Avatar, ErrorState } from '../../components/ui';

const DOCS = [['idDocumentUrl', 'ID'], ['selfieUrl', 'Selfie'], ['addressProofUrl', 'Address']];
const REASONS = ['The ID photo is blurred — please upload a clear, uncropped image.', 'The document has expired.', "The selfie doesn't show you holding the ID.", "The name on the ID doesn't match your account."];
const daysSince = (d) => Math.max(0, Math.floor((Date.now() - new Date(d)) / 86400000));

function ReviewDrawer({ k, onClose, onDone }) {
  const [tab, setTab] = useState(DOCS.find(([key]) => k[key])?.[0]);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [imgError, setImgError] = useState(false);
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const decide = async (isApproved) => {
    if (!isApproved && !reason.trim()) return;
    setBusy(true);
    try {
      await adminApi.reviewKyc(k.id, { isApproved, rejectionReason: isApproved ? null : reason.trim() });
      toast.success(isApproved ? `Approved — ${k.userFullName} has been emailed.` : `Declined — ${k.userFullName} has been emailed the reason.`);
      onDone(k.id);
    } catch (err) {
      toast.error(err.response?.status === 403 ? "You can't review your own submission." : apiErrorMessage(err, 'Could not save the decision.'));
      if (err.response?.status === 409) onDone(k.id);
    } finally { setBusy(false); }
  };
  const url = k[tab];
  const isPdf = url && /\.pdf(\?|$)/i.test(url);

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={`Review ${k.userFullName}`}>
      <button type="button" aria-label="Close" className="absolute inset-0 bg-navy/40" onClick={onClose} />
      <div className="absolute right-0 inset-y-0 w-full lg:w-[640px] bg-white shadow-float overflow-y-auto">
        <div className="p-6 flex items-center gap-3 border-b border-line">
          <Avatar name={k.userFullName} size={44} />
          <div className="flex-1 min-w-0"><h2 className="text-[22px] truncate">{k.userFullName}</h2><p className="text-[14px] text-muted truncate">{k.userEmail} · submitted {shortDate(k.submittedAt)}</p></div>
          <button type="button" onClick={onClose} aria-label="Close" className="w-10 h-10 rounded-full bg-canvas inline-flex items-center justify-center"><X size={18} /></button>
        </div>
        <div className="p-6">
          <div role="tablist" className="flex gap-6 border-b border-line">
            {DOCS.filter(([key]) => k[key]).map(([key, l]) => <button key={key} type="button" role="tab" aria-selected={tab === key} className="tab" onClick={() => { setTab(key); setImgError(false); }}>{l}</button>)}
          </div>
          <div className="mt-4 rounded-[16px] bg-canvas min-h-[280px] flex items-center justify-center overflow-hidden">
            {!url ? <p className="text-muted">No document.</p> : isPdf || imgError ? (
              <p className="text-center text-muted p-6">{imgError ? 'The preview couldn’t load — the link may have expired. Close and reopen the queue to refresh links.' : 'PDF document.'}<br />
                <a href={url} target="_blank" rel="noopener noreferrer" className="link inline-flex items-center gap-1 mt-2"><ExternalLink size={14} />Open in a new tab</a></p>
            ) : <img src={url} alt={`${k.userFullName} — ${tab}`} onError={() => setImgError(true)} className="max-h-[420px] w-full object-contain" />}
          </div>
          {url && <a href={url} target="_blank" rel="noopener noreferrer" className="link inline-flex items-center gap-1 mt-2 text-[14.5px]"><ExternalLink size={14} />Open full size</a>}
          <p className="note mt-4">Document links are private and expire 15 minutes after the queue loads.</p>

          {rejecting ? (
            <div className="mt-5">
              <label htmlFor="kyc-reason" className="label">Reason shown to the applicant</label>
              <div className="flex flex-wrap gap-2 mb-2">{REASONS.map(r => <button key={r} type="button" onClick={() => setReason(r)} className="chip h-8 text-[13px]">{r.split(' — ')[0].replace(/\.$/, '')}</button>)}</div>
              <textarea id="kyc-reason" className="input h-24" maxLength={1000} value={reason} onChange={e => setReason(e.target.value)} placeholder="Explain what to fix so they can resubmit." />
              <div className="flex gap-2 mt-3">
                <button type="button" disabled={busy || !reason.trim()} onClick={() => decide(false)} className="btn-danger">{busy && <span className="spinner w-4 h-4" />}Confirm decline</button>
                <button type="button" onClick={() => setRejecting(false)} className="btn-ghost">Back</button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2 mt-5">
              <button type="button" disabled={busy} onClick={() => decide(true)} className="btn-accent">{busy && <span className="spinner w-4 h-4" />}Approve</button>
              <button type="button" disabled={busy} onClick={() => setRejecting(true)} className="btn-ghost text-sos">Decline…</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminKycPage() {
  const [list, setList] = useState(null);
  const [error, setError] = useState(null);
  const [open, setOpen] = useState(null);
  const fetchQueue = useCallback(() => adminApi.getPendingKyc()
    .then(r => setList(r.data.data || []))
    .catch(err => setError(err.response?.status === 503 ? 'Document storage isn’t available; reviews are paused.' : apiErrorMessage(err, 'Could not load the queue.'))), []);
  useEffect(() => { fetchQueue(); }, [fetchQueue]);
  const load = () => { setError(null); fetchQueue(); };

  return (
    <div>
      <h1 className="page-title">KYC reviews</h1>
      <p className="page-sub text-[17px]">{list ? `${list.length} submission${list.length === 1 ? '' : 's'} waiting · oldest first` : 'Identity submissions waiting for a decision'}</p>
      <div className="mt-6">
        {error ? <ErrorState message={error} onRetry={load} /> : list === null ? <div className="card h-64 skeleton" /> : list.length === 0 ? (
          <div className="card p-10 text-center"><CheckCircle2 size={34} className="mx-auto text-[#0F7B4F]" /><p className="font-display text-[22px] mt-3">No submissions waiting</p></div>
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-[#F5F8FC] text-[14px] text-muted"><tr>
                <th className="font-medium px-4 py-3">Applicant</th><th className="font-medium px-4 py-3 hidden md:table-cell">Submitted</th>
                <th className="font-medium px-4 py-3 hidden sm:table-cell">Waiting</th><th className="font-medium px-4 py-3 hidden lg:table-cell">Documents</th><th className="px-4 py-3"><span className="sr-only">Action</span></th></tr></thead>
              <tbody>
                {list.map(k => {
                  const d = daysSince(k.submittedAt);
                  return (
                    <tr key={k.id} className="border-t border-line">
                      <td className="px-4 py-3"><span className="flex items-center gap-3"><Avatar name={k.userFullName} size={36} /><span className="min-w-0"><b className="block font-semibold">{k.userFullName}</b><span className="block text-[14px] text-muted truncate max-w-[150px] sm:max-w-[220px]">{k.userEmail}</span></span></span></td>
                      <td className="px-4 py-3 hidden md:table-cell">{shortDate(k.submittedAt)}</td>
                      <td className="px-4 py-3 hidden sm:table-cell"><span className={d >= 2 ? 'badge-requested' : 'badge-cancelled'}>{d === 0 ? 'today' : `${d} day${d > 1 ? 's' : ''}`}</span></td>
                      <td className="px-4 py-3 text-muted hidden lg:table-cell">{DOCS.filter(([key]) => k[key]).map(([, l]) => l).join(' · ')}</td>
                      <td className="px-4 py-3 text-right"><button type="button" onClick={() => setOpen(k)} className="btn-ink btn-sm"><IdCard size={14} className="hidden sm:inline" />Review</button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {open && <ReviewDrawer k={open} onClose={() => setOpen(null)} onDone={(id) => { setList(l => l.filter(x => x.id !== id)); setOpen(null); }} />}
    </div>
  );
}
