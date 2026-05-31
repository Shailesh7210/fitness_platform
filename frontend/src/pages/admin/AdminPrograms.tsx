import { useEffect, useState }  from 'react';
import { Plus, Edit2, Trash2, Eye, EyeOff } from 'lucide-react';
import toast                    from 'react-hot-toast';
import { api }                  from '../../api/client';
import { AdminLayout }          from '../../components/layout/AdminLayout';
import { Card }                 from '../../components/ui/Card';
import { Badge }                from '../../components/ui/Badge';
import { Modal }                from '../../components/ui/Modal';
import { Spinner }              from '../../components/ui/Spinner';
import type { MindProgram }     from '../../types';

const categoryColor: Record<string,'blue'|'purple'|'green'|'yellow'|'gray'> = {
  meditation: 'blue',
  sleep:      'purple',
  stress:     'green',
  focus:      'yellow',
  resilience: 'gray',
};

const blankForm = {
  title: '', description: '', category: 'meditation',
  durationDays: '', difficulty: 'beginner', imageUrl: '',
};

export function AdminPrograms() {
  const [programs, setPrograms] = useState<MindProgram[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [form,     setForm]     = useState(blankForm);
  const [saving,   setSaving]   = useState(false);

  const [createModal, setCreateModal] = useState(false);
  const [editModal,   setEditModal]   = useState<MindProgram | null>(null);
  const [delModal,    setDelModal]    = useState<MindProgram | null>(null);

  // ── Load ─────────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await api.get('/api/admin/programs');
        setPrograms(res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function refreshPrograms() {
    try {
      const res = await api.get('/api/admin/programs');
      setPrograms(res.data || []);
    } catch (err) {
      console.error(err);
    }
  }

  // ── Create ────────────────────────────────────────────────────────
  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/api/admin/programs', {
        ...form,
        durationDays: Number(form.durationDays),
      });
      toast.success('Program created!');
      setCreateModal(false);
      setForm(blankForm);
      await refreshPrograms();
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
      await api.put(`/api/admin/programs/${editModal._id}`, {
        ...form,
        durationDays: Number(form.durationDays),
      });
      toast.success('Program updated!');
      setEditModal(null);
      await refreshPrograms();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  }

  // ── Publish toggle ────────────────────────────────────────────────
  async function handlePublishToggle(program: MindProgram) {
    try {
      if (program.isPublished) {
        await api.put(`/api/admin/programs/${program._id}`, {
          isPublished: false,
        });
        toast.success('Program unpublished');
      } else {
        await api.patch(`/api/admin/programs/${program._id}/publish`);
        toast.success('Program published!');
      }
      setPrograms(prev =>
        prev.map(p =>
          p._id === program._id
            ? { ...p, isPublished: !p.isPublished }
            : p
        )
      );
    } catch {
      toast.error('Failed to update');
    }
  }

  // ── Delete ────────────────────────────────────────────────────────
  async function handleDelete() {
    if (!delModal) return;
    setSaving(true);
    try {
      await api.delete(`/api/admin/programs/${delModal._id}`);
      toast.success('Program deleted');
      setDelModal(null);
      setPrograms(prev => prev.filter(p => p._id !== delModal._id));
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    } finally {
      setSaving(false);
    }
  }

  function openEdit(p: MindProgram) {
    setForm({
      title:        p.title,
      description:  p.description,
      category:     p.category,
      durationDays: String(p.durationDays),
      difficulty:   p.difficulty,
      imageUrl:     p.imageUrl || '',
    });
    setEditModal(p);
  }

  const inputCls = 'w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100';
  const labelCls = 'block text-sm font-medium text-slate-600 mb-1.5';

  const ProgramForm = ({ onSubmit }: { onSubmit: (e: React.FormEvent) => void }) => (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className={labelCls}>Title</label>
        <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} className={inputCls} required />
      </div>
      <div>
        <label className={labelCls}>Description</label>
        <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className={inputCls} rows={3} required />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className={labelCls}>Category</label>
          <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} className={inputCls}>
            {['meditation','sleep','stress','focus','resilience'].map(c => (
              <option key={c} value={c} className="capitalize">{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>Difficulty</label>
          <select value={form.difficulty} onChange={e => setForm(p => ({ ...p, difficulty: e.target.value }))} className={inputCls}>
            {['beginner','intermediate','advanced'].map(d => (
              <option key={d} value={d} className="capitalize">{d}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>Duration (days)</label>
          <input type="number" min="1" value={form.durationDays} onChange={e => setForm(p => ({ ...p, durationDays: e.target.value }))} className={inputCls} required />
        </div>
      </div>
      <div>
        <label className={labelCls}>Image URL (optional)</label>
        <input value={form.imageUrl} onChange={e => setForm(p => ({ ...p, imageUrl: e.target.value }))} className={inputCls} placeholder="https://..." />
      </div>
      <button type="submit" disabled={saving} className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium text-sm hover:bg-blue-700 transition disabled:opacity-50">
        {saving ? 'Saving...' : 'Save Program'}
      </button>
    </form>
  );

  return (
    <AdminLayout title="Mind Programs">
      <div className="space-y-5">

        <div className="flex justify-between items-center">
          <p className="text-sm text-slate-500">{programs.length} programs total</p>
          <button
            onClick={() => { setForm(blankForm); setCreateModal(true); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition"
          >
            <Plus size={16} /> New Program
          </button>
        </div>

        {loading ? (
          <div className="py-20"><Spinner className="mx-auto" /></div>
        ) : programs.length === 0 ? (
          <Card padding="lg" className="text-center py-16">
            <p className="text-slate-400">No programs yet. Create one!</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {programs.map(p => (
              <Card key={p._id} padding="none" className="overflow-hidden hover:shadow-md transition-shadow">
                <div className={`h-1.5 ${p.isPublished ? 'bg-green-500' : 'bg-slate-300'}`} />
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <Badge variant={categoryColor[p.category] || 'blue'} className="capitalize">
                      {p.category}
                    </Badge>
                    <Badge variant={p.isPublished ? 'green' : 'gray'}>
                      {p.isPublished ? 'Published' : 'Draft'}
                    </Badge>
                  </div>
                  <h3 className="font-semibold text-slate-800 mb-1">{p.title}</h3>
                  <p className="text-sm text-slate-500 line-clamp-2 mb-3">{p.description}</p>
                  <div className="flex items-center gap-3 text-xs text-slate-400 mb-4">
                    <span className="capitalize">{p.difficulty}</span>
                    <span>·</span>
                    <span>{p.durationDays} days</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handlePublishToggle(p)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition ${
                        p.isPublished
                          ? 'bg-orange-50 text-orange-600 hover:bg-orange-100 border border-orange-100'
                          : 'bg-green-50 text-green-600 hover:bg-green-100 border border-green-100'
                      }`}
                    >
                      {p.isPublished
                        ? <><EyeOff size={13} /> Unpublish</>
                        : <><Eye    size={13} /> Publish</>
                      }
                    </button>
                    <button
                      onClick={() => openEdit(p)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-100 transition"
                    >
                      <Edit2 size={13} /> Edit
                    </button>
                    <button
                      onClick={() => setDelModal(p)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 transition"
                    >
                      <Trash2 size={13} /> Delete
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Modal open={createModal} onClose={() => setCreateModal(false)} title="Create Program" width="lg">
        <ProgramForm onSubmit={handleCreate} />
      </Modal>

      {/* Edit Modal */}
      <Modal open={!!editModal} onClose={() => setEditModal(null)} title="Edit Program" width="lg">
        <ProgramForm onSubmit={handleEdit} />
      </Modal>

      {/* Delete Modal */}
      <Modal open={!!delModal} onClose={() => setDelModal(null)} title="Delete Program">
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