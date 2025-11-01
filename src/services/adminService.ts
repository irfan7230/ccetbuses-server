import admin from 'firebase-admin';
import { Bus, Route, ApprovalRequest, User } from '../types';
import logger from '../utils/logger';

const db = admin.firestore();

export class AdminService {
  // ============ Bus Management ============
  
  async createBus(busData: Omit<Bus, 'id' | 'createdAt' | 'updatedAt'>): Promise<Bus> {
    try {
      const busRef = db.collection('buses').doc();
      const bus: Bus = {
        id: busRef.id,
        ...busData,
        currentStudents: 0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await busRef.set(bus);
      logger.info(`Bus created: ${bus.id}`);
      return bus;
    } catch (error) {
      logger.error('Error creating bus:', error);
      throw error;
    }
  }

  async updateBus(busId: string, updates: Partial<Bus>): Promise<void> {
    try {
      await db.collection('buses').doc(busId).update({
        ...updates,
        updatedAt: new Date(),
      });
      logger.info(`Bus updated: ${busId}`);
    } catch (error) {
      logger.error('Error updating bus:', error);
      throw error;
    }
  }

  async deleteBus(busId: string): Promise<void> {
    try {
      await db.collection('buses').doc(busId).delete();
      logger.info(`Bus deleted: ${busId}`);
    } catch (error) {
      logger.error('Error deleting bus:', error);
      throw error;
    }
  }

  async getBuses(): Promise<Bus[]> {
    try {
      const snapshot = await db.collection('buses').get();
      return snapshot.docs.map(doc => doc.data() as Bus);
    } catch (error) {
      logger.error('Error getting buses:', error);
      throw error;
    }
  }

  async getBusById(busId: string): Promise<Bus | null> {
    try {
      const doc = await db.collection('buses').doc(busId).get();
      return doc.exists ? (doc.data() as Bus) : null;
    } catch (error) {
      logger.error('Error getting bus:', error);
      throw error;
    }
  }

  // ============ Route Management ============
  
  async createRoute(routeData: Omit<Route, 'id' | 'createdAt' | 'updatedAt'>): Promise<Route> {
    try {
      const routeRef = db.collection('routes').doc();
      const route: Route = {
        id: routeRef.id,
        ...routeData,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await routeRef.set(route);
      logger.info(`Route created: ${route.id}`);
      return route;
    } catch (error) {
      logger.error('Error creating route:', error);
      throw error;
    }
  }

  async updateRoute(routeId: string, updates: Partial<Route>): Promise<void> {
    try {
      await db.collection('routes').doc(routeId).update({
        ...updates,
        updatedAt: new Date(),
      });
      logger.info(`Route updated: ${routeId}`);
    } catch (error) {
      logger.error('Error updating route:', error);
      throw error;
    }
  }

  async deleteRoute(routeId: string): Promise<void> {
    try {
      await db.collection('routes').doc(routeId).delete();
      logger.info(`Route deleted: ${routeId}`);
    } catch (error) {
      logger.error('Error deleting route:', error);
      throw error;
    }
  }

  async getRoutes(): Promise<Route[]> {
    try {
      const snapshot = await db.collection('routes').get();
      return snapshot.docs.map(doc => doc.data() as Route);
    } catch (error) {
      logger.error('Error getting routes:', error);
      throw error;
    }
  }

  // ============ Approval Management ============
  
  async getApprovalRequests(status?: 'pending' | 'approved' | 'rejected'): Promise<ApprovalRequest[]> {
    try {
      let query: admin.firestore.Query = db.collection('approvalRequests');
      
      if (status) {
        query = query.where('status', '==', status);
      }
      
      const snapshot = await query.orderBy('requestedAt', 'desc').get();
      return snapshot.docs.map(doc => doc.data() as ApprovalRequest);
    } catch (error) {
      logger.error('Error getting approval requests:', error);
      throw error;
    }
  }

  async approveStudent(
    requestId: string, 
    adminId: string, 
    adminName: string
  ): Promise<void> {
    try {
      const requestRef = db.collection('approvalRequests').doc(requestId);
      const requestDoc = await requestRef.get();
      
      if (!requestDoc.exists) {
        throw new Error('Approval request not found');
      }
      
      const request = requestDoc.data() as ApprovalRequest;
      
      // Update approval request
      await requestRef.update({
        status: 'approved',
        reviewedBy: adminId,
        reviewedByName: adminName,
        reviewedAt: new Date(),
      });
      
      // Update student user document
      await db.collection('users').doc(request.studentId).update({
        isApproved: true,
        updatedAt: new Date(),
      });
      
      logger.info(`Student approved: ${request.studentId} by ${adminName}`);
    } catch (error) {
      logger.error('Error approving student:', error);
      throw error;
    }
  }

  async rejectStudent(
    requestId: string, 
    adminId: string, 
    adminName: string,
    reason: string
  ): Promise<void> {
    try {
      const requestRef = db.collection('approvalRequests').doc(requestId);
      const requestDoc = await requestRef.get();
      
      if (!requestDoc.exists) {
        throw new Error('Approval request not found');
      }
      
      const request = requestDoc.data() as ApprovalRequest;
      
      // Update approval request
      await requestRef.update({
        status: 'rejected',
        reviewedBy: adminId,
        reviewedByName: adminName,
        reviewedAt: new Date(),
        rejectionReason: reason,
      });
      
      logger.info(`Student rejected: ${request.studentId} by ${adminName}`);
    } catch (error) {
      logger.error('Error rejecting student:', error);
      throw error;
    }
  }

  // ============ User Management ============
  
  async getAllStudents(): Promise<User[]> {
    try {
      const snapshot = await db.collection('users')
        .where('role', '==', 'student')
        .get();
      return snapshot.docs.map(doc => doc.data() as User);
    } catch (error) {
      logger.error('Error getting students:', error);
      throw error;
    }
  }

  async getAllDrivers(): Promise<User[]> {
    try {
      const snapshot = await db.collection('users')
        .where('role', '==', 'driver')
        .get();
      return snapshot.docs.map(doc => doc.data() as User);
    } catch (error) {
      logger.error('Error getting drivers:', error);
      throw error;
    }
  }

  async assignDriverToBus(driverId: string, busId: string): Promise<void> {
    try {
      const driverDoc = await db.collection('users').doc(driverId).get();
      const driverData = driverDoc.data() as User;
      
      // Update bus with driver info
      await db.collection('buses').doc(busId).update({
        driverId: driverId,
        driverName: driverData.fullName,
        updatedAt: new Date(),
      });
      
      // Update driver with bus assignment
      await db.collection('users').doc(driverId).update({
        bus: busId,
        updatedAt: new Date(),
      });
      
      logger.info(`Driver ${driverId} assigned to bus ${busId}`);
    } catch (error) {
      logger.error('Error assigning driver to bus:', error);
      throw error;
    }
  }

  async getStudentsByBus(busId: string): Promise<User[]> {
    try {
      const snapshot = await db.collection('users')
        .where('role', '==', 'student')
        .where('bus', '==', busId)
        .where('isApproved', '==', true)
        .get();
      return snapshot.docs.map(doc => doc.data() as User);
    } catch (error) {
      logger.error('Error getting students by bus:', error);
      throw error;
    }
  }
}

export const adminService = new AdminService();
