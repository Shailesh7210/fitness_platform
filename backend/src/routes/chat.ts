import { Router, Response } from 'express';
import { body }             from 'express-validator';
import { ChatSession }      from '../models/ChatSession';
import { User }             from '../models/User';
import { authenticate, AuthRequest } from '../middleware/auth';
import { validate }         from '../middleware/validate';

const router = Router();
router.use(authenticate);

// Simple rate limit tracker — stored in memory
// Resets every 60 seconds per user
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(userId: string): boolean {
  const now    = Date.now();
  const limit  = rateLimitMap.get(userId);

  if (!limit || now > limit.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + 60000 });
    return true;
  }

  if (limit.count >= 20) return false;

  limit.count += 1;
  return true;
}

// Simple rule-based responses — replace with OpenAI later
function generateReply(
  message:   string,
  userName:  string,
  context:   string
): string {
  const msg = message.toLowerCase();

  if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey')) {
    return `Hi ${userName}! How can I help you today? I can assist with challenges, nutrition, programs, and more.`;
  }

  if (msg.includes('challenge')) {
    return `Great question about challenges! You can browse available challenges from your dashboard. Each challenge has a goal, duration, and leaderboard. Would you like tips on how to get started?`;
  }

  if (msg.includes('nutrition') || msg.includes('food') || msg.includes('meal') || msg.includes('calories')) {
    return `For nutrition, I recommend logging your meals daily to track calories and macros. Go to the Nutrition section to log meals and set your daily goals. Consistency is key!`;
  }

  if (msg.includes('weight')) {
    return `Tracking your weight weekly gives the best trend data. Log it in the Nutrition section. Remember — weight fluctuates daily, so focus on the weekly average rather than daily numbers.`;
  }

  if (msg.includes('program') || msg.includes('meditation') || msg.includes('mind')) {
    return `Our mind programs are designed to build habits over time. Start with a beginner program and do your daily check-in every day to maintain your streak!`;
  }

  if (msg.includes('leaderboard') || msg.includes('rank') || msg.includes('score')) {
    return `Leaderboard rankings update based on your activity score. The more consistently you log activities, the higher you rank. Keep going!`;
  }

  if (msg.includes('device') || msg.includes('fitbit') || msg.includes('garmin')) {
    return `You can connect your wearable devices in the Devices section. Once connected, your activity data syncs automatically to update your challenge progress.`;
  }

  if (msg.includes('help')) {
    return `I can help you with:\n• Challenges and enrollment\n• Nutrition and meal logging\n• Mind programs and daily check-ins\n• Leaderboard and scores\n• Device integrations\n\nWhat would you like to know more about?`;
  }

  // Check for flagged content
  const flaggedWords = ['spam', 'hate', 'abuse', 'violence'];
  const isFlagged    = flaggedWords.some(w => msg.includes(w));

  if (isFlagged) {
    return `I'm not able to help with that. Please keep our conversation respectful and focused on health and wellness topics.`;
  }

  return `Thanks for your message, ${userName}! I'm here to help with anything related to your health journey — challenges, nutrition, programs, or device tracking. What would you like to know?`;
}

// ── GET /api/chat/history ───────────────────────────────────────────
router.get('/history', async (req: AuthRequest, res: Response) => {
  try {
    const session = await ChatSession.findOne({ userId: req.user!.id });

    if (!session) {
      res.json({ messages: [] });
      return;
    }

    // Return last 50 messages
    const messages = session.messages.slice(-50);
    res.json({ messages });
  } catch (err: any) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ── POST /api/chat/message ──────────────────────────────────────────
router.post(
  '/message',
  [
    body('message')
      .trim()
      .notEmpty().withMessage('Message is required')
      .isLength({ max: 500 }).withMessage('Message cannot exceed 500 characters'),
  ],
  validate,
  async (req: AuthRequest, res: Response) => {
    try {
      // Rate limit check
      if (!checkRateLimit(req.user!.id)) {
        res.status(429).json({
          message:    'Too many messages. Please wait a moment.',
          retryAfter: 60,
        });
        return;
      }

      const { message } = req.body;

      // Get user info for personalised replies
      const user = await User.findById(req.user!.id).select('firstName role');
      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }

      // Get or create session
      let session = await ChatSession.findOne({ userId: req.user!.id });
      if (!session) {
        session = await ChatSession.create({
          userId:   req.user!.id,
          messages: [],
        });
      }

      // Check for flagged content
      const flaggedWords = ['spam', 'hate', 'abuse', 'violence'];
      const isFlagged    = flaggedWords.some(w =>
        message.toLowerCase().includes(w)
      );

      // Add user message
      session.messages.push({
        role:      'user',
        content:   message,
        flagged:   isFlagged,
        createdAt: new Date(),
      });

      // Generate reply
      const replyText = generateReply(
        message,
        user.firstName,
        session.messages
          .slice(-5)
          .map(m => `${m.role}: ${m.content}`)
          .join('\n')
      );

      // Add assistant reply
      session.messages.push({
        role:      'assistant',
        content:   replyText,
        flagged:   false,
        createdAt: new Date(),
      });

      // Keep only last 100 messages to avoid document growing too large
      if (session.messages.length > 100) {
        session.messages = session.messages.slice(-100);
      }

      await session.save();

      res.json({
        reply:   replyText,
        flagged: isFlagged,
      });
    } catch (err: any) {
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  }
);

// ── DELETE /api/chat/history ────────────────────────────────────────
router.delete('/history', async (req: AuthRequest, res: Response) => {
  try {
    await ChatSession.findOneAndUpdate(
      { userId: req.user!.id },
      { $set: { messages: [] } }
    );
    res.json({ message: 'Chat history cleared' });
  } catch (err: any) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

export default router;