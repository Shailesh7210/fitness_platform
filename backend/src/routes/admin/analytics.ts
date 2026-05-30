import { Router, Response } from 'express';
import { User }             from '../../models/User';
import { Challenge }        from '../../models/Challenge';
import { Enrollment }       from '../../models/Enrollment';
import { MealLog }          from '../../models/MealLog';
import { Post }             from '../../models/Post';
import { ProgramEnrollment } from '../../models/ProgramEnrollment';
import { authenticate, requireAdmin, AuthRequest } from '../../middleware/auth';

const router = Router();
router.use(authenticate, requireAdmin);

// ── GET /api/admin/analytics/overview ──────────────────────────────
router.get('/overview', async (_req: AuthRequest, res: Response) => {
  try {
    const now       = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [
      totalUsers,
      newUsersThisMonth,
      newUsersLastMonth,
      activeUsers,
      totalChallenges,
      publishedChallenges,
      totalEnrollments,
      totalPosts,
      pendingModeration,
      totalMealLogs,
      totalProgramEnrollments,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ createdAt: { $gte: thisMonth } }),
      User.countDocuments({ createdAt: { $gte: lastMonth, $lt: thisMonth } }),
      User.countDocuments({ isActive: true }),
      Challenge.countDocuments(),
      Challenge.countDocuments({ status: 'published' }),
      Enrollment.countDocuments(),
      Post.countDocuments(),
      Post.countDocuments({ status: 'pending_review' }),
      MealLog.countDocuments(),
      ProgramEnrollment.countDocuments(),
    ]);

    // Growth rate vs last month
    const userGrowth = newUsersLastMonth > 0
      ? Math.round(((newUsersThisMonth - newUsersLastMonth) / newUsersLastMonth) * 100)
      : 100;

    res.json({
      users: {
        total:          totalUsers,
        active:         activeUsers,
        newThisMonth:   newUsersThisMonth,
        newLastMonth:   newUsersLastMonth,
        growthPercent:  userGrowth,
      },
      challenges: {
        total:     totalChallenges,
        published: publishedChallenges,
        totalEnrollments,
      },
      content: {
        totalPosts,
        pendingModeration,
        totalMealLogs,
        totalProgramEnrollments,
      },
    });
  } catch (err: any) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ── GET /api/admin/analytics/users-over-time ────────────────────────
// New users per day for the last 30 days
router.get('/users-over-time', async (_req: AuthRequest, res: Response) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const data = await User.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { date: '$_id', count: 1, _id: 0 } },
    ]);

    res.json(data);
  } catch (err: any) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ── GET /api/admin/analytics/enrollments-by-challenge ──────────────
router.get('/enrollments-by-challenge', async (_req: AuthRequest, res: Response) => {
  try {
    const data = await Enrollment.aggregate([
      {
        $group: {
          _id:   '$challengeId',
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from:         'challenges',
          localField:   '_id',
          foreignField: '_id',
          as:           'challenge',
        },
      },
      { $unwind: '$challenge' },
      {
        $project: {
          challengeId:   '$_id',
          challengeName: '$challenge.title',
          type:          '$challenge.type',
          count:         1,
          _id:           0,
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    res.json(data);
  } catch (err: any) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ── GET /api/admin/analytics/engagement ────────────────────────────
// Engagement metrics for last 7 days
router.get('/engagement', async (_req: AuthRequest, res: Response) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [
      newEnrollments,
      newPosts,
      newMealLogs,
    ] = await Promise.all([
      Enrollment.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      Post.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      MealLog.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
    ]);

    res.json({
      period:         'last_7_days',
      newEnrollments,
      newPosts,
      newMealLogs,
    });
  } catch (err: any) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

export default router;