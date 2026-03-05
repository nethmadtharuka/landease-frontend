import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { servicesApi, bookingsApi, reviewsApi } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { Star, Calendar, User, ArrowLeft, Tag, Send } from 'lucide-react';

export default function ServiceDetailPage() {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [service, setService] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [booking, setBooking] = useState({ scheduledDate: '', notes: '' });
    const [bookingLoading, setBookingLoading] = useState(false);
    const [review, setReview] = useState({ rating: 5, comment: '' });

    useEffect(() => {
        const load = async () => {
            try {
                // Load service first to get providerId
                const svc = await servicesApi.getById(id);
                const service = svc.data.data;
                setService(service);
                // Fetch reviews using the provider's user ID, not the service ID
                if (service?.providerId) {
                    const rev = await reviewsApi.getByProvider(service.providerId);
                    setReviews(rev.data.data || []);
                }
            } catch { toast.error('Service not found'); navigate('/services'); }
            finally { setLoading(false); }
        };
        load();
    }, [id]);

    const handleBook = async (e) => {
        e.preventDefault();
        setBookingLoading(true);
        try {
            await bookingsApi.create({ serviceId: id, ...booking });
            toast.success('Booking request sent!');
            setBooking({ scheduledDate: '', notes: '' });
        } catch (err) {
            toast.error(err.response?.data?.message || 'Booking failed');
        } finally { setBookingLoading(false); }
    };

    const handleReview = async (e) => {
        e.preventDefault();
        try {
            await reviewsApi.create({ serviceId: id, ...review });
            toast.success('Review submitted!');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Review failed');
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
            <button onClick={() => navigate('/services')} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm">
                <ArrowLeft size={16} /> Back to Services
            </button>

            {/* Header */}
            <div className="card">
                <div className="flex items-start justify-between mb-4">
                    <span className="badge-info">{service?.category}</span>
                    <span className="text-2xl font-bold text-gold-400">${service?.price}</span>
                </div>
                <h1 className="text-2xl font-display font-bold text-white mb-3">{service?.title}</h1>
                <p className="text-gray-400 leading-relaxed mb-6">{service?.description}</p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-navy-700">
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                        <User size={15} className="text-gold-400" />
                        <span>{service?.providerName}</span>
                    </div>
                    {service?.providerRating > 0 && (
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                            <Star size={15} className="text-gold-400" fill="currentColor" />
                            <span>{service?.providerRating} rating</span>
                        </div>
                    )}
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Tag size={15} className="text-gold-400" />
                        <span>{service?.category}</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Booking Form */}
                {user?.role === 'Migrant' && (
                    <div className="card">
                        <h2 className="text-lg font-display font-bold text-white mb-4 flex items-center gap-2">
                            <Calendar size={18} className="text-gold-400" /> Book this Service
                        </h2>
                        <form onSubmit={handleBook} className="space-y-4">
                            <div>
                                <label className="label">Preferred Date & Time</label>
                                <input type="datetime-local" className="input"
                                    value={booking.scheduledDate}
                                    onChange={e => setBooking({ ...booking, scheduledDate: e.target.value })}
                                    required />
                            </div>
                            <div>
                                <label className="label">Notes (optional)</label>
                                <textarea className="input resize-none h-24"
                                    placeholder="Any special requirements..."
                                    value={booking.notes}
                                    onChange={e => setBooking({ ...booking, notes: e.target.value })} />
                            </div>
                            <button type="submit" disabled={bookingLoading}
                                className="btn-primary w-full flex items-center justify-center gap-2">
                                {bookingLoading
                                    ? <div className="w-5 h-5 border-2 border-navy-950 border-t-transparent rounded-full animate-spin" />
                                    : <><Calendar size={16} /> Request Booking</>}
                            </button>
                        </form>
                    </div>
                )}

                {/* Reviews */}
                <div className="card">
                    <h2 className="text-lg font-display font-bold text-white mb-4 flex items-center gap-2">
                        <Star size={18} className="text-gold-400" /> Reviews ({reviews.length})
                    </h2>
                    {reviews.length === 0 ? (
                        <p className="text-gray-500 text-sm">No reviews yet.</p>
                    ) : (
                        <div className="space-y-3 max-h-48 overflow-y-auto">
                            {reviews.map((r, i) => (
                                <div key={i} className="bg-navy-900 rounded-lg p-3">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-sm font-medium text-white">{r.reviewerName}</span>
                                        <div className="flex">
                                            {Array(5).fill(0).map((_, j) => (
                                                <Star key={j} size={12} className={j < r.rating ? 'text-gold-400' : 'text-navy-600'} fill="currentColor" />
                                            ))}
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-400">{r.comment}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    {user?.role === 'Migrant' && (
                        <form onSubmit={handleReview} className="mt-4 pt-4 border-t border-navy-700 space-y-3">
                            <div>
                                <label className="label">Your Rating</label>
                                <div className="flex gap-2">
                                    {[1, 2, 3, 4, 5].map(n => (
                                        <button key={n} type="button" onClick={() => setReview({ ...review, rating: n })}>
                                            <Star size={20} className={n <= review.rating ? 'text-gold-400' : 'text-navy-600'} fill="currentColor" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <textarea className="input resize-none h-20 text-sm"
                                placeholder="Share your experience..."
                                value={review.comment}
                                onChange={e => setReview({ ...review, comment: e.target.value })} required />
                            <button type="submit" className="btn-secondary w-full flex items-center justify-center gap-2 text-sm">
                                <Send size={14} /> Submit Review
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
