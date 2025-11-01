import { Router } from 'express';
import { adminController } from '../controllers/adminController';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticateToken);
router.use(requireRole(['admin']));

// ============ Bus Management ============
router.post('/buses', adminController.createBus.bind(adminController));
router.get('/buses', adminController.getBuses.bind(adminController));
router.put('/buses/:busId', adminController.updateBus.bind(adminController));
router.delete('/buses/:busId', adminController.deleteBus.bind(adminController));

// ============ Route Management ============
router.post('/routes', adminController.createRoute.bind(adminController));
router.get('/routes', adminController.getRoutes.bind(adminController));
router.put('/routes/:routeId', adminController.updateRoute.bind(adminController));
router.delete('/routes/:routeId', adminController.deleteRoute.bind(adminController));

// ============ Approval Management ============
router.get('/approval-requests', adminController.getApprovalRequests.bind(adminController));
router.post('/approval-requests/:requestId/approve', adminController.approveStudent.bind(adminController));
router.post('/approval-requests/:requestId/reject', adminController.rejectStudent.bind(adminController));

// ============ User Management ============
router.get('/students', adminController.getAllStudents.bind(adminController));
router.get('/drivers', adminController.getAllDrivers.bind(adminController));
router.post('/assign-driver', adminController.assignDriverToBus.bind(adminController));
router.get('/students/bus/:busId', adminController.getStudentsByBus.bind(adminController));

export default router;
