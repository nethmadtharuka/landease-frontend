import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { communityApi } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { Users, Search, ArrowRight, Globe, UserCheck } from 'lucide-react';

export default function CommunityPage() {
    const { user } = useAuth();
    const [communities, setCommunities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    const load = async () => {
        setLoading(true);
        try {
            const params = {};
            if (search) params.search = search;
            const res = await communityApi.getAll(params);
            setCommunities(res.data.data?.items || res.data.data || []);
        } catch { setCommunities([]); }
        finally { setLoading(false); }
    };

    useEffect(() => { load(); }, [search]);

    const handleJoin = async (e, id) => {
        e.preventDefault();
        try {
            await communityApi.join(id);
            toast.success('Joined community!');
            load();
        } catch (err) { toast.error(err.response?.data?.message || 'Failed to join'); }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="section-title">Community</h1>
                <p className="section-subtitle">Connect with fellow migrants and helpers</p>
            </div>

            <div className="relative">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                <input className="input pl-11" placeholder="Search communities..."
                    value={search} onChange={e => setSearch(e.target.value)} />
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="card space-y-3">
                            <div className="skeleton h-6 w-3/4 rounded" />
                            <div className="skeleton h-4 w-full rounded" />
                            <div className="skeleton h-4 w-1/2 rounded" />
                        </div>
                    ))}
                </div>
            ) : communities.length === 0 ? (
                <div className="card text-center py-16">
                    <Users size={48} className="text-navy-600 mx-auto mb-4" />
                    <p className="text-gray-400">No communities found</p>
                    <p className="text-gray-600 text-sm mt-1">Be the first to create one!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {communities.map(c => (
                        <div key={c.id} className="card-hover flex flex-col">
                            <div className="flex items-start justify-between mb-3">
                                <div className="w-12 h-12 bg-gradient-to-br from-navy-600 to-navy-800 rounded-xl flex items-center justify-center">
                                    <Globe size={22} className="text-gold-400" />
                                </div>
                                {c.isVerified && <span className="badge-success text-xs">Verified</span>}
                            </div>
                            <h3 className="font-display font-bold text-white mb-2">{c.name}</h3>
                            <p className="text-sm text-gray-500 line-clamp-2 flex-1 mb-4">{c.description}</p>
                            <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                                <UserCheck size={13} className="text-gold-400" />
                                {c.memberCount || 0} members
                            </div>
                            <div className="flex gap-2 mt-auto">
                                <Link to={`/community/${c.id}`}
                                    className="btn-secondary text-sm py-2 px-3 flex items-center gap-1 flex-1 justify-center">
                                    View <ArrowRight size={13} />
                                </Link>
                                {!c.isMember && (
                                    <button onClick={(e) => handleJoin(e, c.id)}
                                        className="btn-primary text-sm py-2 px-3">
                                        Join
                                    </button>
                                )}
                                {c.isMember && (
                                    <span className="badge-success text-xs self-center px-3">Joined</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
