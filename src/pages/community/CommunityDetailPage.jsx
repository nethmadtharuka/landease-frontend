import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ChevronRight, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import { communityApi } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';
import { apiErrorMessage } from '../../lib/apiError';
import { coverFor } from '../../lib/media';
import { shortDate, timeAgo } from '../../lib/format';
import { Avatar, EmptyState, PageSpinner, Verified } from '../../components/ui';
import { ConfirmDialog } from '../../components/reviews';

export default function CommunityDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const base = user ? '/dashboard' : '';
  const [community, setCommunity] = useState(null);
  const [posts, setPosts] = useState({ items: [], page: 0, hasNextPage: false });
  const [members, setMembers] = useState({ items: [], page: 0, hasNextPage: false });
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [tab, setTab] = useState('posts');
  const [draft, setDraft] = useState('');
  const [posting, setPosting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);

  const loadPage = useCallback(async (kind, page) => {
    const fn = kind === 'posts' ? communityApi.getPosts : communityApi.getMembers;
    const res = await fn(id, { page, pageSize: kind === 'posts' ? 10 : 20 });
    const d = res.data.data;
    const setter = kind === 'posts' ? setPosts : setMembers;
    setter(prev => ({ items: page === 1 ? d.items : [...prev.items, ...d.items], page, hasNextPage: d.hasNextPage }));
  }, [id]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    Promise.all([communityApi.getById(id), loadPage('posts', 1), loadPage('members', 1)])
      .then(([c]) => alive && setCommunity(c.data.data))
      .catch(err => { if (!alive) return; if (err.response?.status === 404) setNotFound(true); else toast.error(apiErrorMessage(err, 'Could not load this community.')); })
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [id, loadPage]);

  const join = async () => {
    if (!user) { navigate(`/login?next=${encodeURIComponent(`/dashboard/community/${id}`)}`); return; }
    setBusy(true);
    try {
      await communityApi.join(id);
      setCommunity(c => ({ ...c, isMember: true, memberCount: c.memberCount + 1 }));
      loadPage('members', 1);
      toast.success('You joined this community.');
    } catch (err) { toast.error(apiErrorMessage(err, 'Could not join.')); } finally { setBusy(false); }
  };

  const leave = async () => {
    setBusy(true);
    try {
      await communityApi.leave(id);
      setCommunity(c => ({ ...c, isMember: false, memberCount: Math.max(0, c.memberCount - 1) }));
      loadPage('members', 1);
      toast.success('You left this community.');
    } catch (err) { toast.error(apiErrorMessage(err, 'Could not leave.')); } finally { setBusy(false); setConfirmLeave(false); }
  };

  const post = async (e) => {
    e.preventDefault();
    if (!draft.trim()) return;
    setPosting(true);
    try {
      const res = await communityApi.createPost(id, { content: draft.trim() });
      setPosts(p => ({ ...p, items: [res.data.data, ...p.items] }));
      setCommunity(c => ({ ...c, postCount: c.postCount + 1 }));
      setDraft('');
      toast.success('Post published.');
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not publish your post.'));
      if (err.response?.status === 403) setCommunity(c => ({ ...c, isMember: false }));
    } finally { setPosting(false); }
  };

  if (loading) return <PageSpinner />;
  const wrap = user ? 'max-w-[812px]' : 'max-w-[812px] mx-auto px-4 pt-6';
  if (notFound || !community) return <div className={wrap}><EmptyState title="Community not found" action={<Link to={`${base}/community`} className="btn-ink">All communities</Link>} /></div>;

  return (
    <div className={wrap}>
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[14.5px] text-muted">
        <Link to={`${base}/community`} className="hover:text-ink">Communities</Link><ChevronRight size={14} />
        <span className="text-ink font-medium">{community.originCountry} → {community.destinationCountry}</span>
      </nav>

      <section className="card overflow-hidden mt-4">
        <img src={coverFor(community.destinationCountry)} alt="" className="w-full h-[170px] object-cover" />
        <div className="p-6 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <h1 className="font-display text-[32px] tracking-[-0.035em]">{community.originCountry} <span className="text-twotone">→</span> {community.destinationCountry}</h1>
            <p className="text-muted mt-1">{community.description}</p>
            <p className="text-[14.5px] text-muted mt-2"><b className="text-ink">{community.memberCount}</b> members <span className="ml-3"><b className="text-ink">{community.postCount}</b> posts</span></p>
          </div>
          {community.isMember
            ? <button type="button" onClick={() => setConfirmLeave(true)} disabled={busy} className="btn-ghost bg-white">Leave</button>
            : <button type="button" onClick={join} disabled={busy} className="btn-ink">{user ? 'Join community' : 'Sign in to join'}</button>}
        </div>
      </section>

      <div role="tablist" className="flex gap-6 border-b border-line mt-6">
        {[['posts', 'Posts'], ['members', 'Members']].map(([k, l]) => (
          <button key={k} type="button" role="tab" aria-selected={tab === k} className="tab" onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>

      {tab === 'posts' ? (
        <div className="space-y-4 mt-5">
          {community.isMember ? (
            <form onSubmit={post} className="card p-4">
              <label htmlFor="composer" className="label">Write a post</label>
              <textarea id="composer" className="input h-24 resize-y" maxLength={2000} placeholder="Ask a question or share what worked for you"
                value={draft} onChange={e => setDraft(e.target.value)} />
              <div className="flex items-center justify-between mt-3">
                <span className="text-[13px] text-muted">{draft.length} / 2000</span>
                <button type="submit" disabled={posting || !draft.trim()} className="btn-ink">{posting && <span className="spinner w-4 h-4" />}Post</button>
              </div>
            </form>
          ) : (
            <div className="note flex flex-wrap items-center justify-between gap-3">
              <span>Join this community to write posts. Anyone can read.</span>
              <button type="button" onClick={join} disabled={busy} className="btn-ink btn-sm">{user ? 'Join' : 'Sign in to join'}</button>
            </div>
          )}
          {posts.items.length === 0 ? (
            <EmptyState icon={MessageSquare} title="No posts yet">Be the first to ask a question or share a tip.</EmptyState>
          ) : posts.items.map(p => (
            <article key={p.id} className="card p-5">
              <div className="flex items-center gap-3">
                <Avatar name={p.authorName} size={36} />
                <div className="leading-tight">
                  <p className="font-semibold">{p.authorName} {p.authorIsKycVerified && <Verified className="text-[13px] ml-1" />}</p>
                  <time dateTime={p.createdAt} className="text-[13.5px] text-muted">{timeAgo(p.createdAt)}</time>
                </div>
              </div>
              <p className="mt-3 text-[16px] leading-relaxed whitespace-pre-line break-words">{p.content}</p>
            </article>
          ))}
          {posts.hasNextPage && <div className="text-center"><button type="button" className="btn-ghost bg-white" onClick={() => loadPage('posts', posts.page + 1)}>Load more posts</button></div>}
        </div>
      ) : (
        <div className="mt-5">
          <div className="grid sm:grid-cols-2 gap-3">
            {members.items.map(m => (
              <div key={m.userId} className="card p-4 flex items-center gap-3">
                <Avatar name={m.fullName} size={40} />
                <div className="min-w-0 flex-1 leading-tight">
                  <p className="font-semibold truncate">{m.fullName} {m.isKycVerified && <Verified className="text-[13px] ml-1" />}</p>
                  <p className="text-[13.5px] text-muted">{m.originCountry || '—'} · joined {shortDate(m.joinedAt)}{m.averageRating > 0 ? ` · ★ ${m.averageRating}` : ''}</p>
                </div>
              </div>
            ))}
          </div>
          {members.hasNextPage && <div className="text-center mt-4"><button type="button" className="btn-ghost bg-white" onClick={() => loadPage('members', members.page + 1)}>Load more members</button></div>}
        </div>
      )}
      {confirmLeave && <ConfirmDialog title={`Leave ${community.name}?`} body="You won't be able to post until you join again." confirmLabel="Leave community" busy={busy} onConfirm={leave} onCancel={() => setConfirmLeave(false)} />}
    </div>
  );
}
