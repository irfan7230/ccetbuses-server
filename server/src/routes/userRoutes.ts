import { Router } from 'express';
import userController from '../controllers/userController';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// User profile routes
router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);
router.put('/fcm-token', userController.updateFCMToken);

// Bus members
router.get('/bus/:busId/members', userController.getBusMembers);

export default router;
