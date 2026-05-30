import mongoose             from 'mongoose';
import { Router, Response } from 'express';
import { body }             from 'express-validator';
import { Post }             from '../../models/Post';
import { authenticate, requireAdmin, AuthRequest } from '../../middleware/auth';
import { validate }         from '../../middleware/validate';

const router = Router();
router.use(authenticate, requireAdmin);

// ── GET /api/admin/moderation/queue ────────────────────────────────
// Posts pending review, sorted by most reports first
router.get('/queue', async (_req: AuthRequest, res: Response) => {
  try {
    const page  = 1;
    const limit = 20;

    const posts = await Post
      .find({ status: 'pending_review' })
      .populate('authorId', 'firstName lastName email')
      .sort({ reportCount: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Post.countDocuments({ status: 'pending_review' });

    res.json({ posts, total });
  } catch (err: any) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ── GET /api/admin/moderation/all ──────────────────────────────────
// All posts with optional status filter
router.get('/all', async (req: AuthRequest, res: Response) => {
  try {
    const page   = Math.max(1, parseInt(req.query.page  as string) || 1);
    const limit  = Math.max(1, parseInt(req.query.limit as string) || 20);
    const status = String(req.query.status || '');

    const filter: any = {};
    if (status) filter.status = status;

    const total = await Post.countDocuments(filter);

    const posts = await Post
      .find(filter)
      .populate('authorId', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      posts,
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

// ── PATCH /api/admin/moderation/:id/approve ────────────────────────
router.patch('/:id/approve', async (req: AuthRequest, res: Response) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      res.status(404).json({ message: 'Post not found' });
      return;
    }

    post.status = 'active';
    post.auditLog.push({
      action:      'approved',
      performedBy: new mongoose.Types.ObjectId(req.user!.id),
      reason:      req.body.reason || '',
      at:          new Date(),
    });

    await post.save();
    res.json({ message: 'Post approved', post });
  } catch (err: any) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ── PATCH /api/admin/moderation/:id/reject ─────────────────────────
router.patch(
  '/:id/reject',
  [
    body('reason').trim().notEmpty().withMessage('Rejection reason is required'),
  ],
  validate,
  async (req: AuthRequest, res: Response) => {
    try {
      const post = await Post.findById(req.params.id);

      if (!post) {
        res.status(404).json({ message: 'Post not found' });
        return;
      }

      post.status = 'rejected';
      post.auditLog.push({
        action:      'rejected',
        performedBy: new mongoose.Types.ObjectId(req.user!.id),
        reason:      req.body.reason,
        at:          new Date(),
      });

      await post.save();
      res.json({ message: 'Post rejected', post });
    } catch (err: any) {
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  }
);

// ── PATCH /api/admin/moderation/:id/hide ───────────────────────────
router.patch('/:id/hide', async (req: AuthRequest, res: Response) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      res.status(404).json({ message: 'Post not found' });
      return;
    }

    post.status = 'hidden';
    post.auditLog.push({
      action:      'hidden',
      performedBy: new mongoose.Types.ObjectId(req.user!.id),
      reason:      req.body.reason || '',
      at:          new Date(),
    });

    await post.save();
    res.json({ message: 'Post hidden', post });
  } catch (err: any) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ── PATCH /api/admin/moderation/:id/unhide ─────────────────────────
router.patch('/:id/unhide', async (req: AuthRequest, res: Response) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      res.status(404).json({ message: 'Post not found' });
      return;
    }

    post.status = 'active';
    post.auditLog.push({
      action:      'unhidden',
      performedBy: new mongoose.Types.ObjectId(req.user!.id),
      reason:      req.body.reason || '',
      at:          new Date(),
    });

    await post.save();
    res.json({ message: 'Post unhidden', post });
  } catch (err: any) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ── DELETE /api/admin/moderation/:id ───────────────────────────────
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const post = await Post.findByIdAndDelete(req.params.id);

    if (!post) {
      res.status(404).json({ message: 'Post not found' });
      return;
    }

    res.json({ message: 'Post permanently deleted' });
  } catch (err: any) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

export default router;