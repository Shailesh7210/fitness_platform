import { useEffect, useState }  from 'react';
import { Plus, CheckCircle2 }   from 'lucide-react';
import toast                    from 'react-hot-toast';
import { api }                  from '../../api/client';
import { AdminLayout }          from '../../components/layout/AdminLayout';
import { Card }                 from '../../components/ui/Card';
import { Badge }                from '../../components/ui/Badge';
import { Modal }                from '../../components/ui/Modal';
import { Spinner }              from '../../components/ui/Spinner';
import type { Questionnaire }   from '../../types';

export function AdminOnboarding() {
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);
  const [responses,      setResponses]      = useState<any[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [tab,            setTab]            = useState<'versions'|'responses'>('versions');
  const [createModal,    setCreateModal]    = useState(false);
  const [saving,         setSaving]         = useState(false);
  const [form,           setForm]           = useState({
    name: '', version: '', questions: '',
  });

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [qRes, rRes] = await Promise.all([
          api.get('/api/admin/onboarding'),
          api.get('/api/admin/onboarding/responses'),
        ]);
        setQuestionnaires(qRes.data || []);
        setResponses(rRes.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleActivate(id: string) {
    try {
      await api.patch(`/api/admin/onboarding/${id}/activate`);
      toast.success('Questionnaire activated!');
      const res = await api.get('/api/admin/onboarding');
      setQuestionnaires(res.data || []);
    } catch {
      toast.error('Failed to activate');
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      let questions;
      try {
        questions = JSON.parse(form.questions);
      } catch {
        toast.error('Questions must be valid JSON');
        setSaving(false);
        return;
      }
      await api.post('/api/admin/onboarding', {
        name:      form.name,
        version:   Number(form.version),
        questions,
      });
      toast.success('Questionnaire created!');
      setCreateModal(false);
      setForm({ name: '', version: '', questions: '' });
      const res = await api.get('/api/admin/onboarding');
      setQuestionnaires(res.data || []);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create');
    } finally {
      setSaving(false);
    }
  }

  const inputCls = 'w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100';
  const labelCls = 'block text-sm font-medium text-slate-600 mb-1.5';

  return (
    <AdminLayout title="Onboarding Management">
      <div className="space-y-5">

        {/* Tabs + create */}
        <div className="flex items-center justify-between">
          <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
            {(['versions','responses'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition ${
                  tab === t
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {t === 'versions' ? 'Questionnaire Versions' : 'User Responses'}
              </button>
            ))}
          </div>
          {tab === 'versions' && (
            <button
              onClick={() => setCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition"
            >
              <Plus size={16} /> New Version
            </button>
          )}
        </div>

        {loading ? (
          <div className="py-20"><Spinner className="mx-auto" /></div>
        ) : tab === 'versions' ? (
          // ── Questionnaire versions ────────────────────────────────
          <div className="space-y-3">
            {questionnaires.length === 0 ? (
              <Card padding="lg" className="text-center py-16">
                <p className="text-slate-400 text-sm">
                  No questionnaires yet. Create one to start onboarding.
                </p>
              </Card>
            ) : (
              questionnaires.map(q => (
                <Card key={q._id} padding="md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                        <span className="text-blue-600 font-bold text-sm">v{q.version}</span>
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">{q.name}</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {q.questions.length} questions
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={(q as any).isActive ? 'green' : 'gray'}>
                        {(q as any).isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      {!(q as any).isActive && (
                        <button
                          onClick={() => handleActivate(q._id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 text-green-700 border border-green-100 text-xs font-medium hover:bg-green-100 transition"
                        >
                          <CheckCircle2 size={13} /> Activate
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Question list preview */}
                  {q.questions.length > 0 && (
                    <div className="mt-4 space-y-1">
                      {q.questions.slice(0, 3).map((qu, i) => (
                        <p key={i} className="text-xs text-slate-500 flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                            {i + 1}
                          </span>
                          {qu.label}
                        </p>
                      ))}
                      {q.questions.length > 3 && (
                        <p className="text-xs text-slate-400 ml-7">
                          +{q.questions.length - 3} more questions
                        </p>
                      )}
                    </div>
                  )}
                </Card>
              ))
            )}
          </div>
        ) : (
          // ── User responses ────────────────────────────────────────
          <Card padding="none">
            {responses.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-sm">
                No responses yet
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      {['User','Email','Questionnaire','Status','Date'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {responses.map((r, i) => (
                      <tr key={r._id} className={`border-b border-slate-100 last:border-0 hover:bg-slate-50 transition ${i%2===0?'bg-white':'bg-slate-50/40'}`}>
                        <td className="px-4 py-3 font-medium text-slate-800">
                          {r.userId?.firstName} {r.userId?.lastName}
                        </td>
                        <td className="px-4 py-3 text-slate-500">{r.userId?.email}</td>
                        <td className="px-4 py-3 text-slate-500">
                          {r.questionnaireId?.name} v{r.version}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={r.status === 'completed' ? 'green' : 'yellow'} className="capitalize">
                            {r.status.replace('_',' ')}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-slate-400 text-xs">
                          {new Date(r.updatedAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}
      </div>

      {/* Create Modal */}
      <Modal open={createModal} onClose={() => setCreateModal(false)} title="Create Questionnaire" width="lg">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Name</label>
              <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className={inputCls} placeholder="e.g. Health Assessment v2" required />
            </div>
            <div>
              <label className={labelCls}>Version Number</label>
              <input type="number" min="1" value={form.version} onChange={e => setForm(p => ({ ...p, version: e.target.value }))} className={inputCls} placeholder="1" required />
            </div>
          </div>
          <div>
            <label className={labelCls}>Questions (JSON Array)</label>
            <textarea
              value={form.questions}
              onChange={e => setForm(p => ({ ...p, questions: e.target.value }))}
              className={`${inputCls} font-mono text-xs`}
              rows={10}
              placeholder={`[
  {
    "id": "q_goal",
    "type": "single",
    "label": "What is your main health goal?",
    "required": true,
    "options": [
      { "value": "weight_loss", "label": "Lose weight" },
      { "value": "fitness",     "label": "Get fitter" }
    ],
    "nextQuestionId": "",
    "branchMap": {},
    "showIf": null
  }
]`}
              required
            />
          </div>
          <button type="submit" disabled={saving} className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium text-sm hover:bg-blue-700 transition disabled:opacity-50">
            {saving ? 'Creating...' : 'Create Questionnaire'}
          </button>
        </form>
      </Modal>
    </AdminLayout>
  );
}