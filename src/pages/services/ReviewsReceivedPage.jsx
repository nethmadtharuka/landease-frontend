import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import { reviewsApi, bookingsApi } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';
import { apiErrorMessage } from '../../lib/apiError';
import { shortDate } from '../../lib/format';
import { Avatar, EmptyState, ErrorState, Stars } from '../../components/ui';
import { RatingSummary } from '../../components/reviews';

export default function ReviewsReceivedPage() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState(null);
  const [titles, setTitles] = useState({});
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState(0);

  useEffect(() => {
    reviewsApi.getByProvider(user.id).then(r => setReviews(r.data.data || [])).catch(err => setError(apiErrorMessage(err, 'Could not load your reviews.')));
    // ReviewDto has no service title (backend gap G04); recover it from this provider's own bookings.
    bookingsApi.getIncoming().then(r => setTitles(Object.fromEntries((r.data.data || []).map(b => [b.id, b.serviceTitle])))).catch(() => {});
  }, [user.id]);

  const shown = useMemo(() => (reviews || []).filter(r => !filter || r.rating === filter), [reviews, filter]);

  return (
    <div>
      <h1 className="page-title">Reviews</h1>
      <p className="page-sub text-[17px]">What migrants say after completed bookings. Shown on your public profile.</p>
      {error ? <div className="mt-6"><ErrorState message={error} /></div> : reviews === null ? <div className="card h-60 skeleton mt-6" /> : reviews.length === 0 ? (
        <div className="mt-6"><EmptyState icon={Star} title="No reviews yet">Reviews appear after migrants complete bookings with you.</EmptyState></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-5 mt-6 items-start">
          <div className="card p-6">
            <RatingSummary reviews={reviews} average={user.averageRating || undefined} />
            <div className="flex flex-wrap gap-2 mt-5" role="group" aria-label="Filter by rating">
              {[0, 5, 4, 3, 2, 1].map(n => <button key={n} type="button" aria-pressed={filter === n} onClick={() => setFilter(n)} className={filter === n ? 'chip-active h-8' : 'chip h-8'}>{n ? `${n}★` : 'All'}</button>)}
            </div>
            <Link to={`/dashboard/providers/${user.id}`} className="btn-ghost mt-5">View public profile</Link>
          </div>
          <div className="card p-6">
            <h2 className="font-sans font-semibold text-[18px] tracking-normal pb-3 border-b border-line">All reviews</h2>
            {shown.length === 0 ? <p className="text-muted py-6">No {filter}-star reviews.</p> : shown.map(r => (
              <div key={r.id} className="flex gap-3 py-4 border-b border-line last:border-0">
                <Avatar name={r.reviewerName} size={40} />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap justify-between gap-x-3"><p className="font-semibold text-[16.5px]">{r.reviewerName}</p>
                    <p className="text-[14px] text-muted">{shortDate(r.createdAt)}{titles[r.bookingId] ? ` · ${titles[r.bookingId]}` : ''}</p></div>
                  <Stars value={r.rating} size={14} />
                  <p className={`mt-1.5 break-words ${r.comment ? '' : 'text-muted'}`}>{r.comment || '(No comment)'}</p>
                </div>
              </div>
            ))}
            <p className="note mt-4 border border-dashed border-[#BBD3EE]">Public replies to reviews are planned (backend gap G04).</p>
          </div>
        </div>
      )}
    </div>
  );
}
