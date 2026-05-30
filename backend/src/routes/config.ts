import { Router, Response } from 'express';
import { TenantConfig }     from '../models/TenantConfig';

const router = Router();

// ── GET /api/config ─────────────────────────────────────────────────
// Public — no auth needed
// Frontend fetches this on startup to get branding + feature flags
router.get('/', async (_req, res: Response) => {
  try {
    let config = await TenantConfig.findOne();

    if (!config) {
      config = await TenantConfig.create({});
    }

    // Only return safe fields — no internal IDs
    res.json({
      branding:  config.branding,
      labels:    config.labels,
      features:  config.features,
    });
  } catch (err: any) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

export default router;