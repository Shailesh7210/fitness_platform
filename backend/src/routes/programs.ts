import { Router, Response } from 'express';
import { body }              from 'express-validator';
import { MindProgram }       from '../models/MindProgram';
import { ProgramEnrollment } from '../models/ProgramEnrollment';
import { authenticate, AuthRequest } from '../middleware/auth';
import { validate }          from '../middleware/validate';

const router = Router();
router.use(authenticate);

// GET /api/programs
router.get('/', async (_req: AuthRequest, res: Response) => {
  try {
    const programs = await MindProgram
      .find({ isPublished: true })
      .select('-days')
      .sort({ createdAt: -1 });

    res.json(programs);
  } catch (err: any) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/programs/:id
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const program = await MindProgram.findById(req.params.id);

    if (!program || !program.isPublished) {
      res.status(404).json({ message: 'Program not found' });
      return;
    }

    const enrollment = await ProgramEnrollment.findOne({
      userId:    req.user!.id,
      programId: program._id,
    });

    res.json({
      ...program.toObject(),
      isEnrolled: !!enrollment,
      currentDay: enrollment?.currentDay || null,
      status:     enrollment?.status     || null,
      streak:     enrollment?.streak     || 0,
    });
  } catch (err: any) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/programs/:id/enroll
router.post('/:id/enroll', async (req: AuthRequest, res: Response) => {
  try {
    const program = await MindProgram.findById(req.params.id);

    if (!program || !program.isPublished) {
      res.status(404).json({ message: 'Program not found' });
      return;
    }

    const existing = await ProgramEnrollment.findOne({
      userId:    req.user!.id,
      programId: program._id,
    });

    if (existing) {
      res.status(400).json({ message: 'Already enrolled in this program' });
      return;
    }

    const enrollment = await ProgramEnrollment.create({
      userId:    req.user!.id,
      programId: program._id,
      startDate: new Date(),
    });

    res.status(201).json({ message: 'Enrolled successfully', enrollment });
  } catch (err: any) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/programs/:id/today
// Returns today's activities for the user's current day in the program
router.get('/:id/today', async (req: AuthRequest, res: Response) => {
  try {
    const enrollment = await ProgramEnrollment.findOne({
      userId:    req.user!.id,
      programId: req.params.id,
    });

    if (!enrollment) {
      res.status(404).json({ message: 'You are not enrolled in this program' });
      return;
    }

    const program = await MindProgram.findById(req.params.id);
    if (!program) {
      res.status(404).json({ message: 'Program not found' });
      return;
    }

    const todayData = program.days.find(
      d => d.dayNumber === enrollment.currentDay
    );

    if (!todayData) {
      res.status(404).json({ message: 'No activities found for today' });
      return;
    }

    // Check if already logged today
    const alreadyLogged = enrollment.dailyLogs.some(
      l => l.day === enrollment.currentDay
    );

    res.json({
      currentDay:   enrollment.currentDay,
      totalDays:    program.durationDays,
      streak:       enrollment.streak,
      alreadyLogged,
      dayTitle:     todayData.title,
      activities:   todayData.activities,
      daysRemaining: program.durationDays - enrollment.currentDay,
    });
  } catch (err: any) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/programs/:id/log
// Submit today's check-in
router.post(
  '/:id/log',
  [
    body('mood')
      .isInt({ min: 1, max: 5 })
      .withMessage('Mood must be between 1 and 5'),
    body('activitiesCompleted')
      .isArray()
      .withMessage('activitiesCompleted must be an array'),
  ],
  validate,
  async (req: AuthRequest, res: Response) => {
    try {
      const { mood, notes, activitiesCompleted } = req.body;

      const enrollment = await ProgramEnrollment.findOne({
        userId:    req.user!.id,
        programId: req.params.id,
        status:    'active',
      });

      if (!enrollment) {
        res.status(404).json({ message: 'Active enrollment not found' });
        return;
      }

      // Prevent double logging same day
      const alreadyLogged = enrollment.dailyLogs.some(
        l => l.day === enrollment.currentDay
      );

      if (alreadyLogged) {
        res.status(400).json({ message: 'Already logged today' });
        return;
      }

      const program = await MindProgram.findById(req.params.id);
      if (!program) {
        res.status(404).json({ message: 'Program not found' });
        return;
      }

      // Add log entry
      enrollment.dailyLogs.push({
        day:                enrollment.currentDay,
        completedAt:        new Date(),
        mood,
        notes:              notes || '',
        activitiesCompleted,
      });

      // Update streak and advance day
      enrollment.streak     += 1;
      enrollment.currentDay += 1;

      // Check if program is complete
      if (enrollment.currentDay > program.durationDays) {
        enrollment.status = 'completed';
      }

      await enrollment.save();

      res.json({
        message:    'Day logged successfully',
        currentDay: enrollment.currentDay,
        streak:     enrollment.streak,
        status:     enrollment.status,
        completed:  enrollment.status === 'completed',
      });
    } catch (err: any) {
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  }
);

// GET /api/programs/my/enrollments
router.get('/my/enrollments', async (req: AuthRequest, res: Response) => {
  try {
    const enrollments = await ProgramEnrollment
      .find({ userId: req.user!.id })
      .populate('programId', 'title category durationDays imageUrl difficulty')
      .sort({ updatedAt: -1 });

    res.json(enrollments);
  } catch (err: any) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

export default router;