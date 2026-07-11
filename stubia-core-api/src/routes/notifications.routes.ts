import { Router, Response } from 'express';
import { authenticate, AuthenticatedRequest } from '../middlewares/auth.middleware';
import { getVapidPublicKey, subscribeUser, unsubscribeUser } from '../services/PushNotificationService';

const router = Router();

// GET /api/notifications/vapid-key
router.get('/vapid-key', (req, res) => {
  res.json({ success: true, data: { publicKey: getVapidPublicKey() } });
});

// POST /api/notifications/subscribe
router.post('/subscribe', authenticate, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });
  const { subscription } = req.body;
  if (!subscription) {
    return res.status(400).json({ success: false, error: 'Subscription object required' });
  }

  subscribeUser(req.user.userId, subscription);
  res.json({ success: true, message: 'Subscribed to push notifications successfully' });
});

// POST /api/notifications/unsubscribe
router.post('/unsubscribe', authenticate, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });
  unsubscribeUser(req.user.userId);
  res.json({ success: true, message: 'Unsubscribed from push notifications successfully' });
});

export default router;
