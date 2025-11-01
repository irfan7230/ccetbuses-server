import { Router } from 'express';
import notificationController from '../controllers/notificationController';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Notification routes
router.get('/', notificationController.getNotifications);
router.put('/:notificationId/read', notificationController.markAsRead);

export default router;
