import { Router, Response } from 'express';
import mongoose from 'mongoose';
import { Challenge }   from '../models/Challenge';
import { Enrollment }  from '../models/Enrollment';
import { LeaderboardEntry } from '../models/LeaderboardEntry';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// All routes require login
router.use(authenticate);

// ── GET /api/challenges ─────────────────────────────────────────────
// List all published challenges with optional filters
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const page   = Math.max(1, parseInt(req.query.page  as string) || 1);
    const limit  = Math.max(1, parseInt(req.query.limit as string) || 10);
    const type   = (req.query.type   as string) || '';
    const search = (req.query.search as string) || '';

    const filter: any = { status: 'published' };
    if (type)   filter.type = type;
    if (search) filter.title = { $regex: search, $options: 'i' };

    const skip  = (page - 1) * limit;
    const total = await Challenge.countDocuments(filter);

    const challenges = await Challenge
      .find(filter)
      .sort({ startDate: -1 })
      .skip(skip)
      .limit(limit)
      .populate('createdBy', 'firstName lastName');

    // Check which ones the current user is enrolled in
    const challengeIds = challenges.map(c => c._id);
    const enrollments  = await Enrollment.find({
      userId:      req.user!.id,
      challengeId: { $in: challengeIds },
    });

    const enrolledSet = new Set(
      enrollments.map(e => e.challengeId.toString())
    );

    const data = challenges.map(c => ({
      ...c.toObject(),
      isEnrolled: enrolledSet.has(c._id.toString()),
    }));

    res.json({
      data,
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

// ── GET /api/challenges/:id ─────────────────────────────────────────
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const challenge = await Challenge
      .findById(req.params.id)
      .populate('createdBy', 'firstName lastName');

    if (!challenge) {
      res.status(404).json({ message: 'Challenge not found' });
      return;
    }

    // Check enrollment status for this user
    const enrollment = await Enrollment.findOne({
      userId:      req.user!.id,
      challengeId: challenge._id,
    });

    res.json({
      ...challenge.toObject(),
      isEnrolled:       !!enrollment,
      enrollmentStatus: enrollment?.status || null,
      progress:         enrollment?.progress || 0,
    });
  } catch (err: any) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ── POST /api/challenges/:id/enroll ────────────────────────────────
router.post('/:id/enroll', async (req: AuthRequest, res: Response) => {
  try {
    const challenge = await Challenge.findById(req.params.id);

    if (!challenge) {
      res.status(404).json({ message: 'Challenge not found' });
      return;
    }

    if (challenge.status !== 'published') {
      res.status(400).json({ message: 'This challenge is not open for enrollment' });
      return;
    }

    // Check already enrolled
    const existing = await Enrollment.findOne({
      userId:      req.user!.id,
      challengeId: challenge._id,
    });

    if (existing) {
      res.status(400).json({ message: 'You are already enrolled in this challenge' });
      return;
    }

    // Create enrollment
    await Enrollment.create({
      userId:      req.user!.id,
      challengeId: challenge._id,
    });

    // Create leaderboard entry for this user
    await LeaderboardEntry.create({
      challengeId: challenge._id,
      userId:      req.user!.id,
      score:       0,
      rank:        0,
    });

    // Increment enrolled count on challenge
    await Challenge.findByIdAndUpdate(challenge._id, {
      $inc: { enrolledCount: 1 },
    });

    res.status(201).json({ message: 'Enrolled successfully' });
  } catch (err: any) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ── DELETE /api/challenges/:id/leave ───────────────────────────────
router.delete('/:id/leave', async (req: AuthRequest, res: Response) => {
  try {
    const enrollment = await Enrollment.findOneAndDelete({
      userId:      req.user!.id,
      challengeId: req.params.id,
    });

    if (!enrollment) {
      res.status(404).json({ message: 'You are not enrolled in this challenge' });
      return;
    }

    // Remove leaderboard entry
    await LeaderboardEntry.findOneAndDelete({
      userId:      req.user!.id,
      challengeId: req.params.id,
    });

    // Decrement enrolled count
    await Challenge.findByIdAndUpdate(req.params.id, {
      $inc: { enrolledCount: -1 },
    });

    res.json({ message: 'Left challenge successfully' });
  } catch (err: any) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ── GET /api/challenges/my/enrolled ────────────────────────────────
// Get all challenges the logged-in user is enrolled in
router.get('/my/enrolled', async (req: AuthRequest, res: Response) => {
  try {
    const enrollments = await Enrollment
      .find({ userId: req.user!.id })
      .populate({
        path:   'challengeId',
        select: 'title description type status startDate endDate goal imageUrl enrolledCount',
      })
      .sort({ joinedAt: -1 });

    const data = enrollments.map(e => ({
      enrollment: {
        id:       e._id,
        status:   e.status,
        progress: e.progress,
        joinedAt: e.joinedAt,
      },
      challenge: e.challengeId,
    }));

    res.json(data);
  } catch (err: any) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

export default router;