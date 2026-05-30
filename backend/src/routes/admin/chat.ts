import { Router, Response } from 'express';
import { ChatSession }      from '../../models/ChatSession';
import { authenticate, requireAdmin, AuthRequest } from '../../middleware/auth';

const router = Router();
router.use(authenticate, requireAdmin);

// ── GET /api/admin/chat/sessions ───────────────────────────────────
router.get('/sessions', async (_req: AuthRequest, res: Response) => {
  try {
    const sessions = await ChatSession
      .find()
      .populate('userId', 'firstName lastName email')
      .sort({ updatedAt: -1 })
      .limit(50);

    const summary = sessions.map(s => ({
      userId:       (s.userId as any)._id,
      userName:     `${(s.userId as any).firstName} ${(s.userId as any).lastName}`,
      email:        (s.userId as any).email,
      messageCount: s.messages.length,
      flaggedCount: s.messages.filter(m => m.flagged).length,
      lastMessage:  s.messages[s.messages.length - 1]?.content || '',
      updatedAt:    s.updatedAt,
    }));

    res.json(summary);
  } catch (err: any) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ── GET /api/admin/chat/sessions/:userId ───────────────────────────
router.get('/sessions/:userId', async (req: AuthRequest, res: Response) => {
  try {
    const session = await ChatSession
      .findOne({ userId: req.params.userId })
      .populate('userId', 'firstName lastName email');

    if (!session) {
      res.status(404).json({ message: 'No chat session found for this user' });
      return;
    }

    res.json(session);
  } catch (err: any) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ── GET /api/admin/chat/flagged ─────────────────────────────────────
router.get('/flagged', async (_req: AuthRequest, res: Response) => {
  try {
    const sessions = await ChatSession.find({
      'messages.flagged': true,
    }).populate('userId', 'firstName lastName email');

    const flagged = sessions.flatMap(s =>
      s.messages
        .filter(m => m.flagged)
        .map(m => ({
          userId:    (s.userId as any)._id,
          userName:  `${(s.userId as any).firstName} ${(s.userId as any).lastName}`,
          email:     (s.userId as any).email,
          role:      m.role,
          content:   m.content,
          createdAt: m.createdAt,
        }))
    );

    res.json(flagged);
  } catch (err: any) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

export default router;