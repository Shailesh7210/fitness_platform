import { Router, Response } from 'express';
import { body }              from 'express-validator';
import { MindProgram }       from '../../models/MindProgram';
import { ProgramEnrollment } from '../../models/ProgramEnrollment';
import { authenticate, requireAdmin, AuthRequest } from '../../middleware/auth';
import { validate }          from '../../middleware/validate';

const router = Router();
router.use(authenticate, requireAdmin);

// GET /api/admin/programs
router.get('/', async (_req, res: Response) => {
  try {
    const programs = await MindProgram
      .find()
      .populate('createdBy', 'firstName lastName')
      .sort({ createdAt: -1 });
    res.json(programs);
  } catch (err: any) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/admin/programs
router.post(
  '/',
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('category')
      .isIn(['meditation','sleep','stress','focus','resilience'])
      .withMessage('Invalid category'),
    body('durationDays').isInt({ min: 1 }).withMessage('Duration must be at least 1 day'),
  ],
  validate,
  async (req: AuthRequest, res: Response) => {
    try {
      const program = await MindProgram.create({
        ...req.body,
        createdBy:   req.user!.id,
        isPublished: false,
      });
      res.status(201).json({ message: 'Program created', program });
    } catch (err: any) {
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  }
);

// PUT /api/admin/programs/:id
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const program = await MindProgram.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    if (!program) {
      res.status(404).json({ message: 'Program not found' });
      return;
    }
    res.json({ message: 'Program updated', program });
  } catch (err: any) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PATCH /api/admin/programs/:id/publish
router.patch('/:id/publish', async (req: AuthRequest, res: Response) => {
  try {
    const program = await MindProgram.findByIdAndUpdate(
      req.params.id,
      { isPublished: true },
      { new: true }
    );
    if (!program) {
      res.status(404).json({ message: 'Program not found' });
      return;
    }
    res.json({ message: 'Program published', program });
  } catch (err: any) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// DELETE /api/admin/programs/:id
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const enrollments = await ProgramEnrollment.countDocuments({
      programId: req.params.id,
    });

    if (enrollments > 0) {
      res.status(400).json({
        message: `Cannot delete — ${enrollments} users are enrolled. Unpublish it instead.`,
      });
      return;
    }

    await MindProgram.findByIdAndDelete(req.params.id);
    res.json({ message: 'Program deleted' });
  } catch (err: any) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

export default router;