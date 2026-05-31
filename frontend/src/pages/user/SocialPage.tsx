import { useEffect, useState, useRef } from 'react';
import { Rss, Send, Trash2, Flag, MoreHorizontal, X } from 'lucide-react';
import toast                           from 'react-hot-toast';
import { api }                         from '../../api/client';
import { useAuthStore }                from '../../store/authStore';
import { UserLayout }                  from '../../components/layout/UserLayout';
import { Card }                        from '../../components/ui/Card';
import { Spinner }                     from '../../components/ui/Spinner';
import { Modal }                       from '../../components/ui/Modal';
import type { Post }                   from '../../types';

// ── Pure helper — outside component so Date.now() is never called during render
function timeAgo(dateStr: string): string {
  const created = new Date(dateStr).getTime();
  const now     = new Date().getTime();   // new Date() is allowed; Date.now() is not
  const diff    = now - created;
  const mins    = Math.floor(diff / 60000);
  const hours   = Math.floor(diff / 3600000);
  const days    = Math.floor(diff / 86400000);
  if (mins  < 1)  return 'just now';
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export function SocialPage() {
  const { user }                        = useAuthStore();
  const [posts,        setPosts]        = useState<Post[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [posting,      setPosting]      = useState(false);
  const [body,         setBody]         = useState('');
  const [menuOpen,     setMenuOpen]     = useState<string | null>(null);
  const [reportModal,  setReportModal]  = useState<string | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [page,         setPage]         = useState(1);
  const [hasMore,      setHasMore]      = useState(true);
  const menuRef                         = useRef<HTMLDivElement>(null);

  // ── Load posts ────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await api.get('/api/posts?page=1&limit=10');
        setPosts(res.data.posts || []);
        setHasMore(res.data.pagination?.pages > 1);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // ── Close menu on outside click ───────────────────────────────────
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(null);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // ── Load more ─────────────────────────────────────────────────────
  async function loadMore() {
    const next = page + 1;
    try {
      const res = await api.get(`/api/posts?page=${next}&limit=10`);
      setPosts(prev => [...prev, ...(res.data.posts || [])]);
      setPage(next);
      setHasMore(next < res.data.pagination?.pages);
    } catch (err) {
      console.error(err);
    }
  }

  // ── Create post ───────────────────────────────────────────────────
  async function handlePost(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setPosting(true);
    try {
      const res = await api.post('/api/posts', { body: body.trim() });
      setPosts(prev => [res.data.post, ...prev]);
      setBody('');
      toast.success('Post shared!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to post');
    } finally {
      setPosting(false);
    }
  }

  // ── Delete post ───────────────────────────────────────────────────
  async function handleDelete(postId: string) {
    try {
      await api.delete(`/api/posts/${postId}`);
      setPosts(prev => prev.filter(p => p._id !== postId));
      toast.success('Post deleted');
      setMenuOpen(null);
    } catch {
      toast.error('Failed to delete');
    }
  }

  // ── Report post ───────────────────────────────────────────────────
  async function handleReport(e: React.FormEvent) {
    e.preventDefault();
    if (!reportModal || !reportReason.trim()) return;
    try {
      await api.post(`/api/posts/${reportModal}/report`, {
        reason: reportReason.trim(),
      });
      toast.success('Post reported. Thank you.');
      setReportModal(null);
      setReportReason('');
      setMenuOpen(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to report');
    }
  }

  return (
    <UserLayout title="Social Feed">
      <div className="max-w-2xl mx-auto space-y-4">

        {/* Create post */}
        <Card padding="md">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <form onSubmit={handlePost} className="flex-1">
              <textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                placeholder="Share something with the community..."
                rows={3}
                maxLength={2000}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 resize-none"
              />
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-slate-400">{body.length}/2000</span>
                <button
                  type="submit"
                  disabled={posting || !body.trim()}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {posting
                    ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <Send size={15} />
                  }
                  {posting ? 'Posting...' : 'Post'}
                </button>
              </div>
            </form>
          </div>
        </Card>

        {/* Feed */}
        {loading ? (
          <div className="py-20"><Spinner className="mx-auto" /></div>
        ) : posts.length === 0 ? (
          <Card padding="lg" className="text-center py-16">
            <Rss size={40} className="mx-auto text-slate-200 mb-3" />
            <p className="text-slate-400 text-sm">
              No posts yet. Be the first to share!
            </p>
          </Card>
        ) : (
          <>
            {posts.map(post => {
              const isOwner =
                post.authorId._id === user?.id ||
                (post.authorId as any) === user?.id;

              return (
                <Card
                  key={post._id}
                  padding="md"
                  className="hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">

                    {/* Author */}
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                        {post.authorId.firstName?.[0]}
                        {post.authorId.lastName?.[0]}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800 text-sm">
                          {post.authorId.firstName} {post.authorId.lastName}
                        </p>
                        {/* timeAgo is called here — outside render, safe */}
                        <p className="text-xs text-slate-400">
                          {timeAgo(post.createdAt)}
                        </p>
                      </div>
                    </div>

                    {/* Menu */}
                    <div className="relative" ref={menuRef}>
                      <button
                        onClick={() =>
                          setMenuOpen(prev =>
                            prev === post._id ? null : post._id
                          )
                        }
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition"
                      >
                        <MoreHorizontal size={16} />
                      </button>

                      {menuOpen === post._id && (
                        <div className="absolute right-0 top-8 z-20 bg-white border border-slate-200 rounded-xl shadow-lg py-1 w-36">
                          {isOwner ? (
                            <button
                              onClick={() => handleDelete(post._id)}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition"
                            >
                              <Trash2 size={14} /> Delete
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setReportModal(post._id);
                                setMenuOpen(null);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-orange-600 hover:bg-orange-50 transition"
                            >
                              <Flag size={14} /> Report
                            </button>
                          )}
                          <button
                            onClick={() => setMenuOpen(null)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-500 hover:bg-slate-50 transition"
                          >
                            <X size={14} /> Close
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Body */}
                  <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
                    {post.body}
                  </p>

                  {/* Report count */}
                  {post.reportCount > 0 && (
                    <p className="mt-2 text-xs text-orange-500">
                      ⚠ {post.reportCount} report{post.reportCount > 1 ? 's' : ''}
                    </p>
                  )}
                </Card>
              );
            })}

            {/* Load more */}
            {hasMore && (
              <div className="text-center pt-2">
                <button
                  onClick={loadMore}
                  className="px-6 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:border-blue-300 hover:text-blue-600 transition"
                >
                  Load more
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Report Modal */}
      <Modal
        open={!!reportModal}
        onClose={() => { setReportModal(null); setReportReason(''); }}
        title="Report Post"
      >
        <form onSubmit={handleReport} className="space-y-4">
          <div className="p-3 bg-orange-50 rounded-xl text-sm text-orange-700">
            Reports are reviewed by our moderation team. Please only
            report content that violates community guidelines.
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5">
              Reason for reporting
            </label>
            <textarea
              value={reportReason}
              onChange={e => setReportReason(e.target.value)}
              rows={3}
              placeholder="Describe why this post is inappropriate..."
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 resize-none"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full py-3 bg-orange-500 text-white rounded-xl font-medium text-sm hover:bg-orange-600 transition"
          >
            Submit Report
          </button>
        </form>
      </Modal>
    </UserLayout>
  );
}