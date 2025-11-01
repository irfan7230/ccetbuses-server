import { firestore } from '../config/firebase';
import { BusLocation, Location, BusStop } from '../types';
import logger from '../utils/logger';
import { getDistance } from 'geolib';
import config from '../config';

class LocationService {
  private activeBuses: Map<string, BusLocation> = new Map();

  /**
   * Update bus location (called by driver)
   */
  async updateBusLocation(busLocation: BusLocation): Promise<void> {
    try {
      // Store in memory for fast access
      this.activeBuses.set(busLocation.busId, busLocation);

      // Store in Firestore for persistence
      await firestore
        .collection('busLocations')
        .doc(busLocation.busId)
        .set({
          ...busLocation,
          updatedAt: new Date(),
        }, { merge: true });

      logger.info(`Updated location for bus ${busLocation.busId}`);
    } catch (error) {
      logger.error('Error updating bus location:', error);
      throw error;
    }
  }

  /**
   * Get current bus location
   */
  async getBusLocation(busId: string): Promise<BusLocation | null> {
    try {
      // Try to get from memory first
      const memoryLocation = this.activeBuses.get(busId);
      if (memoryLocation && this.isLocationFresh(memoryLocation.timestamp)) {
        return memoryLocation;
      }

      // Fall back to Firestore
      const doc = await firestore
        .collection('busLocations')
        .doc(busId)
        .get();

      if (!doc.exists) {
        return null;
      }

      const data = doc.data() as BusLocation;
      
      // Update memory cache
      this.activeBuses.set(busId, data);
      
      return data;
    } catch (error) {
      logger.error('Error getting bus location:', error);
      throw error;
    }
  }

  /**
   * Calculate distance to bus stop
   */
  calculateDistance(
    busLocation: Location,
    stopLocation: Location
  ): number {
    return getDistance(
      { latitude: busLocation.latitude, longitude: busLocation.longitude },
      { latitude: stopLocation.latitude, longitude: stopLocation.longitude }
    ) / 1000; // Convert to kilometers
  }

  /**
   * Check if bus is near any bus stop
   */
  async checkProximity(
    busId: string,
    currentLocation: Location
  ): Promise<{ stopId: string; stopName: string; distance: number }[]> {
    try {
      // Get all bus stops for this bus
      const stopsSnapshot = await firestore
        .collection('busStops')
        .where('busId', '==', busId)
        .orderBy('order')
        .get();

      const nearbyStops: { stopId: string; stopName: string; distance: number }[] = [];

      stopsSnapshot.forEach((doc: any) => {
        const stop = doc.data() as BusStop;
        const distance = this.calculateDistance(currentLocation, stop.location);

        // Check if within proximity distance
        if (distance <= config.tracking.proximityDistanceKm) {
          nearbyStops.push({
            stopId: doc.id,
            stopName: stop.name,
            distance,
          });
        }
      });

      return nearbyStops;
    } catch (error) {
      logger.error('Error checking proximity:', error);
      throw error;
    }
  }

  /**
   * Get students waiting at a bus stop
   */
  async getStudentsAtStop(busId: string, stopName: string): Promise<string[]> {
    try {
      const usersSnapshot = await firestore
        .collection('users')
        .where('bus', '==', busId)
        .where('busStop', '==', stopName)
        .where('role', '==', 'student')
        .get();

      return usersSnapshot.docs.map((doc: any) => doc.id);
    } catch (error) {
      logger.error('Error getting students at stop:', error);
      throw error;
    }
  }

  /**
   * Start tracking a trip
   */
  async startTrip(busId: string, driverId: string): Promise<string> {
    try {
      const tripRef = await firestore.collection('trips').add({
        busId,
        driverId,
        startTime: new Date(),
        status: 'active',
        route: [],
        createdAt: new Date(),
      });

      logger.info(`Started trip ${tripRef.id} for bus ${busId}`);
      return tripRef.id;
    } catch (error) {
      logger.error('Error starting trip:', error);
      throw error;
    }
  }

  /**
   * End a trip
   */
  async endTrip(tripId: string): Promise<void> {
    try {
      await firestore
        .collection('trips')
        .doc(tripId)
        .update({
          endTime: new Date(),
          status: 'completed',
          updatedAt: new Date(),
        });

      logger.info(`Ended trip ${tripId}`);
    } catch (error) {
      logger.error('Error ending trip:', error);
      throw error;
    }
  }

  /**
   * Get active trip for a bus
   */
  async getActiveTrip(busId: string): Promise<any | null> {
    try {
      const snapshot = await firestore
        .collection('trips')
        .where('busId', '==', busId)
        .where('status', '==', 'active')
        .limit(1)
        .get();

      if (snapshot.empty) {
        return null;
      }

      return {
        id: snapshot.docs[0].id,
        ...snapshot.docs[0].data(),
      };
    } catch (error) {
      logger.error('Error getting active trip:', error);
      throw error;
    }
  }

  /**
   * Check if location is fresh (within last 30 seconds)
   */
  private isLocationFresh(timestamp: number): boolean {
    const now = Date.now();
    return now - timestamp < 30000; // 30 seconds
  }

  /**
   * Clear old bus locations from memory
   */
  clearInactiveLocations(): void {
    const now = Date.now();
    this.activeBuses.forEach((location, busId) => {
      if (now - location.timestamp > 300000) { // 5 minutes
        this.activeBuses.delete(busId);
        logger.info(`Cleared inactive location for bus ${busId}`);
      }
    });
  }
}

export default new LocationService();
