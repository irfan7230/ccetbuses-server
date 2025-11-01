import { messaging, firestore } from '../config/firebase';
import { Notification } from '../types';
import logger from '../utils/logger';

class NotificationService {
  /**
   * Send push notification to a user
   */
  async sendToUser(
    userId: string,
    notification: {
      title: string;
      body: string;
      data?: any;
    }
  ): Promise<void> {
    try {
      // Get user's FCM token
      const userDoc = await firestore.collection('users').doc(userId).get();
      
      if (!userDoc.exists) {
        logger.warn(`User ${userId} not found`);
        return;
      }

      const userData = userDoc.data();
      const fcmToken = userData?.fcmToken;

      if (!fcmToken) {
        logger.warn(`No FCM token for user ${userId}`);
        return;
      }

      // Send notification
      await messaging.send({
        token: fcmToken,
        notification: {
          title: notification.title,
          body: notification.body,
        },
        data: notification.data || {},
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            channelId: 'bus_tracking',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            },
          },
        },
      });

      // Save notification to database
      await this.saveNotification(userId, notification);

      logger.info(`Sent notification to user ${userId}`);
    } catch (error) {
      logger.error('Error sending notification:', error);
    }
  }

  /**
   * Send notification to multiple users
   */
  async sendToMultiple(
    userIds: string[],
    notification: {
      title: string;
      body: string;
      data?: any;
    }
  ): Promise<void> {
    try {
      const promises = userIds.map((userId) =>
        this.sendToUser(userId, notification)
      );
      await Promise.allSettled(promises);
      logger.info(`Sent notifications to ${userIds.length} users`);
    } catch (error) {
      logger.error('Error sending bulk notifications:', error);
    }
  }

  /**
   * Send proximity alert
   */
  async sendProximityAlert(
    userId: string,
    busId: string,
    stopName: string,
    distance: number
  ): Promise<void> {
    await this.sendToUser(userId, {
      title: '🚌 Bus Approaching!',
      body: `Your bus is ${distance.toFixed(1)}km away from ${stopName}`,
      data: {
        type: 'proximity',
        busId,
        stopName,
        distance: distance.toString(),
      },
    });
  }

  /**
   * Send trip started notification
   */
  async sendTripStarted(busId: string): Promise<void> {
    try {
      // Get all students for this bus
      const studentsSnapshot = await firestore
        .collection('users')
        .where('bus', '==', busId)
        .where('role', '==', 'student')
        .get();

      const userIds = studentsSnapshot.docs.map((doc) => doc.id);

      await this.sendToMultiple(userIds, {
        title: '🚌 Trip Started',
        body: 'Your bus has started the trip. Track it in real-time!',
        data: {
          type: 'trip_started',
          busId,
        },
      });
    } catch (error) {
      logger.error('Error sending trip started notification:', error);
    }
  }

  /**
   * Send trip ended notification
   */
  async sendTripEnded(busId: string): Promise<void> {
    try {
      // Get all students for this bus
      const studentsSnapshot = await firestore
        .collection('users')
        .where('bus', '==', busId)
        .where('role', '==', 'student')
        .get();

      const userIds = studentsSnapshot.docs.map((doc) => doc.id);

      await this.sendToMultiple(userIds, {
        title: '🏁 Trip Ended',
        body: 'Your bus has reached the destination.',
        data: {
          type: 'trip_ended',
          busId,
        },
      });
    } catch (error) {
      logger.error('Error sending trip ended notification:', error);
    }
  }

  /**
   * Save notification to database
   */
  private async saveNotification(
    userId: string,
    notification: {
      title: string;
      body: string;
      data?: any;
    }
  ): Promise<void> {
    try {
      const notificationData: Notification = {
        id: '',
        userId,
        type: notification.data?.type || 'announcement',
        title: notification.title,
        message: notification.body,
        data: notification.data,
        isRead: false,
        createdAt: new Date(),
      };

      await firestore.collection('notifications').add(notificationData);
    } catch (error) {
      logger.error('Error saving notification:', error);
    }
  }

  /**
   * Get user notifications
   */
  async getUserNotifications(userId: string, limit: number = 50): Promise<Notification[]> {
    try {
      // Try with orderBy first (requires composite index)
      try {
        const snapshot = await firestore
          .collection('notifications')
          .where('userId', '==', userId)
          .orderBy('createdAt', 'desc')
          .limit(limit)
          .get();

        return snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Notification[];
      } catch (indexError: any) {
        // If composite index doesn't exist, fall back to simple query
        if (indexError.code === 9 || indexError.message?.includes('index')) {
          logger.warn('Composite index not found, using simple query for notifications');
          
          const snapshot = await firestore
            .collection('notifications')
            .where('userId', '==', userId)
            .limit(limit)
            .get();

          // Sort in memory
          const notifications = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Notification[];

          return notifications.sort((a, b) => {
            const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
            const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
            return bTime - aTime;
          });
        }
        throw indexError;
      }
    } catch (error) {
      logger.error('Error getting user notifications:', error);
      // Return empty array instead of throwing to prevent app crashes
      return [];
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    try {
      await firestore
        .collection('notifications')
        .doc(notificationId)
        .update({ isRead: true });
    } catch (error) {
      logger.error('Error marking notification as read:', error);
      throw error;
    }
  }
}

export default new NotificationService();
