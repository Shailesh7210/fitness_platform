import { Router, Response } from 'express';
import { TenantConfig }     from '../../models/TenantConfig';
import { authenticate, requireAdmin, AuthRequest } from '../../middleware/auth';

const router = Router();
router.use(authenticate, requireAdmin);

// ── GET /api/admin/config ───────────────────────────────────────────
router.get('/', async (_req: AuthRequest, res: Response) => {
  try {
    let config = await TenantConfig.findOne();

    // Create default config if none exists
    if (!config) {
      config = await TenantConfig.create({});
    }

    res.json(config);
  } catch (err: any) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ── PUT /api/admin/config ───────────────────────────────────────────
router.put('/', async (req: AuthRequest, res: Response) => {
  try {
    let config = await TenantConfig.findOne();

    if (!config) {
      config = await TenantConfig.create(req.body);
    } else {
      config = await TenantConfig.findByIdAndUpdate(
        config._id,
        { $set: req.body },
        { new: true }
      );
    }

    res.json({ message: 'Config updated', config });
  } catch (err: any) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

export default router;