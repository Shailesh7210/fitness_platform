import { useEffect, useState }  from 'react';
import {
  Play, RotateCcw, Calendar,
  CheckCircle2, XCircle, Clock,
  Loader2, ChevronDown, ChevronUp,
} from 'lucide-react';
import toast                    from 'react-hot-toast';
import { api }                  from '../../api/client';
import { AdminLayout }          from '../../components/layout/AdminLayout';
import { Card }                 from '../../components/ui/Card';
import { Badge }                from '../../components/ui/Badge';
import { Modal }                from '../../components/ui/Modal';
import { Spinner }              from '../../components/ui/Spinner';
import type { PipelineRun }     from '../../types';

function getTimestamp(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString();
}

const statusColor: Record<string,'green'|'red'|'yellow'|'gray'> = {
  completed: 'green',
  failed:    'red',
  running:   'yellow',
  pending:   'gray',
};

const statusIcon: Record<string, React.ReactNode> = {
  completed: <CheckCircle2 size={14} className="text-green-500" />,
  failed:    <XCircle      size={14} className="text-red-500" />,
  running:   <Loader2      size={14} className="text-yellow-500 animate-spin" />,
  pending:   <Clock        size={14} className="text-slate-400" />,
};

export function AdminPipeline() {
  const [runs,          setRuns]          = useState<PipelineRun[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [running,       setRunning]       = useState(false);
  const [backfillModal, setBackfillModal] = useState(false);
  const [backfillForm,  setBackfillForm]  = useState({ fromDate: '', toDate: '' });
  const [backfilling,   setBackfilling]   = useState(false);
  const [expanded,      setExpanded]      = useState<string | null>(null);

  // ── Load runs ─────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await api.get('/api/admin/pipeline/runs');
        setRuns(res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function refreshRuns() {
    try {
      const res = await api.get('/api/admin/pipeline/runs');
      setRuns(res.data || []);
    } catch (err) {
      console.error(err);
    }
  }

  // ── Manual run ────────────────────────────────────────────────────
  async function handleRun() {
    setRunning(true);
    try {
      const res = await api.post('/api/admin/pipeline/run');
      toast.success(res.data.message || 'Pipeline completed!');
      await refreshRuns();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Pipeline failed');
    } finally {
      setRunning(false);
    }
  }

  // ── Re-run failed ─────────────────────────────────────────────────
  async function handleRerun(id: string) {
    try {
      const res = await api.post(`/api/admin/pipeline/rerun/${id}`);
      toast.success(res.data.message || 'Re-run complete!');
      await refreshRuns();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Re-run failed');
    }
  }

  // ── Backfill ──────────────────────────────────────────────────────
  async function handleBackfill(e: React.FormEvent) {
    e.preventDefault();
    setBackfilling(true);
    try {
      const res = await api.post('/api/admin/pipeline/backfill', backfillForm);
      toast.success(`Backfill complete — ${res.data.results?.length ?? 0} days processed`);
      setBackfillModal(false);
      setBackfillForm({ fromDate: '', toDate: '' });
      await refreshRuns();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Backfill failed');
    } finally {
      setBackfilling(false);
    }
  }

  const inputCls = 'w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100';
  const labelCls = 'block text-sm font-medium text-slate-600 mb-1.5';

  return (
    <AdminLayout title="EOD Pipeline">
      <div className="space-y-5">

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleRun}
            disabled={running}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50"
          >
            {running
              ? <Loader2 size={16} className="animate-spin" />
              : <Play    size={16} />
            }
            {running ? 'Running...' : 'Run Today\'s Pipeline'}
          </button>
          <button
            onClick={() => setBackfillModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:border-blue-300 transition"
          >
            <Calendar size={16} /> Backfill Dates
          </button>
          <button
            onClick={refreshRuns}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:border-slate-300 transition"
          >
            <RotateCcw size={15} /> Refresh
          </button>
        </div>

        {/* Runs list */}
        {loading ? (
          <div className="py-20"><Spinner className="mx-auto" /></div>
        ) : runs.length === 0 ? (
          <Card padding="lg" className="text-center py-16">
            <Play size={40} className="mx-auto text-slate-200 mb-3" />
            <p className="text-slate-400 text-sm">No pipeline runs yet. Run the first one!</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {runs.map(run => (
              <Card key={run._id} padding="none" className="overflow-hidden">

                {/* Run header */}
                <div
                  className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-slate-50 transition"
                  onClick={() => setExpanded(prev => prev === run._id ? null : run._id)}
                >
                  <div className="flex items-center gap-4">
                    <div>{statusIcon[run.status]}</div>
                    <div>
                      <p className="font-semibold text-slate-800">{run.date}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Triggered by: {run.triggeredBy} · Started: {getTimestamp(run.startedAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={statusColor[run.status] || 'gray'} className="capitalize">
                      {run.status}
                    </Badge>
                    {run.status === 'failed' && (
                      <button
                        onClick={e => { e.stopPropagation(); handleRerun(run._id); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 text-xs font-medium hover:bg-blue-100 transition"
                      >
                        <RotateCcw size={12} /> Re-run
                      </button>
                    )}
                    {expanded === run._id
                      ? <ChevronUp   size={16} className="text-slate-400" />
                      : <ChevronDown size={16} className="text-slate-400" />
                    }
                  </div>
                </div>

                {/* Stage breakdown */}
                {expanded === run._id && (
                  <div className="border-t border-slate-100 px-5 py-4 bg-slate-50">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
                      Stage Results
                    </p>
                    <div className="space-y-2">
                      {run.stages.map((stage, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100"
                        >
                          <div className="flex items-center gap-3">
                            {statusIcon[stage.status]}
                            <span className="text-sm font-medium text-slate-700 capitalize">
                              {stage.stage.replace(/-/g,' ')}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-slate-400">
                            <span>{stage.records.toLocaleString()} records</span>
                            {stage.error && (
                              <span className="text-red-500">{stage.error}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    {run.doneAt && (
                      <p className="text-xs text-slate-400 mt-3">
                        Completed: {getTimestamp(run.doneAt)}
                      </p>
                    )}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Backfill Modal */}
      <Modal
        open={backfillModal}
        onClose={() => setBackfillModal(false)}
        title="Backfill Pipeline"
      >
        <form onSubmit={handleBackfill} className="space-y-4">
          <div className="p-3 bg-blue-50 rounded-xl text-sm text-blue-700">
            This will run the EOD pipeline for each date in the range.
            Already-completed dates will be skipped.
          </div>
          <div>
            <label className={labelCls}>From Date</label>
            <input
              type="date"
              value={backfillForm.fromDate}
              onChange={e => setBackfillForm(p => ({ ...p, fromDate: e.target.value }))}
              className={inputCls}
              required
            />
          </div>
          <div>
            <label className={labelCls}>To Date</label>
            <input
              type="date"
              value={backfillForm.toDate}
              onChange={e => setBackfillForm(p => ({ ...p, toDate: e.target.value }))}
              className={inputCls}
              required
            />
          </div>
          <button
            type="submit"
            disabled={backfilling}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium text-sm hover:bg-blue-700 transition disabled:opacity-50"
          >
            {backfilling ? 'Running Backfill...' : 'Run Backfill'}
          </button>
        </form>
      </Modal>
    </AdminLayout>
  );
}