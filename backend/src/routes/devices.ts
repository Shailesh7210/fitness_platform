import { Router, Response } from 'express';
import { body }             from 'express-validator';
import { DeviceIntegration } from '../models/DeviceIntegration';
import { authenticate, AuthRequest } from '../middleware/auth';
import { validate }         from '../middleware/validate';

const router = Router();
router.use(authenticate);

const PLATFORMS = ['fitbit','garmin','apple_health','google_fit','whoop'];

// GET /api/devices
// Get all device integrations for the logged-in user
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const integrations = await DeviceIntegration.find({
      userId: req.user!.id,
    });

    // Return all platforms with their status
    const result = PLATFORMS.map(platform => {
      const found = integrations.find(i => i.platform === platform);
      return {
        platform,
        status:         found?.status         || 'disconnected',
        lastSyncAt:     found?.lastSyncAt      || null,
        lastSyncStatus: found?.lastSyncStatus  || '',
        errorMessage:   found?.errorMessage    || '',
        retryCount:     found?.retryCount      || 0,
      };
    });

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/devices/:platform/connect
// Simulate connecting a device
router.post(
  '/:platform/connect',
  [
    body('accessToken')
      .notEmpty()
      .withMessage('Access token is required'),
  ],
  validate,
  async (req: AuthRequest, res: Response) => {
    try {
      const { platform } = req.params;

      if (!PLATFORMS.includes(platform)) {
        res.status(400).json({ message: 'Invalid platform' });
        return;
      }

      const integration = await DeviceIntegration.findOneAndUpdate(
        { userId: req.user!.id, platform },
        {
          $set: {
            status:       'connected',
            accessToken:  req.body.accessToken,
            errorMessage: '',
            retryCount:   0,
          },
        },
        { new: true, upsert: true }
      );

      res.json({ message: `${platform} connected`, integration });
    } catch (err: any) {
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  }
);

// DELETE /api/devices/:platform/disconnect
router.delete(
  '/:platform/disconnect',
  async (req: AuthRequest, res: Response) => {
    try {
      const { platform } = req.params;

      await DeviceIntegration.findOneAndUpdate(
        { userId: req.user!.id, platform },
        {
          $set: {
            status:      'disconnected',
            accessToken: '',
            lastSyncAt:  null,
          },
        }
      );

      res.json({ message: `${platform} disconnected` });
    } catch (err: any) {
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  }
);

// POST /api/devices/:platform/sync
// Simulate a manual sync
router.post(
  '/:platform/sync',
  async (req: AuthRequest, res: Response) => {
    try {
      const { platform } = req.params;

      const integration = await DeviceIntegration.findOne({
        userId: req.user!.id,
        platform,
      });

      if (!integration || integration.status === 'disconnected') {
        res.status(400).json({ message: 'Device is not connected' });
        return;
      }

      // Set to syncing
      await DeviceIntegration.findOneAndUpdate(
        { userId: req.user!.id, platform },
        { $set: { status: 'syncing' } }
      );

      // Simulate sync delay then mark as done
      setTimeout(async () => {
        await DeviceIntegration.findOneAndUpdate(
          { userId: req.user!.id, platform },
          {
            $set: {
              status:         'connected',
              lastSyncAt:     new Date(),
              lastSyncStatus: 'success',
              errorMessage:   '',
              retryCount:     0,
            },
          }
        );
      }, 2000);

      res.json({ message: 'Sync started' });
    } catch (err: any) {
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  }
);

// POST /api/devices/:platform/retry
router.post(
  '/:platform/retry',
  async (req: AuthRequest, res: Response) => {
    try {
      const integration = await DeviceIntegration.findOneAndUpdate(
        { userId: req.user!.id, platform: req.params.platform },
        {
          $set: {
            status:       'connected',
            errorMessage: '',
            retryCount:   0,
          },
        },
        { new: true }
      );

      if (!integration) {
        res.status(404).json({ message: 'Integration not found' });
        return;
      }

      res.json({ message: 'Retry successful', integration });
    } catch (err: any) {
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  }
);

export default router;