import { useEffect, useState }  from 'react';
import {
  ShieldCheck, ShieldX, EyeOff,
  Eye, Trash2, Flag, Clock,
} from 'lucide-react';
import toast                    from 'react-hot-toast';
import { api }                  from '../../api/client';
import { AdminLayout }          from '../../components/layout/AdminLayout';
import { Card }                 from '../../components/ui/Card';
import { Badge }                from '../../components/ui/Badge';
import { Modal }                from '../../components/ui/Modal';
import { Spinner }              from '../../components/ui/Spinner';

interface ModerationPost {
  _id:         string;
  body:        string;
  status:      string;
  reportCount: number;
  createdAt:   string;
  authorId:    { _id: string; firstName: string; lastName: string; email: string };
  reports:     { reason: string; createdAt: string }[];
  auditLog:    { action: string; reason: string; at: string }[];
}

function getTimestamp(dateStr: string): string {
  return new Date(dateStr).toLocaleString();
}

export function AdminModeration() {
  const [posts,      setPosts]      = useState<ModerationPost[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [tab,        setTab]        = useState<'queue' | 'all'>('queue');
  const [statusFilter, setStatusFilter] = useState('');
  const [detailPost, setDetailPost] = useState<ModerationPost | null>(null);
  const [rejectModal,setRejectModal]= useState<string | null>(null);
  const [reason,     setReason]     = useState('');
  const [acting,     setActing]     = useState(false);

  // ── Load ─────────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const url = tab === 'queue'
          ? '/api/admin/moderation/queue'
          : `/api/admin/moderation/all${statusFilter ? `?status=${statusFilter}` : ''}`;
        const res = await api.get(url);
        setPosts(tab === 'queue' ? res.data.posts : res.data.posts);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [tab, statusFilter]);

  async function refreshPosts() {
    try {
      const url = tab === 'queue'
        ? '/api/admin/moderation/queue'
        : `/api/admin/moderation/all${statusFilter ? `?status=${statusFilter}` : ''}`;
      const res = await api.get(url);
      setPosts(res.data.posts || []);
    } catch (err) {
      console.error(err);
    }
  }

  // ── Actions ───────────────────────────────────────────────────────
  async function handleAction(
    postId: string,
    action: 'approve' | 'hide' | 'unhide',
  ) {
    setActing(true);
    try {
      await api.patch(`/api/admin/moderation/${postId}/${action}`);
      toast.success(`Post ${action}d`);
      await refreshPosts();
      setDetailPost(null);
    } catch {
      toast.error('Action failed');
    } finally {
      setActing(false);
    }
  }

  async function handleReject(e: React.FormEvent) {
    e.preventDefault();
    if (!rejectModal) return;
    setActing(true);
    try {
      await api.patch(`/api/admin/moderation/${rejectModal}/reject`, { reason });
      toast.success('Post rejected');
      setRejectModal(null);
      setReason('');
      await refreshPosts();
      setDetailPost(null);
    } catch {
      toast.error('Failed to reject');
    } finally {
      setActing(false);
    }
  }

  async function handleDelete(postId: string) {
    if (!window.confirm('Permanently delete this post?')) return;
    try {
      await api.delete(`/api/admin/moderation/${postId}`);
      toast.success('Post deleted');
      setPosts(prev => prev.filter(p => p._id !== postId));
      setDetailPost(null);
    } catch {
      toast.error('Failed to delete');
    }
  }

  const statusColor: Record<string,'green'|'yellow'|'red'|'gray'> = {
    active:         'green',
    pending_review: 'yellow',
    hidden:         'gray',
    rejected:       'red',
  };

  return (
    <AdminLayout title="Content Moderation">
      <div className="space-y-5">

        {/* Tabs */}
        <div className="flex items-center justify-between">
          <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
            {(['queue','all'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition ${
                  tab === t
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {t === 'queue' ? 'Pending Queue' : 'All Posts'}
              </button>
            ))}
          </div>

          {tab === 'all' && (
            <div className="flex gap-2">
              {['','active','pending_review','hidden','rejected'].map(s => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-2 rounded-xl text-xs font-medium capitalize transition ${
                    statusFilter === s
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-slate-200 text-slate-600 hover:border-blue-300'
                  }`}
                >
                  {s === '' ? 'All' : s.replace('_',' ')}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Posts */}
        {loading ? (
          <div className="py-20"><Spinner className="mx-auto" /></div>
        ) : posts.length === 0 ? (
          <Card padding="lg" className="text-center py-16">
            <ShieldCheck size={40} className="mx-auto text-green-200 mb-3" />
            <p className="text-slate-400 text-sm">
              {tab === 'queue' ? 'No posts pending review' : 'No posts found'}
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {posts.map(post => (
              <Card key={post._id} padding="md" className="hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                      {post.authorId.firstName[0]}{post.authorId.lastName[0]}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">
                        {post.authorId.firstName} {post.authorId.lastName}
                      </p>
                      <p className="text-xs text-slate-400">{post.authorId.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {post.reportCount > 0 && (
                      <span className="flex items-center gap-1 text-xs text-red-500 font-medium">
                        <Flag size={12} /> {post.reportCount} reports
                      </span>
                    )}
                    <Badge variant={statusColor[post.status] || 'gray'} className="capitalize">
                      {post.status.replace('_',' ')}
                    </Badge>
                    <span className="flex items-center gap-1 text-xs text-slate-400">
                      <Clock size={11} /> {getTimestamp(post.createdAt)}
                    </span>
                  </div>
                </div>

                <p className="text-sm text-slate-700 mb-4 leading-relaxed line-clamp-3">
                  {post.body}
                </p>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => setDetailPost(post)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:border-blue-300 hover:text-blue-600 transition"
                  >
                    View Details
                  </button>
                  {post.status === 'pending_review' && (
                    <>
                      <button
                        onClick={() => handleAction(post._id, 'approve')}
                        disabled={acting}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 text-green-700 border border-green-100 text-xs font-medium hover:bg-green-100 transition disabled:opacity-50"
                      >
                        <ShieldCheck size={13} /> Approve
                      </button>
                      <button
                        onClick={() => setRejectModal(post._id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-700 border border-red-100 text-xs font-medium hover:bg-red-100 transition"
                      >
                        <ShieldX size={13} /> Reject
                      </button>
                      <button
                        onClick={() => handleAction(post._id, 'hide')}
                        disabled={acting}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-xs font-medium hover:bg-slate-200 transition disabled:opacity-50"
                      >
                        <EyeOff size={13} /> Hide
                      </button>
                    </>
                  )}
                  {post.status === 'hidden' && (
                    <button
                      onClick={() => handleAction(post._id, 'unhide')}
                      disabled={acting}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-100 text-xs font-medium hover:bg-blue-100 transition disabled:opacity-50"
                    >
                      <Eye size={13} /> Unhide
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(post._id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-600 border border-red-100 text-xs font-medium hover:bg-red-100 transition ml-auto"
                  >
                    <Trash2 size={13} /> Delete
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <Modal
        open={!!detailPost}
        onClose={() => setDetailPost(null)}
        title="Post Details"
        width="lg"
      >
        {detailPost && (
          <div className="space-y-5">
            {/* Full body */}
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Post Content</p>
              <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 rounded-xl p-4">
                {detailPost.body}
              </p>
            </div>

            {/* Reports */}
            {detailPost.reports?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                  Reports ({detailPost.reports.length})
                </p>
                <div className="space-y-2">
                  {detailPost.reports.map((r, i) => (
                    <div key={i} className="flex items-start gap-2 p-3 bg-red-50 rounded-xl">
                      <Flag size={13} className="text-red-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm text-red-700">{r.reason}</p>
                        <p className="text-xs text-red-400 mt-0.5">
                          {getTimestamp(r.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Audit log */}
            {detailPost.auditLog?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                  Audit History
                </p>
                <div className="space-y-2">
                  {detailPost.auditLog.map((entry, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                      <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-700 capitalize">
                          {entry.action.replace('_',' ')}
                        </p>
                        {entry.reason && (
                          <p className="text-xs text-slate-400">{entry.reason}</p>
                        )}
                      </div>
                      <p className="text-xs text-slate-400">{getTimestamp(entry.at)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-2 border-t border-slate-100">
              {detailPost.status === 'pending_review' && (
                <>
                  <button
                    onClick={() => handleAction(detailPost._id, 'approve')}
                    disabled={acting}
                    className="flex-1 py-2.5 rounded-xl bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition disabled:opacity-50"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => { setRejectModal(detailPost._id); setDetailPost(null); }}
                    className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition"
                  >
                    Reject
                  </button>
                </>
              )}
              {detailPost.status === 'hidden' && (
                <button
                  onClick={() => handleAction(detailPost._id, 'unhide')}
                  disabled={acting}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50"
                >
                  Unhide
                </button>
              )}
              <button
                onClick={() => handleDelete(detailPost._id)}
                className="flex-1 py-2.5 rounded-xl bg-red-50 text-red-600 border border-red-100 text-sm font-medium hover:bg-red-100 transition"
              >
                Delete
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Reject Modal */}
      <Modal
        open={!!rejectModal}
        onClose={() => { setRejectModal(null); setReason(''); }}
        title="Reject Post"
      >
        <form onSubmit={handleReject} className="space-y-4">
          <div className="p-3 bg-red-50 rounded-xl text-sm text-red-700">
            Rejecting this post will hide it from all users permanently.
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5">
              Reason for rejection
            </label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={3}
              placeholder="Explain why this post is being rejected..."
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 resize-none"
              required
            />
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => { setRejectModal(null); setReason(''); }}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={acting}
              className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition disabled:opacity-50"
            >
              {acting ? 'Rejecting...' : 'Reject Post'}
            </button>
          </div>
        </form>
      </Modal>
    </AdminLayout>
  );
}