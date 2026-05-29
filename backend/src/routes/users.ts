import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { body } from 'express-validator';
import { User } from '../models/User';
import { authenticate, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

// ── PUT /api/users/profile ──────────────────────────────────────────
router.put(
  '/profile',
  authenticate,
  [
    body('firstName').trim().notEmpty().withMessage('First name is required'),
    body('lastName').trim().notEmpty().withMessage('Last name is required'),
  ],
  validate,
  async (req: AuthRequest, res: Response) => {
    try {
      const { firstName, lastName } = req.body;

      const user = await User.findByIdAndUpdate(
        req.user!.id,
        { firstName, lastName },
        { new: true }
      ).select('-passwordHash');

      res.json({
        message: 'Profile updated successfully',
        user,
      });
    } catch (err: any) {
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  }
);

// ── PUT /api/users/change-password ──────────────────────────────────
router.put(
  '/change-password',
  authenticate,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('New password must be at least 6 characters'),
  ],
  validate,
  async (req: AuthRequest, res: Response) => {
    try {
      const { currentPassword, newPassword } = req.body;

      const user = await User.findById(req.user!.id);
      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }

      const match = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!match) {
        res.status(400).json({ message: 'Current password is incorrect' });
        return;
      }

      const passwordHash = await bcrypt.hash(newPassword, 12);
      await User.findByIdAndUpdate(user._id, { passwordHash });

      res.json({ message: 'Password changed successfully' });
    } catch (err: any) {
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  }
);

export default router;