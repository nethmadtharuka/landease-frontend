import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { communityApi } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { ArrowLeft, Users, Send, MessageSquare, UserCheck, LogOut } from 'lucide-react';

export default function CommunityDetailPage() {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [community, setCommunity] = useState(null);
    const [posts, setPosts] = useState([]);
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState('posts');
    const [newPost, setNewPost] = useState('');
    const [posting, setPosting] = useState(false);

    const load = async () => {
        setLoading(true);
        try {
            const [c, p, m] = await Promise.all([
                communityApi.getById(id),
                communityApi.getPosts(id),
                communityApi.getMembers(id),
            ]);
            setCommunity(c.data.data);
            setPosts(p.data.data?.items || p.data.data || []);
            setMembers(m.data.data?.items || m.data.data || []);
        } catch {
            toast.error('Community not found');
            navigate('/community');
        } finally { setLoading(false); }
    };

    useEffect(() => { load(); }, [id]);

    const handlePost = async (e) => {
        e.preventDefault();
        if (!newPost.trim()) return;
        setPosting(true);
        try {
            await communityApi.createPost(id, { content: newPost });
            toast.success('Post published!');
            setNewPost('');
            load();
        } catch (err) { toast.error(err.response?.data?.message || 'Failed to post'); }
        finally { setPosting(false); }
    };

    const handleLeave = async () => {
        try {
            await communityApi.leave(id);
            toast.success('Left community');
            navigate('/community');
        } catch (err) { toast.error(err.response?.data?.message || 'Failed to leave'); }
    };

    if (loading) return (
        <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
            <button onClick={() => navigate('/community')} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm">
                <ArrowLeft size={16} /> Back to Communities
            </button>

            {/* Header */}
            <div className="card">
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-2xl font-display font-bold text-white mb-2">{community?.name}</h1>
                        <p className="text-gray-400">{community?.description}</p>
                        <div className="flex items-center gap-4 mt-3">
                            <span className="flex items-center gap-1.5 text-sm text-gray-500">
                                <Users size={14} className="text-gold-400" /> {members.length} members
                            </span>
                            <span className="flex items-center gap-1.5 text-sm text-gray-500">
                                <MessageSquare size={14} className="text-gold-400" /> {posts.length} posts
                            </span>
                        </div>
                    </div>
                    {community?.isMember && (
                        <button onClick={handleLeave} className="btn-secondary text-sm py-2 px-4 text-red-400 hover:text-red-300 flex items-center gap-2">
                            <LogOut size={14} /> Leave
                        </button>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-navy-900 p-1 rounded-lg w-fit border border-navy-700">
                {['posts', 'members'].map(t => (
                    <button key={t} onClick={() => setTab(t)}
                        className={`px-5 py-2 rounded-md text-sm font-medium transition-all duration-200 capitalize
              ${tab === t ? 'bg-gold-500 text-navy-950' : 'text-gray-400 hover:text-white'}`}>
                        {t}
                    </button>
                ))}
            </div>

            {tab === 'posts' ? (
                <div className="space-y-4">
                    {/* New Post */}
                    {community?.isMember && (
                        <form onSubmit={handlePost} className="card">
                            <textarea className="input resize-none h-24 text-sm mb-3"
                                placeholder="Share something with the community..."
                                value={newPost}
                                onChange={e => setNewPost(e.target.value)} />
                            <div className="flex justify-end">
                                <button type="submit" disabled={posting || !newPost.trim()}
                                    className="btn-primary text-sm py-2 px-5 flex items-center gap-2 disabled:opacity-50">
                                    {posting ? <div className="w-4 h-4 border-2 border-navy-950 border-t-transparent rounded-full animate-spin" />
                                        : <><Send size={14} /> Post</>}
                                </button>
                            </div>
                        </form>
                    )}

                    {posts.length === 0 ? (
                        <div className="card text-center py-12">
                            <MessageSquare size={40} className="text-navy-600 mx-auto mb-3" />
                            <p className="text-gray-400">No posts yet. Be the first to share!</p>
                        </div>
                    ) : posts.map(p => (
                        <div key={p.id} className="card">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-8 h-8 bg-navy-700 rounded-full flex items-center justify-center text-xs text-gold-400 font-bold">
                                    {p.authorName?.charAt(0)}
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-white">{p.authorName}</p>
                                    <p className="text-xs text-gray-500">{new Date(p.createdAt).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <p className="text-gray-300 text-sm leading-relaxed">{p.content}</p>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {members.map(m => (
                        <div key={m.id} className="card flex items-center gap-3">
                            <div className="w-10 h-10 bg-navy-700 rounded-full flex items-center justify-center text-gold-400 font-bold flex-shrink-0">
                                {m.fullName?.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">{m.fullName}</p>
                                <p className="text-xs text-gray-500">{m.role}</p>
                            </div>
                            {m.isKycVerified && (
                                <span className="badge-success text-xs flex-shrink-0">
                                    <UserCheck size={10} className="mr-1" /> Verified
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
