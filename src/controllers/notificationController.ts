import { Response } from 'express';
import { AuthRequest } from '../types';
import notificationService from '../services/notificationService';
import logger from '../utils/logger';

class NotificationController {
  /**
   * Get user notifications
   */
  async getNotifications(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.uid;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      const notifications = await notificationService.getUserNotifications(userId);

      res.json({
        success: true,
        data: notifications,
      });
    } catch (error) {
      logger.error('Error getting notifications:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get notifications',
      });
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { notificationId } = req.params;

      if (!notificationId) {
        res.status(400).json({
          success: false,
          message: 'Notification ID is required',
        });
        return;
      }

      await notificationService.markAsRead(notificationId);

      res.json({
        success: true,
        message: 'Notification marked as read',
      });
    } catch (error) {
      logger.error('Error marking notification as read:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to mark notification as read',
      });
    }
  }
}

export default new NotificationController();
