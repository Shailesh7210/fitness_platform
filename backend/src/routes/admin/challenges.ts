import { Router, Response } from 'express';
import { body } from 'express-validator';
import { Challenge }  from '../../models/Challenge';
import { Enrollment } from '../../models/Enrollment';
import { authenticate, requireAdmin, AuthRequest } from '../../middleware/auth';
import { validate } from '../../middleware/validate';

const router = Router();

// All admin routes require login + admin role
router.use(authenticate, requireAdmin);

// ── POST /api/admin/challenges ──────────────────────────────────────
router.post(
  '/',
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('type')
      .isIn(['steps','nutrition','mindfulness','weight_loss','custom'])
      .withMessage('Invalid type'),
    body('startDate').isISO8601().withMessage('Valid start date required'),
    body('endDate').isISO8601().withMessage('Valid end date required'),
    body('goal.target').isNumeric().withMessage('Goal target must be a number'),
    body('goal.unit').notEmpty().withMessage('Goal unit is required'),
  ],
  validate,
  async (req: AuthRequest, res: Response) => {
    try {
      const challenge = await Challenge.create({
        ...req.body,
        createdBy: req.user!.id,
        status:    'draft',
      });

      res.status(201).json({
        message:   'Challenge created',
        challenge,
      });
    } catch (err: any) {
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  }
);

// ── GET /api/admin/challenges ───────────────────────────────────────
// Admin sees ALL challenges regardless of status
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const page   = Math.max(1, parseInt(req.query.page   as string) || 1);
    const limit  = Math.max(1, parseInt(req.query.limit  as string) || 10);
    const status = (req.query.status as string) || '';
    const type   = (req.query.type   as string) || '';
    const search = (req.query.search as string) || '';

    const filter: any = {};
    if (status) filter.status = status;
    if (type)   filter.type   = type;
    if (search) filter.title  = { $regex: search, $options: 'i' };

    const skip  = (page - 1) * limit;
    const total = await Challenge.countDocuments(filter);

    const challenges = await Challenge
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('createdBy', 'firstName lastName');

    res.json({
      challenges,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err: any) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ── GET /api/admin/challenges/stats ────────────────────────────────
router.get('/stats', async (_req: AuthRequest, res: Response) => {
  try {
    const [
      total,
      draft,
      published,
      paused,
      archived,
      totalEnrollments,
    ] = await Promise.all([
      Challenge.countDocuments(),
      Challenge.countDocuments({ status: 'draft' }),
      Challenge.countDocuments({ status: 'published' }),
      Challenge.countDocuments({ status: 'paused' }),
      Challenge.countDocuments({ status: 'archived' }),
      Enrollment.countDocuments(),
    ]);

    res.json({
      total,
      draft,
      published,
      paused,
      archived,
      totalEnrollments,
    });
  } catch (err: any) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ── GET /api/admin/challenges/:id ───────────────────────────────────
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const challenge = await Challenge
      .findById(req.params.id)
      .populate('createdBy', 'firstName lastName');

    if (!challenge) {
      res.status(404).json({ message: 'Challenge not found' });
      return;
    }

    // Get enrolled users for this challenge
    const enrollments = await Enrollment
      .find({ challengeId: challenge._id })
      .populate('userId', 'firstName lastName email')
      .sort({ joinedAt: -1 })
      .limit(10);

    res.json({ challenge, recentEnrollments: enrollments });
  } catch (err: any) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ── PUT /api/admin/challenges/:id ───────────────────────────────────
router.put(
  '/:id',
  [
    body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
    body('description').optional().trim().notEmpty(),
    body('startDate').optional().isISO8601(),
    body('endDate').optional().isISO8601(),
  ],
  validate,
  async (req: AuthRequest, res: Response) => {
    try {
      const challenge = await Challenge.findById(req.params.id);

      if (!challenge) {
        res.status(404).json({ message: 'Challenge not found' });
        return;
      }

      if (challenge.status === 'archived') {
        res.status(400).json({ message: 'Cannot edit an archived challenge' });
        return;
      }

      const updated = await Challenge.findByIdAndUpdate(
        req.params.id,
        { $set: req.body },
        { new: true }
      );

      res.json({ message: 'Challenge updated', challenge: updated });
    } catch (err: any) {
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  }
);

// ── PATCH /api/admin/challenges/:id/status ─────────────────────────
// Valid transitions:
// draft      → published
// published  → paused
// published  → archived
// paused     → published
// paused     → archived
// draft      → archived
router.patch('/:id/status', async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body;
    const challenge  = await Challenge.findById(req.params.id);

    if (!challenge) {
      res.status(404).json({ message: 'Challenge not found' });
      return;
    }

    const current = challenge.status;

    const allowed: Record<string, string[]> = {
      draft:     ['published', 'archived'],
      published: ['paused', 'archived'],
      paused:    ['published', 'archived'],
      archived:  [],
    };

    if (!allowed[current].includes(status)) {
      res.status(400).json({
        message: `Cannot transition from "${current}" to "${status}"`,
      });
      return;
    }

    const updated = await Challenge.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    res.json({ message: `Challenge ${status}`, challenge: updated });
  } catch (err: any) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ── DELETE /api/admin/challenges/:id ───────────────────────────────
// Only draft challenges can be deleted
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const challenge = await Challenge.findById(req.params.id);

    if (!challenge) {
      res.status(404).json({ message: 'Challenge not found' });
      return;
    }

    if (challenge.status !== 'draft') {
      res.status(400).json({
        message: 'Only draft challenges can be deleted. Archive it instead.',
      });
      return;
    }

    await Challenge.findByIdAndDelete(req.params.id);
    res.json({ message: 'Challenge deleted' });
  } catch (err: any) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

export default router;