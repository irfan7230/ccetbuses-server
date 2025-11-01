import { Router } from 'express';
import userRoutes from './userRoutes';
import uploadRoutes from './uploadRoutes';
import notificationRoutes from './notificationRoutes';
import adminRoutes from './adminRoutes';
import routeRoutes from './routeRoutes';

const router = Router();

// Health check
router.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'Sundhara Travels API is running',
    timestamp: new Date(),
  });
});

// API routes
router.use('/users', userRoutes);
router.use('/upload', uploadRoutes);
router.use('/notifications', notificationRoutes);
router.use('/admin', adminRoutes);
router.use('/routes', routeRoutes);

export default router;
