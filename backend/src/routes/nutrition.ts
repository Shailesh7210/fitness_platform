import { Router, Response } from 'express';
import { body }        from 'express-validator';
import { MealLog }     from '../models/MealLog';
import { WeightLog }   from '../models/WeightLog';
import { NutritionGoal } from '../models/NutritionGoal';
import { authenticate, AuthRequest } from '../middleware/auth';
import { validate }    from '../middleware/validate';

const router = Router();
router.use(authenticate);

// ════════════════════════════════════════
// MEAL LOGS
// ════════════════════════════════════════

// GET /api/nutrition/meals?date=2025-01-15
router.get('/meals', async (req: AuthRequest, res: Response) => {
  try {
    const dateStr = req.query.date as string;
    const filter: any = { userId: req.user!.id };

    if (dateStr) {
      const start = new Date(dateStr);
      const end   = new Date(dateStr);
      end.setDate(end.getDate() + 1);
      filter.date = { $gte: start, $lt: end };
    }

    const meals = await MealLog
      .find(filter)
      .sort({ date: -1, mealType: 1 });

    // Calculate daily totals
    const totals = meals.reduce(
      (acc, m) => ({
        calories: acc.calories + m.calories,
        protein:  acc.protein  + m.protein,
        carbs:    acc.carbs    + m.carbs,
        fat:      acc.fat      + m.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );

    res.json({ meals, totals });
  } catch (err: any) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/nutrition/meals
router.post(
  '/meals',
  [
    body('foodName').trim().notEmpty().withMessage('Food name is required'),
    body('calories').isNumeric().withMessage('Calories must be a number'),
    body('mealType')
      .isIn(['breakfast','lunch','dinner','snack'])
      .withMessage('Invalid meal type'),
    body('date').isISO8601().withMessage('Valid date required'),
  ],
  validate,
  async (req: AuthRequest, res: Response) => {
    try {
      const meal = await MealLog.create({
        ...req.body,
        userId: req.user!.id,
      });
      res.status(201).json({ message: 'Meal logged', meal });
    } catch (err: any) {
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  }
);

// DELETE /api/nutrition/meals/:id
router.delete('/meals/:id', async (req: AuthRequest, res: Response) => {
  try {
    const meal = await MealLog.findOneAndDelete({
      _id:    req.params.id,
      userId: req.user!.id,
    });

    if (!meal) {
      res.status(404).json({ message: 'Meal not found' });
      return;
    }

    res.json({ message: 'Meal deleted' });
  } catch (err: any) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ════════════════════════════════════════
// WEIGHT LOGS
// ════════════════════════════════════════

// GET /api/nutrition/weight
router.get('/weight', async (req: AuthRequest, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 30;

    const logs = await WeightLog
      .find({ userId: req.user!.id })
      .sort({ date: -1 })
      .limit(limit);

    res.json(logs);
  } catch (err: any) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/nutrition/weight
router.post(
  '/weight',
  [
    body('weight').isNumeric().withMessage('Weight must be a number'),
    body('date').isISO8601().withMessage('Valid date required'),
    body('unit').optional().isIn(['kg','lbs']),
  ],
  validate,
  async (req: AuthRequest, res: Response) => {
    try {
      const log = await WeightLog.create({
        ...req.body,
        userId: req.user!.id,
      });
      res.status(201).json({ message: 'Weight logged', log });
    } catch (err: any) {
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  }
);

// ════════════════════════════════════════
// NUTRITION GOALS
// ════════════════════════════════════════

// GET /api/nutrition/goals
router.get('/goals', async (req: AuthRequest, res: Response) => {
  try {
    let goal = await NutritionGoal.findOne({ userId: req.user!.id });

    // Return defaults if not set yet
    if (!goal) {
      goal = await NutritionGoal.create({ userId: req.user!.id });
    }

    res.json(goal);
  } catch (err: any) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT /api/nutrition/goals
router.put(
  '/goals',
  [
    body('dailyCalories').optional().isNumeric(),
    body('dailyProtein').optional().isNumeric(),
    body('dailyCarbs').optional().isNumeric(),
    body('dailyFat').optional().isNumeric(),
    body('targetWeight').optional().isNumeric(),
    body('weeklyLossRate').optional().isNumeric(),
    body('dietType')
      .optional()
      .isIn(['standard','keto','vegetarian','vegan','paleo']),
  ],
  validate,
  async (req: AuthRequest, res: Response) => {
    try {
      const goal = await NutritionGoal.findOneAndUpdate(
        { userId: req.user!.id },
        { $set: req.body },
        { new: true, upsert: true }
      );
      res.json({ message: 'Goals updated', goal });
    } catch (err: any) {
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  }
);

// ════════════════════════════════════════
// RECOMMENDATIONS
// ════════════════════════════════════════

// GET /api/nutrition/recommendations
router.get('/recommendations', async (req: AuthRequest, res: Response) => {
  try {
    const goal = await NutritionGoal.findOne({ userId: req.user!.id });

    // Get last 7 days of meals
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const meals = await MealLog.find({
      userId: req.user!.id,
      date:   { $gte: sevenDaysAgo },
    });

    // Get last 30 days of weight
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const weights = await WeightLog
      .find({ userId: req.user!.id, date: { $gte: thirtyDaysAgo } })
      .sort({ date: 1 });

    const recommendations: any[] = [];

    // Average daily calories over 7 days
    const targetCals  = goal?.dailyCalories || 2000;
    const totalCals   = meals.reduce((s, m) => s + m.calories, 0);
    const avgDailyCals = meals.length > 0 ? totalCals / 7 : 0;

    if (avgDailyCals > targetCals + 200) {
      recommendations.push({
        type:     'calorie_alert',
        priority: 'high',
        message:  `You are averaging ${Math.round(avgDailyCals)} calories per day, which is ${Math.round(avgDailyCals - targetCals)} over your goal.`,
        action:   'Try reducing portion sizes or cutting high-calorie snacks.',
      });
    }

    if (avgDailyCals > 0 && avgDailyCals < targetCals - 400) {
      recommendations.push({
        type:     'low_calories',
        priority: 'medium',
        message:  'You are eating significantly below your calorie goal.',
        action:   'Make sure you are eating enough to fuel your body properly.',
      });
    }

    // Protein check
    const totalProtein  = meals.reduce((s, m) => s + m.protein, 0);
    const avgProtein    = meals.length > 0 ? totalProtein / 7 : 0;
    const targetProtein = goal?.dailyProtein || 50;

    if (avgProtein < targetProtein * 0.7) {
      recommendations.push({
        type:     'protein_gap',
        priority: 'medium',
        message:  `Your average protein intake is ${Math.round(avgProtein)}g, below your ${targetProtein}g target.`,
        action:   'Add more eggs, chicken, fish, legumes, or protein shakes to your meals.',
      });
    }

    // Weight plateau check
    if (weights.length >= 8) {
      const recent = weights.slice(-4).map(w => w.weight);
      const older  = weights.slice(-8, -4).map(w => w.weight);
      const recentAvg = recent.reduce((s, w) => s + w, 0) / recent.length;
      const olderAvg  = older.reduce((s, w) => s + w, 0)  / older.length;

      if (Math.abs(recentAvg - olderAvg) < 0.3) {
        recommendations.push({
          type:     'plateau',
          priority: 'medium',
          message:  'Your weight has not changed much in the past 3 weeks.',
          action:   'Consider adjusting your calorie intake or activity level to break through the plateau.',
        });
      }
    }

    // Positive feedback
    if (recommendations.length === 0) {
      recommendations.push({
        type:     'on_track',
        priority: 'low',
        message:  'Great job! Your nutrition looks balanced this week.',
        action:   'Keep it up and stay consistent.',
      });
    }

    res.json({ recommendations });
  } catch (err: any) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

export default router;