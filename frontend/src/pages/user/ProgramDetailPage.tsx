import { useEffect, useState }         from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Brain, Clock, ArrowLeft,
  CheckCircle2, Flame,
} from 'lucide-react';
import toast                           from 'react-hot-toast';
import { api }                         from '../../api/client';
import { UserLayout }                  from '../../components/layout/UserLayout';
import { Card }                        from '../../components/ui/Card';
import { Badge }                       from '../../components/ui/Badge';
import { Modal }                       from '../../components/ui/Modal';
import { Spinner }                     from '../../components/ui/Spinner';
import type { MindProgram, TodayProgram } from '../../types';

const inputCls =
  'w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100';

export function ProgramDetailPage() {
  const { id }   = useParams();
  const navigate = useNavigate();

  const [program,  setProgram]  = useState<MindProgram | null>(null);
  const [today,    setToday]    = useState<TodayProgram | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [logModal, setLogModal] = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [logForm,  setLogForm]  = useState({
    mood:                 3,
    notes:                '',
    activitiesCompleted:  [] as string[],
  });

  // ── Helper: fetch latest program + today data ─────────────────────
  async function fetchData() {
    const [progRes, todayRes] = await Promise.all([
      api.get(`/api/programs/${id}`),
      api.get(`/api/programs/${id}/today`).catch(() => ({ data: null })),
    ]);
    setProgram(progRes.data);
    setToday(todayRes.data);
  }

  // ── Initial load ─────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      try {
        await fetchData();
      } catch {
        navigate('/programs');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  // ── Enroll ───────────────────────────────────────────────────────
  async function handleEnroll() {
    try {
      await api.post(`/api/programs/${id}/enroll`);
      toast.success('Enrolled in program!');
      await fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to enroll');
    }
  }

  // ── Log day ──────────────────────────────────────────────────────
  async function handleLog(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post(`/api/programs/${id}/log`, logForm);
      toast.success('Day logged! Keep it up!');
      setLogModal(false);
      setLogForm({ mood: 3, notes: '', activitiesCompleted: [] });
      await fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to log day');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <UserLayout title="Program">
        <div className="py-20"><Spinner className="mx-auto" /></div>
      </UserLayout>
    );
  }

  if (!program) return null;

  return (
    <UserLayout title={program.title}>
      <div className="max-w-3xl space-y-6">

        {/* Back link */}
        <Link
          to="/programs"
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-purple-600 transition"
        >
          <ArrowLeft size={16} /> Back to Programs
        </Link>

        {/* Hero card */}
        <Card padding="lg">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center">
                <Brain size={24} className="text-purple-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800">{program.title}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="purple" className="capitalize">{program.category}</Badge>
                  <Badge variant="blue"   className="capitalize">{program.difficulty}</Badge>
                </div>
              </div>
            </div>
            {program.isEnrolled && <Badge variant="green">Enrolled</Badge>}
          </div>

          <p className="text-slate-600 mb-6">{program.description}</p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-3 bg-slate-50 rounded-xl">
              <Clock size={18} className="mx-auto text-purple-600 mb-1" />
              <p className="text-xs text-slate-400">Duration</p>
              <p className="font-semibold text-slate-800 text-sm">{program.durationDays} days</p>
            </div>
            {program.isEnrolled && (
              <>
                <div className="text-center p-3 bg-slate-50 rounded-xl">
                  <CheckCircle2 size={18} className="mx-auto text-green-600 mb-1" />
                  <p className="text-xs text-slate-400">Current Day</p>
                  <p className="font-semibold text-slate-800 text-sm">
                    {program.currentDay} / {program.durationDays}
                  </p>
                </div>
                <div className="text-center p-3 bg-slate-50 rounded-xl">
                  <Flame size={18} className="mx-auto text-orange-500 mb-1" />
                  <p className="text-xs text-slate-400">Streak</p>
                  <p className="font-semibold text-slate-800 text-sm">{program.streak} days</p>
                </div>
              </>
            )}
          </div>

          {/* Action button */}
          {!program.isEnrolled ? (
            <button
              onClick={handleEnroll}
              className="w-full py-3 rounded-xl bg-purple-600 text-white font-semibold text-sm hover:bg-purple-700 transition shadow-sm"
            >
              Start Program
            </button>
          ) : today && !today.alreadyLogged ? (
            <button
              onClick={() => setLogModal(true)}
              className="w-full py-3 rounded-xl bg-green-600 text-white font-semibold text-sm hover:bg-green-700 transition shadow-sm"
            >
              Log Today (Day {today.currentDay})
            </button>
          ) : (
            <div className="w-full py-3 rounded-xl bg-slate-50 border border-slate-200 text-center text-slate-500 text-sm font-medium">
              ✅ Today's activities completed!
            </div>
          )}
        </Card>

        {/* Today's activities */}
        {today && (
          <Card padding="md">
            <h3 className="font-semibold text-slate-800 mb-4">
              Day {today.currentDay}: {today.dayTitle}
            </h3>
            {today.activities.length === 0 ? (
              <p className="text-slate-400 text-sm">No activities for today.</p>
            ) : (
              <div className="space-y-3">
                {today.activities.map((act, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl"
                  >
                    <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600 text-xs font-bold shrink-0">
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-slate-800 text-sm">{act.title}</p>
                      <p className="text-xs text-slate-400 mt-0.5 capitalize">
                        {act.type} · {act.durationMin} min
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}
      </div>

      {/* Log day modal */}
      <Modal
        open={logModal}
        onClose={() => setLogModal(false)}
        title="Log Today's Activities"
      >
        <form onSubmit={handleLog} className="space-y-5">

          {/* Mood picker */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">
              How are you feeling today? (1 = Low · 5 = Great)
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setLogForm(p => ({ ...p, mood: n }))}
                  className={`flex-1 py-3 rounded-xl text-sm font-bold transition ${
                    logForm.mood === n
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  {['😞', '😕', '😐', '😊', '😄'][n - 1]} {n}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5">
              Notes (optional)
            </label>
            <textarea
              value={logForm.notes}
              onChange={e => setLogForm(p => ({ ...p, notes: e.target.value }))}
              className={inputCls}
              rows={3}
              placeholder="How did today go?"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 bg-purple-600 text-white rounded-xl font-medium text-sm hover:bg-purple-700 transition disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Complete Day'}
          </button>
        </form>
      </Modal>
    </UserLayout>
  );
}