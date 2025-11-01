import { Response } from 'express';
import { AuthRequest } from '../types';
import { firestore } from '../config/firebase';
import logger from '../utils/logger';

class UserController {
  /**
   * Get user profile
   */
  async getProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.uid;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      const userDoc = await firestore.collection('users').doc(userId).get();

      if (!userDoc.exists) {
        res.status(404).json({
          success: false,
          message: 'User not found',
        });
        return;
      }

      res.json({
        success: true,
        data: userDoc.data(),
      });
    } catch (error) {
      logger.error('Error getting profile:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get profile',
      });
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.uid;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      const { fullName, busStop, profileImageUri, fcmToken } = req.body;

      const updateData: any = {
        updatedAt: new Date(),
      };

      if (fullName) updateData.fullName = fullName;
      if (busStop) updateData.busStop = busStop;
      if (profileImageUri) updateData.profileImageUri = profileImageUri;
      if (fcmToken) updateData.fcmToken = fcmToken;

      await firestore.collection('users').doc(userId).update(updateData);

      res.json({
        success: true,
        message: 'Profile updated successfully',
      });
    } catch (error) {
      logger.error('Error updating profile:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update profile',
      });
    }
  }

  /**
   * Update FCM token
   */
  async updateFCMToken(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.uid;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      const { fcmToken } = req.body;

      if (!fcmToken) {
        res.status(400).json({
          success: false,
          message: 'FCM token is required',
        });
        return;
      }

      await firestore.collection('users').doc(userId).update({
        fcmToken,
        updatedAt: new Date(),
      });

      res.json({
        success: true,
        message: 'FCM token updated successfully',
      });
    } catch (error) {
      logger.error('Error updating FCM token:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update FCM token',
      });
    }
  }

  /**
   * Get bus members
   */
  async getBusMembers(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { busId } = req.params;

      if (!busId) {
        res.status(400).json({
          success: false,
          message: 'Bus ID is required',
        });
        return;
      }

      const usersSnapshot = await firestore
        .collection('users')
        .where('bus', '==', busId)
        .get();

      const members = usersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      res.json({
        success: true,
        data: members,
      });
    } catch (error) {
      logger.error('Error getting bus members:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get bus members',
      });
    }
  }
}

export default new UserController();
