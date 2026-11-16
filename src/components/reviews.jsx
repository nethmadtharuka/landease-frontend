import { useEffect, useRef, useState } from 'react';
import { Star, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { reviewsApi } from '../api/endpoints';
import { apiErrorMessage } from '../lib/apiError';
import { shortDate } from '../lib/format';
import { Avatar, Stars } from './ui';

export function RatingSummary({ reviews, average }) {
  const count = reviews.length;
  const avg = average ?? (count ? reviews.reduce((a, r) => a + r.rating, 0) / count : 0);
  return (
    <div className="flex gap-8 items-center">
      <div className="shrink-0">
        <p className="numeral text-[56px]">{avg ? avg.toFixed(1) : '—'}</p>
        <Stars value={avg} size={15} />
        <p className="text-[13.5px] text-muted mt-1">{count} review{count === 1 ? '' : 's'}</p>
      </div>
      <div className="flex-1 space-y-1.5" aria-hidden="true">
        {[5, 4, 3, 2, 1].map(n => {
          const c = reviews.filter(r => r.rating === n).length;
          return (
            <div key={n} className="flex items-center gap-3 text-[13.5px] text-muted">
              <span className="w-3">{n}</span>
              <span className="flex-1 h-1.5 rounded-full bg-[#E3E8F0] overflow-hidden"><span className="block h-full bg-[#F5A524] rounded-full" style={{ width: count ? `${(c / count) * 100}%` : 0 }} /></span>
              <span className="w-4 text-right">{c}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ReviewItem({ r }) {
  return (
    <div className="flex gap-3 py-4 border-t border-line first:border-t-0">
      <Avatar name={r.reviewerName} size={34} />
      <div className="flex-1 min-w-0">
        <div className="flex justify-between gap-3"><p className="font-semibold">{r.reviewerName}</p><p className="text-[13.5px] text-muted shrink-0">{shortDate(r.createdAt)}</p></div>
        <Stars value={r.rating} size={12} />
        {r.comment && <p className="text-muted mt-1.5 break-words">{r.comment}</p>}
      </div>
    </div>
  );
}

export function ReviewList({ reviews, initial = 3 }) {
  const [all, setAll] = useState(false);
  const shown = all ? reviews : reviews.slice(0, initial);
  return (
    <div>
      {shown.map(r => <ReviewItem key={r.id} r={r} />)}
      {!all && reviews.length > initial && (
        <button type="button" onClick={() => setAll(true)} className="btn-ghost mt-3">Show all {reviews.length} reviews</button>
      )}
    </div>
  );
}

/** Review a completed booking (POST /api/Reviews). Calls onDone(createdReview). */
export function ReviewModal({ booking, onClose, onDone }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const dialog = useRef(null);
  useEffect(() => { dialog.current?.showModal(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!rating) { setError('Choose a rating from 1 to 5 stars.'); return; }
    setBusy(true); setError('');
    try {
      const res = await reviewsApi.create({ bookingId: booking.id, rating, comment: comment.trim() || null });
      toast.success('Thanks — your review was published.');
      onDone?.(res.data.data);
      onClose();
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not submit your review.'));
      if (err.response?.status === 409) onDone?.(null);
    } finally { setBusy(false); }
  };

  return (
    <dialog ref={dialog} onClose={onClose} aria-labelledby="review-title"
      className="backdrop:bg-navy/40 rounded-card p-0 w-[min(560px,calc(100vw-24px))] shadow-float">
      <form onSubmit={submit} className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div><h2 id="review-title" className="text-[24px]">Review {booking.serviceTitle}</h2>
            <p className="text-muted text-[14.5px] mt-1">Reviews are public and shown on {booking.providerName}&apos;s profile.</p></div>
          <button type="button" onClick={onClose} aria-label="Close" className="w-10 h-10 rounded-full bg-canvas inline-flex items-center justify-center shrink-0"><X size={18} /></button>
        </div>
        <fieldset className="mt-5">
          <legend className="label">Your rating</legend>
          <div className="flex gap-1.5" role="radiogroup">
            {[1, 2, 3, 4, 5].map(n => (
              <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} star${n > 1 ? 's' : ''}`} onClick={() => setRating(n)}
                className="w-11 h-11 rounded-[12px] hover:bg-canvas inline-flex items-center justify-center">
                <Star size={26} className={n <= rating ? 'text-[#F5A524]' : 'text-line'} fill="currentColor" strokeWidth={0} />
              </button>
            ))}
          </div>
        </fieldset>
        <label htmlFor="review-comment" className="label mt-4">Comment <span className="text-muted font-normal">(optional)</span></label>
        <textarea id="review-comment" className="input h-28 resize-none" maxLength={1000} value={comment} onChange={e => setComment(e.target.value)} placeholder="What went well, what could be better?" />
        <p className="text-right text-[13px] text-muted mt-1">{comment.length} / 1000</p>
        {error && <p role="alert" className="field-error">{error}</p>}
        <div className="flex justify-end gap-2 mt-5">
          <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
          <button type="submit" disabled={busy} className="btn-ink">{busy ? <span className="spinner w-4 h-4" /> : null}Publish review</button>
        </div>
      </form>
    </dialog>
  );
}

/** Confirmation dialog for destructive actions. */
export function ConfirmDialog({ title, body, confirmLabel, danger = true, busy, onConfirm, onCancel }) {
  const dialog = useRef(null);
  useEffect(() => { dialog.current?.showModal(); }, []);
  return (
    <dialog ref={dialog} onClose={onCancel} aria-labelledby="confirm-title"
      className="backdrop:bg-navy/40 rounded-card p-0 w-[min(440px,calc(100vw-24px))] shadow-float">
      <div className="p-6">
        <h2 id="confirm-title" className="text-[22px]">{title}</h2>
        {body && <p className="text-muted mt-2">{body}</p>}
        <div className="flex justify-end gap-2 mt-6">
          <button type="button" onClick={onCancel} className="btn-ghost">Keep it</button>
          <button type="button" disabled={busy} onClick={onConfirm} className={danger ? 'btn-danger' : 'btn-ink'}>{busy && <span className="spinner w-4 h-4" />}{confirmLabel}</button>
        </div>
      </div>
    </dialog>
  );
}
