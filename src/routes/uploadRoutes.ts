import { Router } from 'express';
import uploadController, { upload } from '../controllers/uploadController';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Upload routes
router.post(
  '/profile-image',
  upload.single('image'),
  uploadController.uploadProfileImage
);

router.post(
  '/chat-image',
  upload.single('image'),
  uploadController.uploadChatImage
);

router.post(
  '/voice',
  upload.single('audio'),
  uploadController.uploadVoiceMessage
);

export default router;
