import { Router } from 'express';
import routeController from '../controllers/routeController';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Route recording routes
router.get('/recording-status/:busId', routeController.getRecordingStatus);
router.post('/save-recorded', routeController.saveRecordedRoute);
router.get('/recorded/:busId', routeController.getRecordedRoutes);
router.post('/enable-recording', routeController.enableRouteRecording);
router.post('/disable-recording', routeController.disableRouteRecording);

export default router;
