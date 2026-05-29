import { Router, Response } from 'express';
import { body }             from 'express-validator';
import { Questionnaire }    from '../../models/Questionnaire';
import { OnboardingResponse } from '../../models/OnboardingResponse';
import { authenticate, requireAdmin, AuthRequest } from '../../middleware/auth';
import { validate }         from '../../middleware/validate';

const router = Router();
router.use(authenticate, requireAdmin);

// GET /api/admin/onboarding
router.get('/', async (_req, res: Response) => {
  try {
    const questionnaires = await Questionnaire.find().sort({ version: -1 });
    res.json(questionnaires);
  } catch (err: any) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/admin/onboarding
router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('version').isInt({ min: 1 }).withMessage('Version must be a positive integer'),
    body('questions').isArray({ min: 1 }).withMessage('At least one question required'),
  ],
  validate,
  async (req: AuthRequest, res: Response) => {
    try {
      // Deactivate existing active questionnaire
      await Questionnaire.updateMany({}, { isActive: false });

      const questionnaire = await Questionnaire.create({
        ...req.body,
        isActive: true,
      });

      res.status(201).json({ message: 'Questionnaire created', questionnaire });
    } catch (err: any) {
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  }
);

// PATCH /api/admin/onboarding/:id/activate
router.patch('/:id/activate', async (req: AuthRequest, res: Response) => {
  try {
    await Questionnaire.updateMany({}, { isActive: false });

    const questionnaire = await Questionnaire.findByIdAndUpdate(
      req.params.id,
      { isActive: true },
      { new: true }
    );

    if (!questionnaire) {
      res.status(404).json({ message: 'Questionnaire not found' });
      return;
    }

    res.json({ message: 'Questionnaire activated', questionnaire });
  } catch (err: any) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/admin/onboarding/responses
// See all user responses
router.get('/responses', async (_req, res: Response) => {
  try {
    const responses = await OnboardingResponse
      .find()
      .populate('userId', 'firstName lastName email')
      .populate('questionnaireId', 'name version')
      .sort({ updatedAt: -1 });

    res.json(responses);
  } catch (err: any) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

export default router;