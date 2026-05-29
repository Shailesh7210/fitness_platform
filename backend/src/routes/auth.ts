import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body } from 'express-validator';
import { User } from '../models/User';
import { authenticate, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

// ── Helper: create JWT ──────────────────────────────────────────────
function signToken(user: any): string {
  return jwt.sign(
    { id: user._id, role: user.role, email: user.email },
    process.env.JWT_SECRET as string,
    { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any }
  );
}
// ── POST /api/auth/register ─────────────────────────────────────────
router.post(
  '/register',
  [
    body('firstName').trim().notEmpty().withMessage('First name is required'),
    body('lastName').trim().notEmpty().withMessage('Last name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
  ],
  validate,
  async (req: Request, res: Response) => {
    try {
      const { firstName, lastName, email, password } = req.body;

      const existing = await User.findOne({ email });
      if (existing) {
        res.status(400).json({ message: 'Email already registered' });
        return;
      }

      const passwordHash = await bcrypt.hash(password, 12);

      const user = await User.create({
        firstName,
        lastName,
        email,
        passwordHash,
      });

      const token = signToken(user);

      res.status(201).json({
        message: 'Account created successfully',
        token,
        user: {
          id:        user._id,
          firstName: user.firstName,
          lastName:  user.lastName,
          email:     user.email,
          role:      user.role,
        },
      });
    } catch (err: any) {
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  }
);

// ── POST /api/auth/login ────────────────────────────────────────────
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate,
  async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      const user = await User.findOne({ email });
      if (!user) {
        res.status(401).json({ message: 'Invalid email or password' });
        return;
      }

      if (!user.isActive) {
        res.status(403).json({ message: 'Account is deactivated. Contact support.' });
        return;
      }

      const match = await bcrypt.compare(password, user.passwordHash);
      if (!match) {
        res.status(401).json({ message: 'Invalid email or password' });
        return;
      }

      // Update last login time
      await User.findByIdAndUpdate(user._id, { lastLoginAt: new Date() });

      const token = signToken(user);

      res.json({
        message: 'Logged in successfully',
        token,
        user: {
          id:        user._id,
          firstName: user.firstName,
          lastName:  user.lastName,
          email:     user.email,
          role:      user.role,
        },
      });
    } catch (err: any) {
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  }
);

// ── GET /api/auth/me ────────────────────────────────────────────────
router.get(
  '/me',
  authenticate,
  async (req: AuthRequest, res: Response) => {
    try {
      const user = await User
        .findById(req.user!.id)
        .select('-passwordHash');

      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }

      res.json(user);
    } catch (err: any) {
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  }
);

// ── POST /api/auth/logout ───────────────────────────────────────────
// JWT is stateless — logout is handled on the frontend by deleting
// the token. This endpoint just confirms the action.
router.post('/logout', authenticate, (_req: AuthRequest, res: Response) => {
  res.json({ message: 'Logged out successfully' });
});

export default router;