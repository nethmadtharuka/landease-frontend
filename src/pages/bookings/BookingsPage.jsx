import { useEffect, useState } from 'react';
import { bookingsApi } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const STATUS_CONFIG = {
    Pending: { color: 'badge-warning', icon: Clock },
    Confirmed: { color: 'badge-success', icon: CheckCircle },
    Completed: { color: 'badge bg-blue-900/50 text-blue-400 border border-blue-800', icon: CheckCircle },
    Cancelled: { color: 'badge-danger', icon: XCircle },
    Rejected: { color: 'badge-danger', icon: XCircle },
};

export default function BookingsPage() {
    const { user } = useAuth();
    const [bookings, setBookings] = useState([]);
    const [incoming, setIncoming] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState('mine');

    const load = async () => {
        setLoading(true);
        try {
            const [mine, inc] = await Promise.all([
                bookingsApi.getMine(),
                user?.role !== 'Migrant' ? bookingsApi.getIncoming() : Promise.resolve({ data: { data: [] } }),
            ]);
            setBookings(mine.data.data || []);
            setIncoming(inc.data.data || []);
        } catch { setBookings([]); }
        finally { setLoading(false); }
    };

    useEffect(() => { load(); }, []);

    const updateStatus = async (id, status) => {
        try {
            await bookingsApi.updateStatus(id, { status });
            toast.success(`Booking ${status.toLowerCase()}`);
            load();
        } catch { toast.error('Failed to update'); }
    };

    const BookingCard = ({ b, isIncoming }) => {
        const { color, icon: Icon } = STATUS_CONFIG[b.status] || STATUS_CONFIG.Pending;
        return (
            <div className="card space-y-3">
                <div className="flex items-start justify-between">
                    <div>
                        <h3 className="font-semibold text-white">{b.serviceName || b.serviceTitle}</h3>
                        <p className="text-sm text-gray-400 mt-0.5">{isIncoming ? `From: ${b.clientName}` : `Provider: ${b.providerName}`}</p>
                    </div>
                    <span className={color}><Icon size={10} className="mr-1" />{b.status}</span>
                </div>
                {b.scheduledDate && (
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Calendar size={14} className="text-gold-400" />
                        {new Date(b.scheduledDate).toLocaleString()}
                    </div>
                )}
                {b.notes && <p className="text-sm text-gray-500 bg-navy-900 rounded-lg p-3">{b.notes}</p>}
                {isIncoming && b.status === 'Pending' && (
                    <div className="flex gap-2 pt-2 border-t border-navy-700">
                        <button onClick={() => updateStatus(b.id, 'Confirmed')} className="btn-primary text-sm py-1.5 px-4 flex-1">
                            Accept
                        </button>
                        <button onClick={() => updateStatus(b.id, 'Rejected')} className="btn-secondary text-sm py-1.5 px-4 text-red-400 hover:text-red-300 flex-1">
                            Decline
                        </button>
                    </div>
                )}
                {!isIncoming && b.status === 'Confirmed' && (
                    <button onClick={() => updateStatus(b.id, 'Completed')} className="btn-secondary text-sm py-1.5 px-4 w-full">
                        Mark as Completed
                    </button>
                )}
            </div>
        );
    };

    const displayed = tab === 'mine' ? bookings : incoming;

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="section-title">Bookings</h1>
                <p className="section-subtitle">Manage your service appointments</p>
            </div>

            {/* Tabs */}
            {user?.role !== 'Migrant' && (
                <div className="flex gap-1 bg-navy-900 p-1 rounded-lg w-fit border border-navy-700">
                    {['mine', 'incoming'].map(t => (
                        <button key={t} onClick={() => setTab(t)}
                            className={`px-5 py-2 rounded-md text-sm font-medium transition-all duration-200
                ${tab === t ? 'bg-gold-500 text-navy-950' : 'text-gray-400 hover:text-white'}`}>
                            {t === 'mine' ? 'My Bookings' : `Incoming (${incoming.length})`}
                        </button>
                    ))}
                </div>
            )}

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="card space-y-3">
                            <div className="skeleton h-5 w-3/4 rounded" />
                            <div className="skeleton h-4 w-1/2 rounded" />
                            <div className="skeleton h-4 w-full rounded" />
                        </div>
                    ))}
                </div>
            ) : displayed.length === 0 ? (
                <div className="card text-center py-16">
                    <Calendar size={48} className="text-navy-600 mx-auto mb-4" />
                    <p className="text-gray-400">No bookings found</p>
                    <p className="text-gray-600 text-sm mt-1">
                        {tab === 'mine' ? 'Browse services to make your first booking' : 'No incoming requests yet'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {displayed.map(b => (
                        <BookingCard key={b.id} b={b} isIncoming={tab === 'incoming'} />
                    ))}
                </div>
            )}
        </div>
    );
}
