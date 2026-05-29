import { Router, Response } from 'express';
import { LeaderboardEntry } from '../models/LeaderboardEntry';
import { Challenge }        from '../models/Challenge';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

router.use(authenticate);

// ── GET /api/leaderboard/:challengeId ──────────────────────────────
router.get('/:challengeId', async (req: AuthRequest, res: Response) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page  as string) || 1);
    const limit = Math.max(1, parseInt(req.query.limit as string) || 20);

    const challenge = await Challenge.findById(req.params.challengeId);
    if (!challenge) {
      res.status(404).json({ message: 'Challenge not found' });
      return;
    }

    const skip  = (page - 1) * limit;
    const total = await LeaderboardEntry.countDocuments({
      challengeId: req.params.challengeId,
    });

    const entries = await LeaderboardEntry
      .find({ challengeId: req.params.challengeId })
      .sort({ score: -1, updatedAt: 1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'firstName lastName');

    // Assign rank numbers based on position
    const ranked = entries.map((entry, index) => ({
      rank:      skip + index + 1,
      score:     entry.score,
      userId:    (entry.userId as any)._id,
      name:      `${(entry.userId as any).firstName} ${(entry.userId as any).lastName}`,
      isMe:      entry.userId._id?.toString() === req.user!.id,
    }));

    // Find current user's position
    const myEntry = await LeaderboardEntry.findOne({
      challengeId: req.params.challengeId,
      userId:      req.user!.id,
    });

    let myRank = null;
    if (myEntry) {
      const above = await LeaderboardEntry.countDocuments({
        challengeId: req.params.challengeId,
        score:       { $gt: myEntry.score },
      });
      myRank = above + 1;
    }

    res.json({
      challenge: {
        id:    challenge._id,
        title: challenge.title,
        type:  challenge.type,
      },
      myRank,
      myScore:    myEntry?.score || 0,
      entries:    ranked,
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

// ── POST /api/leaderboard/:challengeId/score ───────────────────────
// Update the logged-in user's score for a challenge
router.post('/:challengeId/score', async (req: AuthRequest, res: Response) => {
  try {
    const { score } = req.body;

    if (typeof score !== 'number' || score < 0) {
      res.status(400).json({ message: 'Score must be a positive number' });
      return;
    }

    const entry = await LeaderboardEntry.findOneAndUpdate(
      {
        challengeId: req.params.challengeId,
        userId:      req.user!.id,
      },
      { score },
      { new: true, upsert: false }
    );

    if (!entry) {
      res.status(404).json({ message: 'You are not enrolled in this challenge' });
      return;
    }

    // Recalculate rank
    const above = await LeaderboardEntry.countDocuments({
      challengeId: req.params.challengeId,
      score:       { $gt: score },
    });

    await LeaderboardEntry.findByIdAndUpdate(entry._id, {
      rank: above + 1,
    });

    res.json({
      message: 'Score updated',
      score,
      rank: above + 1,
    });
  } catch (err: any) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

export default router;