import { useEffect, useState }  from 'react';
import {
  Plus, Search, Edit2, Trash2,
  CheckCircle2, PauseCircle,
  Archive, ChevronLeft, ChevronRight,
} from 'lucide-react';
import toast                    from 'react-hot-toast';
import { api }                  from '../../api/client';
import { AdminLayout }          from '../../components/layout/AdminLayout';
import { Card }                 from '../../components/ui/Card';
import { Badge }                from '../../components/ui/Badge';
import { Modal }                from '../../components/ui/Modal';
import { Spinner }              from '../../components/ui/Spinner';
import type { Challenge }       from '../../types';

type Status = 'draft' | 'published' | 'paused' | 'archived';

const statusColor: Record<Status, 'gray'|'green'|'yellow'|'red'> = {
  draft:     'gray',
  published: 'green',
  paused:    'yellow',
  archived:  'red',
};

const blankForm = {
  title: '', description: '', type: 'steps',
  startDate: '', endDate: '',
  goal: { target: '', unit: '' },
  rules: '',
};

export function AdminChallenges() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [status,     setStatus]     = useState('');
  const [page,       setPage]       = useState(1);
  const [pages,      setPages]      = useState(1);
  const [total,      setTotal]      = useState(0);

  // Modals
  const [createModal, setCreateModal] = useState(false);
  const [editModal,   setEditModal]   = useState<Challenge | null>(null);
  const [delModal,    setDelModal]    = useState<Challenge | null>(null);
  const [saving,      setSaving]      = useState(false);
  const [form,        setForm]        = useState(blankForm);

  // ── Load ─────────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const params = new URLSearchParams({ page: String(page), limit: '10' });
        if (search) params.set('search', search);
        if (status) params.set('status', status);
        const res = await api.get(`/api/admin/challenges?${params}`);
        setChallenges(res.data.challenges || []);
        setPages(res.data.pagination?.pages || 1);
        setTotal(res.data.pagination?.total || 0);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [page, status]);

  async function handleSearch() {
    setPage(1);
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: '1', limit: '10' });
      if (search) params.set('search', search);
      if (status) params.set('status', status);
      const res = await api.get(`/api/admin/challenges?${params}`);
      setChallenges(res.data.challenges || []);
      setPages(res.data.pagination?.pages || 1);
      setTotal(res.data.pagination?.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // ── Create ────────────────────────────────────────────────────────
  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/api/admin/challenges', {
        ...form,
        goal: {
          target: Number(form.goal.target),
          unit:   form.goal.unit,
        },
      });
      toast.success('Challenge created!');
      setCreateModal(false);
      setForm(blankForm);
      handleSearch();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create');
    } finally {
      setSaving(false);
    }
  }

  // ── Edit ──────────────────────────────────────────────────────────
  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editModal) return;
    setSaving(true);
    try {
      await api.put(`/api/admin/challenges/${editModal._id}`, {
        ...form,
        goal: {
          target: Number(form.goal.target),
          unit:   form.goal.unit,
        },
      });
      toast.success('Challenge updated!');
      setEditModal(null);
      handleSearch();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  }

  // ── Status change ─────────────────────────────────────────────────
  async function handleStatus(id: string, newStatus: string) {
    try {
      await api.patch(`/api/admin/challenges/${id}/status`, { status: newStatus });
      toast.success(`Challenge ${newStatus}`);
      setChallenges(prev =>
        prev.map(c => c._id === id ? { ...c, status: newStatus as Status } : c)
      );
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  }

  // ── Delete ────────────────────────────────────────────────────────
  async function handleDelete() {
    if (!delModal) return;
    setSaving(true);
    try {
      await api.delete(`/api/admin/challenges/${delModal._id}`);
      toast.success('Challenge deleted');
      setDelModal(null);
      setChallenges(prev => prev.filter(c => c._id !== delModal._id));
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    } finally {
      setSaving(false);
    }
  }

  function openEdit(c: Challenge) {
    setForm({
      title:       c.title,
      description: c.description,
      type:        c.type,
      startDate:   c.startDate.split('T')[0],
      endDate:     c.endDate.split('T')[0],
      goal:        { target: String(c.goal.target), unit: c.goal.unit },
      rules:       c.rules,
    });
    setEditModal(c);
  }

  const inputCls = 'w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100';
  const labelCls = 'block text-sm font-medium text-slate-600 mb-1.5';

  const ChallengeForm = ({ onSubmit }: { onSubmit: (e: React.FormEvent) => void }) => (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className={labelCls}>Title</label>
        <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} className={inputCls} required />
      </div>
      <div>
        <label className={labelCls}>Description</label>
        <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className={inputCls} rows={3} required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Type</label>
          <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} className={inputCls}>
            {['steps','nutrition','mindfulness','weight_loss','custom'].map(t => (
              <option key={t} value={t} className="capitalize">{t.replace('_',' ')}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>Goal Unit</label>
          <input value={form.goal.unit} onChange={e => setForm(p => ({ ...p, goal: { ...p.goal, unit: e.target.value } }))} className={inputCls} placeholder="steps / kg / mins" required />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Goal Target</label>
          <input type="number" value={form.goal.target} onChange={e => setForm(p => ({ ...p, goal: { ...p.goal, target: e.target.value } }))} className={inputCls} required />
        </div>
        <div />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Start Date</label>
          <input type="date" value={form.startDate} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))} className={inputCls} required />
        </div>
        <div>
          <label className={labelCls}>End Date</label>
          <input type="date" value={form.endDate} onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))} className={inputCls} required />
        </div>
      </div>
      <div>
        <label className={labelCls}>Rules (optional)</label>
        <textarea value={form.rules} onChange={e => setForm(p => ({ ...p, rules: e.target.value }))} className={inputCls} rows={2} />
      </div>
      <button type="submit" disabled={saving} className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium text-sm hover:bg-blue-700 transition disabled:opacity-50">
        {saving ? 'Saving...' : 'Save Challenge'}
      </button>
    </form>
  );

  return (
    <AdminLayout title="Challenges">
      <div className="space-y-5">

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="Search challenges..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {['','draft','published','paused','archived'].map(s => (
              <button
                key={s}
                onClick={() => { setStatus(s); setPage(1); }}
                className={`px-3 py-2.5 rounded-xl text-sm font-medium capitalize transition ${
                  status === s
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:border-blue-300'
                }`}
              >
                {s === '' ? 'All' : s}
              </button>
            ))}
            <button
              onClick={() => {
                setForm(blankForm);
                setCreateModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition"
            >
              <Plus size={16} /> New Challenge
            </button>
          </div>
        </div>

        <p className="text-sm text-slate-500">{total} challenges total</p>

        {/* Table */}
        <Card padding="none">
          {loading ? (
            <div className="py-16"><Spinner className="mx-auto" /></div>
          ) : challenges.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-sm">No challenges found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    {['Title','Type','Status','Goal','Enrolled','Dates','Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {challenges.map((c, i) => (
                    <tr key={c._id} className={`border-b border-slate-100 last:border-0 hover:bg-slate-50 transition ${i%2===0?'bg-white':'bg-slate-50/40'}`}>
                      <td className="px-4 py-3 font-medium text-slate-800 max-w-[180px] truncate">{c.title}</td>
                      <td className="px-4 py-3">
                        <Badge variant="blue" className="capitalize">{c.type.replace('_',' ')}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={statusColor[c.status as Status] || 'gray'} className="capitalize">{c.status}</Badge>
                      </td>
                      <td className="px-4 py-3 text-slate-500">{c.goal.target.toLocaleString()} {c.goal.unit}</td>
                      <td className="px-4 py-3 text-slate-500">{c.enrolledCount}</td>
                      <td className="px-4 py-3 text-slate-400 text-xs">
                        {new Date(c.startDate).toLocaleDateString()} →{' '}
                        {new Date(c.endDate).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {/* Edit */}
                          <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition">
                            <Edit2 size={14} />
                          </button>
                          {/* Publish */}
                          {(c.status === 'draft' || c.status === 'paused') && (
                            <button onClick={() => handleStatus(c._id, 'published')} className="p-1.5 rounded-lg hover:bg-green-50 text-slate-400 hover:text-green-600 transition" title="Publish">
                              <CheckCircle2 size={14} />
                            </button>
                          )}
                          {/* Pause */}
                          {c.status === 'published' && (
                            <button onClick={() => handleStatus(c._id, 'paused')} className="p-1.5 rounded-lg hover:bg-yellow-50 text-slate-400 hover:text-yellow-600 transition" title="Pause">
                              <PauseCircle size={14} />
                            </button>
                          )}
                          {/* Archive */}
                          {c.status !== 'archived' && (
                            <button onClick={() => handleStatus(c._id, 'archived')} className="p-1.5 rounded-lg hover:bg-orange-50 text-slate-400 hover:text-orange-500 transition" title="Archive">
                              <Archive size={14} />
                            </button>
                          )}
                          {/* Delete */}
                          {c.status === 'draft' && (
                            <button onClick={() => setDelModal(c)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition" title="Delete">
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Page {page} of {pages}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1,p-1))} disabled={page===1} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:border-blue-300 transition disabled:opacity-40">
                <ChevronLeft size={16} /> Prev
              </button>
              <button onClick={() => setPage(p => Math.min(pages,p+1))} disabled={page===pages} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:border-blue-300 transition disabled:opacity-40">
                Next <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Modal open={createModal} onClose={() => setCreateModal(false)} title="Create Challenge" width="lg">
        <ChallengeForm onSubmit={handleCreate} />
      </Modal>

      {/* Edit Modal */}
      <Modal open={!!editModal} onClose={() => setEditModal(null)} title="Edit Challenge" width="lg">
        <ChallengeForm onSubmit={handleEdit} />
      </Modal>

      {/* Delete Modal */}
      <Modal open={!!delModal} onClose={() => setDelModal(null)} title="Delete Challenge">
        <div className="space-y-4">
          <div className="p-4 bg-red-50 rounded-xl">
            <p className="text-sm text-red-700">
              Delete <strong>{delModal?.title}</strong>? This cannot be undone.
            </p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setDelModal(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition">Cancel</button>
            <button onClick={handleDelete} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition disabled:opacity-50">
              {saving ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  );
}