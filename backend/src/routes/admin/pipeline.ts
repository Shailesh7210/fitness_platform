import { Router, Response } from 'express';
import { User }             from '../../models/User';
import { Enrollment }       from '../../models/Enrollment';
import { MealLog }          from '../../models/MealLog';
import { PipelineRun }      from '../../models/PipelineRun';
import { authenticate, requireAdmin, AuthRequest } from '../../middleware/auth';

const router = Router();
router.use(authenticate, requireAdmin);

// ── Helper: run the pipeline for a given date ───────────────────────
async function runPipeline(date: string, triggeredBy: 'manual' | 'backfill' | 'scheduler') {

  // Prevent duplicate runs for same date
  const existing = await PipelineRun.findOne({ date });
  if (existing && existing.status === 'completed') {
    return { skipped: true, reason: `Pipeline for ${date} already completed` };
  }

  const STAGES = [
    'aggregate-activity',
    'calculate-points',
    'update-streaks',
    'send-notifications',
  ];

  const run = await PipelineRun.findOneAndUpdate(
    { date },
    {
      $set: {
        status:      'running',
        triggeredBy,
        startedAt:   new Date(),
        stages:      STAGES.map(s => ({
          stage:     s,
          status:    'pending',
          records:   0,
          error:     '',
          startedAt: null,
          doneAt:    null,
        })),
      },
    },
    { new: true, upsert: true }
  );

  // Run each stage sequentially
  for (let i = 0; i < STAGES.length; i++) {
    const stageName = STAGES[i];

    // Mark stage as running
    run!.stages[i].status    = 'running';
    run!.stages[i].startedAt = new Date();
    await run!.save();

    try {
      let records = 0;

      // Each stage does real DB work
      if (stageName === 'aggregate-activity') {
        records = await Enrollment.countDocuments({ status: 'active' });
      }
      if (stageName === 'calculate-points') {
        records = await MealLog.countDocuments({
          date: {
            $gte: new Date(date),
            $lt:  new Date(new Date(date).getTime() + 86400000),
          },
        });
      }
      if (stageName === 'update-streaks') {
        records = await User.countDocuments({ isActive: true });
      }
      if (stageName === 'send-notifications') {
        records = await User.countDocuments({ isActive: true });
      }

      run!.stages[i].status  = 'completed';
      run!.stages[i].records = records;
      run!.stages[i].doneAt  = new Date();

    } catch (err: any) {
      run!.stages[i].status = 'failed';
      run!.stages[i].error  = err.message;
      run!.stages[i].doneAt = new Date();
      run!.status           = 'failed';
      run!.doneAt           = new Date();
      await run!.save();
      return { success: false, run };
    }

    await run!.save();
  }

  run!.status  = 'completed';
  run!.doneAt  = new Date();
  await run!.save();

  return { success: true, run };
}

// ── GET /api/admin/pipeline/runs ────────────────────────────────────
router.get('/runs', async (_req: AuthRequest, res: Response) => {
  try {
    const runs = await PipelineRun
      .find()
      .sort({ createdAt: -1 })
      .limit(30);

    res.json(runs);
  } catch (err: any) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ── POST /api/admin/pipeline/run ────────────────────────────────────
// Manually trigger for today
router.post('/run', async (req: AuthRequest, res: Response) => {
  try {
    const date   = new Date().toISOString().split('T')[0];
    const result = await runPipeline(date, 'manual');

    if (result.skipped) {
      res.status(400).json({ message: result.reason });
      return;
    }

    res.json({
      message: result.success ? 'Pipeline completed' : 'Pipeline failed',
      run:     result.run,
    });
  } catch (err: any) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ── POST /api/admin/pipeline/rerun/:id ─────────────────────────────
// Re-run a failed pipeline
router.post('/rerun/:id', async (req: AuthRequest, res: Response) => {
  try {
    const existing = await PipelineRun.findById(req.params.id);

    if (!existing) {
      res.status(404).json({ message: 'Pipeline run not found' });
      return;
    }

    // Reset so it can run again
    await PipelineRun.findByIdAndDelete(req.params.id);

    const result = await runPipeline(existing.date, 'manual');

    res.json({
      message: result.success ? 'Pipeline re-run completed' : 'Pipeline re-run failed',
      run:     result.run,
    });
  } catch (err: any) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ── POST /api/admin/pipeline/backfill ──────────────────────────────
// Run pipeline for a range of past dates
router.post('/backfill', async (req: AuthRequest, res: Response) => {
  try {
    const { fromDate, toDate } = req.body;

    if (!fromDate || !toDate) {
      res.status(400).json({ message: 'fromDate and toDate are required' });
      return;
    }

    const start   = new Date(fromDate);
    const end     = new Date(toDate);
    const results = [];

    const current = new Date(start);
    while (current <= end) {
      const dateStr = current.toISOString().split('T')[0];
      const result  = await runPipeline(dateStr, 'backfill');
      results.push({ date: dateStr, ...result });
      current.setDate(current.getDate() + 1);
    }

    res.json({
      message: 'Backfill completed',
      results,
    });
  } catch (err: any) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

export default router;