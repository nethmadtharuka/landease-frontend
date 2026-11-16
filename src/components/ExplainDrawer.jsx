import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { getExplanation } from '../lib/recommendations';
import { apiErrorMessage } from '../lib/apiError';

/** "Why this?" side drawer for a RecommendationDto (explanation fetched on open, cached per session). */
export default function ExplainDrawer({ rec, onClose }) {
  const [text, setText] = useState(null);
  const [error, setError] = useState(null);
  useEffect(() => {
    let alive = true;
    getExplanation(rec.serviceId).then(t => alive && setText(t)).catch(err => alive && setError(apiErrorMessage(err, 'Could not explain this suggestion.')));
    return () => { alive = false; };
  }, [rec.serviceId]);
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Why this suggestion">
      <button type="button" aria-label="Close" className="absolute inset-0 bg-navy/40" onClick={onClose} />
      <div className="absolute right-0 bottom-0 sm:inset-y-0 w-full sm:w-[440px] max-h-[85vh] sm:max-h-none rounded-t-card sm:rounded-none bg-white shadow-float p-6 overflow-y-auto">
        <div className="flex items-start justify-between gap-4">
          <div><p className="overline">Why this?</p><h2 className="text-[24px] mt-1">{rec.serviceTitle}</h2></div>
          <button type="button" onClick={onClose} aria-label="Close" className="w-10 h-10 rounded-full bg-canvas inline-flex items-center justify-center shrink-0"><X size={18} /></button>
        </div>
        <p className="note mt-5"><b>Match reason:</b> {rec.matchReason}</p>
        <div className="mt-5" aria-live="polite">
          {error ? <p className="text-sos">{error}</p> : text ? <p className="text-[16px] leading-relaxed">{text}</p>
            : <div className="space-y-2" aria-busy="true"><div className="skeleton h-4" /><div className="skeleton h-4" /><div className="skeleton h-4 w-2/3" /></div>}
        </div>
        <p className="text-[13px] text-muted mt-4">AI-generated explanation · general information only.</p>
        <Link to={`/dashboard/services/${rec.serviceId}`} className="btn-ink w-full mt-6">View service</Link>
      </div>
    </div>
  );
}
