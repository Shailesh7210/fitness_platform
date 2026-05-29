import { Router, Response }      from 'express';
import { Questionnaire }         from '../models/Questionnaire';
import { OnboardingResponse }    from '../models/OnboardingResponse';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// GET /api/onboarding
// Get the active questionnaire and the user's saved progress
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const questionnaire = await Questionnaire
      .findOne({ isActive: true })
      .sort({ version: -1 });

    if (!questionnaire) {
      res.status(404).json({ message: 'No active questionnaire found' });
      return;
    }

    // Check if user has a saved response
    const saved = await OnboardingResponse.findOne({
      userId:          req.user!.id,
      questionnaireId: questionnaire._id,
    });

    res.json({
      questionnaire,
      savedResponse: saved || null,
      isComplete:    saved?.status === 'completed',
    });
  } catch (err: any) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PATCH /api/onboarding/save
// Save progress — called after every answer
router.patch('/save', async (req: AuthRequest, res: Response) => {
  try {
    const { answers, currentQuestionId, questionnaireId, version } = req.body;

    const response = await OnboardingResponse.findOneAndUpdate(
      {
        userId:          req.user!.id,
        questionnaireId,
      },
      {
        $set: {
          answers,
          currentQuestionId,
          version,
          status: 'in_progress',
        },
      },
      { new: true, upsert: true }
    );

    res.json({ message: 'Progress saved', response });
  } catch (err: any) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/onboarding/complete
// Mark onboarding as fully complete
router.post('/complete', async (req: AuthRequest, res: Response) => {
  try {
    const { answers, questionnaireId, version } = req.body;

    const response = await OnboardingResponse.findOneAndUpdate(
      { userId: req.user!.id, questionnaireId },
      {
        $set: {
          answers,
          version,
          status:      'completed',
          completedAt: new Date(),
        },
      },
      { new: true, upsert: true }
    );

    res.json({ message: 'Onboarding completed', response });
  } catch (err: any) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

export default router;