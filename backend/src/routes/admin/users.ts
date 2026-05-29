import { Router, Response } from 'express';
import { body, query } from 'express-validator';
import { User } from '../../models/User';
import { authenticate, requireAdmin, AuthRequest } from '../../middleware/auth';
import { validate } from '../../middleware/validate';

const router = Router();

// All routes here require login + admin role
router.use(authenticate, requireAdmin);

// ── GET /api/admin/users ────────────────────────────────────────────
// Supports: ?page=1&limit=10&search=john&role=member&isActive=true
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const page     = Math.max(1, parseInt(req.query.page as string)  || 1);
    const limit    = Math.max(1, parseInt(req.query.limit as string) || 10);
    const search   = (req.query.search   as string) || '';
    const role     = (req.query.role     as string) || '';
    const isActive = (req.query.isActive as string) || '';

    // Build filter
    const filter: any = {};

    if (search) {
      filter.$or = [
        { firstName:   { $regex: search, $options: 'i' } },
        { lastName:    { $regex: search, $options: 'i' } },
        { email:       { $regex: search, $options: 'i' } },
      ];
    }

    if (role)     filter.role     = role;
    if (isActive) filter.isActive = isActive === 'true';

    const skip  = (page - 1) * limit;
    const total = await User.countDocuments(filter);

    const users = await User
      .find(filter)
      .select('-passwordHash')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      users,
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

// ── GET /api/admin/stats ────────────────────────────────────────────
router.get('/stats', async (_req: AuthRequest, res: Response) => {
  try {
    const [
      totalUsers,
      totalAdmins,
      totalMembers,
      activeUsers,
      inactiveUsers,
      newThisMonth,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'admin' }),
      User.countDocuments({ role: 'member' }),
      User.countDocuments({ isActive: true }),
      User.countDocuments({ isActive: false }),
      User.countDocuments({
        createdAt: {
          $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      }),
    ]);

    res.json({
      totalUsers,
      totalAdmins,
      totalMembers,
      activeUsers,
      inactiveUsers,
      newThisMonth,
    });
  } catch (err: any) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ── GET /api/admin/users/:id ────────────────────────────────────────
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const user = await User
      .findById(req.params.id)
      .select('-passwordHash');

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.json(user);
  } catch (err: any) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ── PATCH /api/admin/users/:id/role ────────────────────────────────
router.patch(
  '/:id/role',
  [
    body('role')
      .isIn(['admin', 'member'])
      .withMessage('Role must be admin or member'),
  ],
  validate,
  async (req: AuthRequest, res: Response) => {
    try {
      const user = await User.findByIdAndUpdate(
        req.params.id,
        { role: req.body.role },
        { new: true }
      ).select('-passwordHash');

      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }

      res.json({ message: 'Role updated', user });
    } catch (err: any) {
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  }
);

// ── PATCH /api/admin/users/:id/status ──────────────────────────────
router.patch(
  '/:id/status',
  [
    body('isActive')
      .isBoolean()
      .withMessage('isActive must be true or false'),
  ],
  validate,
  async (req: AuthRequest, res: Response) => {
    try {
      const user = await User.findByIdAndUpdate(
        req.params.id,
        { isActive: req.body.isActive },
        { new: true }
      ).select('-passwordHash');

      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }

      res.json({
        message: `User ${req.body.isActive ? 'activated' : 'deactivated'}`,
        user,
      });
    } catch (err: any) {
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  }
);

// ── DELETE /api/admin/users/:id ─────────────────────────────────────
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    // Prevent admin from deleting themselves
    if (req.params.id === req.user!.id) {
      res.status(400).json({ message: 'You cannot delete your own account' });
      return;
    }

    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.json({ message: 'User deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

export default router;