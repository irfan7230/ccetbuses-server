import { Response } from 'express';
import { AuthRequest, ApiResponse } from '../types';
import { adminService } from '../services/adminService';
import logger from '../utils/logger';

export class AdminController {
  // ============ Bus Management ============
  
  async createBus(req: AuthRequest, res: Response<ApiResponse>) {
    try {
      const { name, number, routeId, capacity } = req.body;
      
      if (!name || !number || !routeId || !capacity) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields',
        });
      }

      const bus = await adminService.createBus({
        name,
        number,
        routeId,
        capacity,
        currentStudents: 0,
        isActive: true,
      });

      return res.json({
        success: true,
        message: 'Bus created successfully',
        data: bus,
      });
    } catch (error) {
      logger.error('Error creating bus:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create bus',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async updateBus(req: AuthRequest, res: Response<ApiResponse>) {
    try {
      const { busId } = req.params;
      const updates = req.body;

      await adminService.updateBus(busId, updates);

      return res.json({
        success: true,
        message: 'Bus updated successfully',
      });
    } catch (error) {
      logger.error('Error updating bus:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update bus',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async deleteBus(req: AuthRequest, res: Response<ApiResponse>) {
    try {
      const { busId } = req.params;

      await adminService.deleteBus(busId);

      return res.json({
        success: true,
        message: 'Bus deleted successfully',
      });
    } catch (error) {
      logger.error('Error deleting bus:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete bus',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async getBuses(_req: AuthRequest, res: Response<ApiResponse>) {
    try {
      const buses = await adminService.getBuses();

      return res.json({
        success: true,
        message: 'Buses retrieved successfully',
        data: buses,
      });
    } catch (error) {
      logger.error('Error getting buses:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get buses',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // ============ Route Management ============
  
  async createRoute(req: AuthRequest, res: Response<ApiResponse>) {
    try {
      const { name, description, stops, distance, estimatedDuration } = req.body;
      
      if (!name || !stops || !distance || !estimatedDuration) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields',
        });
      }

      const route = await adminService.createRoute({
        name,
        description,
        stops,
        distance,
        estimatedDuration,
        isActive: true,
      });

      return res.json({
        success: true,
        message: 'Route created successfully',
        data: route,
      });
    } catch (error) {
      logger.error('Error creating route:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create route',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async updateRoute(req: AuthRequest, res: Response<ApiResponse>) {
    try {
      const { routeId } = req.params;
      const updates = req.body;

      await adminService.updateRoute(routeId, updates);

      return res.json({
        success: true,
        message: 'Route updated successfully',
      });
    } catch (error) {
      logger.error('Error updating route:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update route',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async deleteRoute(req: AuthRequest, res: Response<ApiResponse>) {
    try {
      const { routeId } = req.params;

      await adminService.deleteRoute(routeId);

      return res.json({
        success: true,
        message: 'Route deleted successfully',
      });
    } catch (error) {
      logger.error('Error deleting route:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete route',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async getRoutes(_req: AuthRequest, res: Response<ApiResponse>) {
    try {
      const routes = await adminService.getRoutes();

      return res.json({
        success: true,
        message: 'Routes retrieved successfully',
        data: routes,
      });
    } catch (error) {
      logger.error('Error getting routes:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get routes',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // ============ Approval Management ============
  
  async getApprovalRequests(req: AuthRequest, res: Response<ApiResponse>) {
    try {
      const { status } = req.query;
      
      const requests = await adminService.getApprovalRequests(
        status as 'pending' | 'approved' | 'rejected' | undefined
      );

      return res.json({
        success: true,
        message: 'Approval requests retrieved successfully',
        data: requests,
      });
    } catch (error) {
      logger.error('Error getting approval requests:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get approval requests',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async approveStudent(req: AuthRequest, res: Response<ApiResponse>) {
    try {
      const { requestId } = req.params;
      const adminId = req.user?.uid;
      const adminName = req.user?.email || 'Admin';

      if (!adminId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
      }

      await adminService.approveStudent(requestId, adminId, adminName);

      return res.json({
        success: true,
        message: 'Student approved successfully',
      });
    } catch (error) {
      logger.error('Error approving student:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to approve student',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async rejectStudent(req: AuthRequest, res: Response<ApiResponse>) {
    try {
      const { requestId } = req.params;
      const { reason } = req.body;
      const adminId = req.user?.uid;
      const adminName = req.user?.email || 'Admin';

      if (!adminId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
      }

      if (!reason) {
        return res.status(400).json({
          success: false,
          message: 'Rejection reason is required',
        });
      }

      await adminService.rejectStudent(requestId, adminId, adminName, reason);

      return res.json({
        success: true,
        message: 'Student rejected successfully',
      });
    } catch (error) {
      logger.error('Error rejecting student:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to reject student',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // ============ User Management ============
  
  async getAllStudents(_req: AuthRequest, res: Response<ApiResponse>) {
    try {
      const students = await adminService.getAllStudents();

      return res.json({
        success: true,
        message: 'Students retrieved successfully',
        data: students,
      });
    } catch (error) {
      logger.error('Error getting students:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get students',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async getAllDrivers(_req: AuthRequest, res: Response<ApiResponse>) {
    try {
      const drivers = await adminService.getAllDrivers();

      return res.json({
        success: true,
        message: 'Drivers retrieved successfully',
        data: drivers,
      });
    } catch (error) {
      logger.error('Error getting drivers:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get drivers',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async assignDriverToBus(req: AuthRequest, res: Response<ApiResponse>) {
    try {
      const { driverId, busId } = req.body;

      if (!driverId || !busId) {
        return res.status(400).json({
          success: false,
          message: 'Driver ID and Bus ID are required',
        });
      }

      await adminService.assignDriverToBus(driverId, busId);

      return res.json({
        success: true,
        message: 'Driver assigned to bus successfully',
      });
    } catch (error) {
      logger.error('Error assigning driver to bus:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to assign driver to bus',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async getStudentsByBus(req: AuthRequest, res: Response<ApiResponse>) {
    try {
      const { busId } = req.params;

      const students = await adminService.getStudentsByBus(busId);

      return res.json({
        success: true,
        message: 'Students retrieved successfully',
        data: students,
      });
    } catch (error) {
      logger.error('Error getting students by bus:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get students by bus',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

export const adminController = new AdminController();
