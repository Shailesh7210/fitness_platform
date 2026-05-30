import mongoose              from 'mongoose';
import { Router, Response }  from 'express';
import { body }              from 'express-validator';
import { Post }              from '../models/Post';
import { authenticate, AuthRequest } from '../middleware/auth';
import { validate }          from '../middleware/validate';

const router = Router();
router.use(authenticate);

// ── GET /api/posts ──────────────────────────────────────────────────
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page  as string) || 1);
    const limit = Math.max(1, parseInt(req.query.limit as string) || 20);
    const skip  = (page - 1) * limit;

    const total = await Post.countDocuments({ status: 'active' });

    const posts = await Post
      .find({ status: 'active' })
      .populate('authorId', 'firstName lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
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

// ── POST /api/posts ─────────────────────────────────────────────────
router.post(
  '/',
  [
    body('body')
      .trim()
      .notEmpty().withMessage('Post body is required')
      .isLength({ max: 2000 }).withMessage('Post cannot exceed 2000 characters'),
  ],
  validate,
  async (req: AuthRequest, res: Response) => {
    try {
      const post = await Post.create({
        authorId: req.user!.id,
        body:     req.body.body,
        imageUrl: req.body.imageUrl || '',
      });

      const populated = await post.populate('authorId', 'firstName lastName');
      res.status(201).json({ message: 'Post created', post: populated });
    } catch (err: any) {
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  }
);

// ── PUT /api/posts/:id ──────────────────────────────────────────────
router.put(
  '/:id',
  [
    body('body')
      .trim()
      .notEmpty().withMessage('Post body is required')
      .isLength({ max: 2000 }).withMessage('Post cannot exceed 2000 characters'),
  ],
  validate,
  async (req: AuthRequest, res: Response) => {
    try {
      const post = await Post.findOne({
        _id:      req.params.id,
        authorId: req.user!.id,
      });

      if (!post) {
        res.status(404).json({ message: 'Post not found' });
        return;
      }

      if (post.status === 'rejected') {
        res.status(400).json({ message: 'Cannot edit a rejected post' });
        return;
      }

      post.body = req.body.body;
      if (req.body.imageUrl !== undefined) post.imageUrl = req.body.imageUrl;
      await post.save();

      res.json({ message: 'Post updated', post });
    } catch (err: any) {
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  }
);

// ── DELETE /api/posts/:id ───────────────────────────────────────────
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const post = await Post.findOne({
      _id:      req.params.id,
      authorId: req.user!.id,
    });

    if (!post) {
      res.status(404).json({ message: 'Post not found' });
      return;
    }

    await Post.findByIdAndDelete(req.params.id);
    res.json({ message: 'Post deleted' });
  } catch (err: any) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ── POST /api/posts/:id/report ──────────────────────────────────────
router.post(
  '/:id/report',
  [
    body('reason')
      .trim()
      .notEmpty().withMessage('Report reason is required'),
  ],
  validate,
  async (req: AuthRequest, res: Response) => {
    try {
      const post = await Post.findById(req.params.id);

      if (!post) {
        res.status(404).json({ message: 'Post not found' });
        return;
      }

      if (post.status === 'rejected' || post.status === 'hidden') {
        res.status(400).json({ message: 'This post is not available' });
        return;
      }

      const alreadyReported = post.reports.some(
        r => r.reportedBy.toString() === req.user!.id
      );

      if (alreadyReported) {
        res.status(400).json({ message: 'You have already reported this post' });
        return;
      }

      post.reports.push({
        reportedBy: new mongoose.Types.ObjectId(req.user!.id),
        reason:     req.body.reason,
        createdAt:  new Date(),
      });
      post.reportCount += 1;

      // Auto-escalate at 3+ reports
      if (post.reportCount >= 3 && post.status === 'active') {
        post.status = 'pending_review';
        post.auditLog.push({
          action:      'auto_escalated',
          performedBy: null,
          reason:      'Reached 3 reports threshold',
          at:          new Date(),
        });
      }

      await post.save();
      res.json({ message: 'Post reported' });
    } catch (err: any) {
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  }
);

export default router;