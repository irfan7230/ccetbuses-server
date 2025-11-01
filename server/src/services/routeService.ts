import admin from '../config/firebase';
import logger from '../utils/logger';

interface RoutePoint {
  latitude: number;
  longitude: number;
  timestamp: number;
  accuracy: number;
  speed?: number;
}

interface BusStop {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  order: number;
  timestamp: number;
}

interface RecordedRouteData {
  busId: string;
  driverId: string;
  startPoint: { latitude: number; longitude: number } | null;
  routePoints: RoutePoint[];
  busStops: BusStop[];
  distance: number;
  recordedAt: number;
}

class RouteService {
  private db = admin.firestore();

  /**
   * Get route recording status for a bus
   */
  async getRecordingStatus(busId: string): Promise<{ enabled: boolean }> {
    try {
      const busDoc = await this.db.collection('buses').doc(busId).get();
      
      if (!busDoc.exists) {
        return { enabled: false };
      }

      const busData = busDoc.data();
      return { enabled: busData?.routeRecordingEnabled || false };
    } catch (error) {
      logger.error('Error getting recording status:', error);
      throw error;
    }
  }

  /**
   * Save recorded route to Firestore
   */
  async saveRecordedRoute(routeData: RecordedRouteData) {
    try {
      const routeRef = this.db.collection('recordedRoutes').doc();
      
      const routeDocument = {
        id: routeRef.id,
        busId: routeData.busId,
        driverId: routeData.driverId,
        startPoint: routeData.startPoint,
        routePoints: routeData.routePoints,
        busStops: routeData.busStops,
        distance: routeData.distance,
        recordedAt: admin.firestore.Timestamp.fromMillis(routeData.recordedAt),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        status: 'pending', // Can be 'pending', 'approved', 'active'
      };

      await routeRef.set(routeDocument);

      // Update bus stops in the bus document if approved
      // For now, we'll keep them as pending for admin review
      logger.info(`Route recorded successfully for bus ${routeData.busId}`);

      return {
        routeId: routeRef.id,
        message: 'Route recorded and submitted for review',
      };
    } catch (error) {
      logger.error('Error saving recorded route:', error);
      throw error;
    }
  }

  /**
   * Get all recorded routes for a bus
   */
  async getRecordedRoutes(busId: string) {
    try {
      const routesSnapshot = await this.db
        .collection('recordedRoutes')
        .where('busId', '==', busId)
        .orderBy('recordedAt', 'desc')
        .limit(10)
        .get();

      const routes = routesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      return routes;
    } catch (error) {
      logger.error('Error getting recorded routes:', error);
      throw error;
    }
  }

  /**
   * Enable route recording for a bus
   */
  async enableRouteRecording(busId: string) {
    try {
      const busRef = this.db.collection('buses').doc(busId);
      
      await busRef.update({
        routeRecordingEnabled: true,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      logger.info(`Route recording enabled for bus ${busId}`);
    } catch (error) {
      logger.error('Error enabling route recording:', error);
      throw error;
    }
  }

  /**
   * Disable route recording for a bus
   */
  async disableRouteRecording(busId: string) {
    try {
      const busRef = this.db.collection('buses').doc(busId);
      
      await busRef.update({
        routeRecordingEnabled: false,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      logger.info(`Route recording disabled for bus ${busId}`);
    } catch (error) {
      logger.error('Error disabling route recording:', error);
      throw error;
    }
  }

  /**
   * Approve and activate a recorded route
   */
  async approveRecordedRoute(routeId: string) {
    try {
      const routeRef = this.db.collection('recordedRoutes').doc(routeId);
      const routeDoc = await routeRef.get();

      if (!routeDoc.exists) {
        throw new Error('Route not found');
      }

      const routeData = routeDoc.data();
      
      // Update route status
      await routeRef.update({
        status: 'active',
        approvedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Update bus document with new stops
      const busRef = this.db.collection('buses').doc(routeData?.busId);
      await busRef.update({
        busStops: routeData?.busStops,
        routePoints: routeData?.routePoints,
        lastRouteUpdate: admin.firestore.FieldValue.serverTimestamp(),
      });

      logger.info(`Route ${routeId} approved and activated`);
    } catch (error) {
      logger.error('Error approving recorded route:', error);
      throw error;
    }
  }
}

export default new RouteService();
