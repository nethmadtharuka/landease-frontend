import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminApi } from '../../api/endpoints';
import { apiErrorMessage } from '../../lib/apiError';
import { shortDate } from '../../lib/format';
import { BackendBadge, ErrorState } from '../../components/ui';
import { ConfirmDialog } from '../../components/reviews';

const FLAG_LABEL = { NEW_USER_POSTING: 'New account posting', MULTIPLE_BAD_REVIEWS: 'Repeated 1-star reviews', PRICE_ANOMALY: 'Unusual price' };

export default function AdminFraudPage() {
  const [flags, setFlags] = useState(null);
  const [error, setError] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);
  const load = useCallback(() => { setError(null); adminApi.getFraudFlags().then(r => setFlags(r.data.data || [])).catch(err => setError(apiErrorMessage(err, 'Could not load fraud flags.'))); }, []);
  useEffect(() => { load(); }, [load]);

  const resolve = async () => {
    setBusy(true);
    try { await adminApi.resolveFlag(confirm.id); setFlags(f => f.filter(x => x.id !== confirm.id)); toast.success('Flag resolved.'); }
    catch (err) { toast.error(apiErrorMessage(err, 'Could not resolve the flag.')); } finally { setBusy(false); setConfirm(null); }
  };

  return (
    <div>
      <h1 className="page-title">Fraud flags</h1>
      <p className="page-sub text-[17px]">Automatic signals about suspicious accounts and listings.</p>
      <p className="warn mt-5 flex flex-wrap items-center gap-3 text-[15px]"><BackendBadge id="S2-08" />The fraud rules exist but nothing triggers them yet, so this list stays empty until they&apos;re wired up.</p>
      <div className="mt-5">
        {error ? <ErrorState message={error} onRetry={load} /> : flags === null ? <div className="card h-48 skeleton" /> : flags.length === 0 ? (
          <div className="card p-12 text-center">
            <span className="w-14 h-14 rounded-full bg-[#E7F6EF] text-[#0F7B4F] inline-flex items-center justify-center"><Check size={24} /></span>
            <p className="font-display text-[24px] mt-4">No unresolved flags</p>
            <p className="text-muted mt-1">Flags appear here when new accounts post immediately or prices look unusual.</p>
          </div>
        ) : (
          <div className="card overflow-hidden">
            {flags.map(f => (
              <div key={f.id} className="flex flex-wrap items-start gap-4 p-5 border-b border-line last:border-0">
                <div className="flex-1 min-w-[240px]">
                  <span className="badge-sos">{FLAG_LABEL[f.flagType] || f.flagType}</span>
                  <p className="mt-2 break-words">{f.description}</p>
                  <p className="text-[14px] text-muted mt-1">{f.userFullName} ({f.userEmail}) · flagged {shortDate(f.createdAt)} · <Link to={`/dashboard/providers/${f.userId}`} className="link">View their services</Link></p>
                </div>
                <button type="button" onClick={() => setConfirm(f)} className="btn-ghost btn-sm">Resolve</button>
              </div>
            ))}
          </div>
        )}
      </div>
      {confirm && <ConfirmDialog title="Resolve this flag?" body={`${FLAG_LABEL[confirm.flagType] || confirm.flagType} for ${confirm.userFullName}. It will leave the queue.`} confirmLabel="Resolve" danger={false} busy={busy} onConfirm={resolve} onCancel={() => setConfirm(null)} />}
    </div>
  );
}
