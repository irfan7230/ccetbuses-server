import { Response } from 'express';
import { AuthRequest } from '../types';
import routeService from '../services/routeService';
import logger from '../utils/logger';

class RouteController {
  /**
   * Get route recording status for a bus
   */
  async getRecordingStatus(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { busId } = req.params;

      if (!busId) {
        res.status(400).json({
          success: false,
          message: 'Bus ID is required',
        });
        return;
      }

      const status = await routeService.getRecordingStatus(busId);

      res.json({
        success: true,
        data: status,
      });
    } catch (error) {
      logger.error('Error getting recording status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get recording status',
      });
    }
  }

  /**
   * Save recorded route
   */
  async saveRecordedRoute(req: AuthRequest, res: Response): Promise<void> {
    try {
      const routeData = req.body;

      if (!routeData.busId || !routeData.driverId) {
        res.status(400).json({
          success: false,
          message: 'Bus ID and Driver ID are required',
        });
        return;
      }

      const result = await routeService.saveRecordedRoute(routeData);

      res.json({
        success: true,
        message: 'Route saved successfully',
        data: result,
      });
    } catch (error) {
      logger.error('Error saving recorded route:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to save route',
      });
    }
  }

  /**
   * Get recorded routes for a bus
   */
  async getRecordedRoutes(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { busId } = req.params;

      if (!busId) {
        res.status(400).json({
          success: false,
          message: 'Bus ID is required',
        });
        return;
      }

      const routes = await routeService.getRecordedRoutes(busId);

      res.json({
        success: true,
        data: routes,
      });
    } catch (error) {
      logger.error('Error getting recorded routes:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get recorded routes',
      });
    }
  }

  /**
   * Enable route recording for a bus
   */
  async enableRouteRecording(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { busId } = req.body;

      if (!busId) {
        res.status(400).json({
          success: false,
          message: 'Bus ID is required',
        });
        return;
      }

      await routeService.enableRouteRecording(busId);

      res.json({
        success: true,
        message: 'Route recording enabled successfully',
      });
    } catch (error) {
      logger.error('Error enabling route recording:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to enable route recording',
      });
    }
  }

  /**
   * Disable route recording for a bus
   */
  async disableRouteRecording(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { busId } = req.body;

      if (!busId) {
        res.status(400).json({
          success: false,
          message: 'Bus ID is required',
        });
        return;
      }

      await routeService.disableRouteRecording(busId);

      res.json({
        success: true,
        message: 'Route recording disabled successfully',
      });
    } catch (error) {
      logger.error('Error disabling route recording:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to disable route recording',
      });
    }
  }
}

export default new RouteController();
