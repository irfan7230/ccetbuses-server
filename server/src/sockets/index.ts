import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import logger from '../utils/logger';
import locationService from '../services/locationService';
import notificationService from '../services/notificationService';
import { BusLocation, SocketUser } from '../types';
import config from '../config';

class SocketHandler {
  private io: SocketIOServer;
  private connectedUsers: Map<string, SocketUser> = new Map();
  private driverSockets: Map<string, string> = new Map(); // busId -> socketId

  constructor(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: config.allowedOrigins,
        methods: ['GET', 'POST'],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    });

    this.initialize();
  }

  private initialize() {
    this.io.on('connection', (socket: Socket) => {
      logger.info(`Client connected: ${socket.id}`);

      // Handle user joining
      socket.on('join', (data: { userId: string; role: 'student' | 'driver'; busId: string }) => {
        this.handleJoin(socket, data);
      });

      // Handle location updates from driver
      socket.on('location_update', (location: BusLocation) => {
        this.handleLocationUpdate(socket, location);
      });

      // Handle chat messages
      socket.on('chat_message', (message: any) => {
        this.handleChatMessage(socket, message);
      });

      // Handle typing indicator
      socket.on('typing', (data: { busId: string; isTyping: boolean; userName: string }) => {
        this.handleTyping(socket, data);
      });

      // Handle trip start
      socket.on('start_trip', (data: { busId: string; driverId: string }) => {
        this.handleStartTrip(socket, data);
      });

      // Handle trip end
      socket.on('end_trip', (data: { tripId: string; busId: string }) => {
        this.handleEndTrip(socket, data);
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });
    });

    logger.info('Socket.io initialized');
  }

  private handleJoin(
    socket: Socket,
    data: { userId: string; role: 'student' | 'driver'; busId: string }
  ) {
    const { userId, role, busId } = data;

    // Store user connection
    this.connectedUsers.set(socket.id, {
      socketId: socket.id,
      userId,
      role,
      busId,
    });

    // Join bus-specific room
    socket.join(`bus_${busId}`);

    // If driver, track their socket for location updates
    if (role === 'driver') {
      this.driverSockets.set(busId, socket.id);
      logger.info(`Driver joined bus ${busId}`);
    }

    // Send current bus location to the user
    this.sendCurrentLocation(socket, busId);

    logger.info(`User ${userId} (${role}) joined bus ${busId}`);
  }

  private async handleLocationUpdate(socket: Socket, location: BusLocation) {
    try {
      const user = this.connectedUsers.get(socket.id);

      if (!user || user.role !== 'driver') {
        logger.warn('Unauthorized location update attempt');
        return;
      }

      // Update location in database
      await locationService.updateBusLocation(location);

      // Broadcast to all students on this bus
      this.io.to(`bus_${location.busId}`).emit('bus_location', location);

      // Check proximity to bus stops
      const nearbyStops = await locationService.checkProximity(
        location.busId,
        { latitude: location.latitude, longitude: location.longitude, timestamp: location.timestamp }
      );

      // Send proximity alerts
      for (const stop of nearbyStops) {
        const students = await locationService.getStudentsAtStop(
          location.busId,
          stop.stopName
        );

        for (const studentId of students) {
          await notificationService.sendProximityAlert(
            studentId,
            location.busId,
            stop.stopName,
            stop.distance
          );
        }
      }

      logger.debug(`Location updated for bus ${location.busId}`);
    } catch (error) {
      logger.error('Error handling location update:', error);
    }
  }

  private handleChatMessage(socket: Socket, message: any) {
    const user = this.connectedUsers.get(socket.id);

    if (!user) {
      logger.warn('Unauthorized chat message attempt');
      return;
    }

    // Broadcast to all users in the same bus
    this.io.to(`bus_${user.busId}`).emit('chat_message', {
      ...message,
      senderId: user.userId,
    });

    logger.debug(`Chat message sent in bus ${user.busId}`);
  }

  private handleTyping(
    socket: Socket,
    data: { busId: string; isTyping: boolean; userName: string }
  ) {
    // Broadcast typing indicator to others in the same bus
    socket.to(`bus_${data.busId}`).emit('user_typing', {
      isTyping: data.isTyping,
      userName: data.userName,
    });
  }

  private async handleStartTrip(
    socket: Socket,
    data: { busId: string; driverId: string }
  ) {
    try {
      const user = this.connectedUsers.get(socket.id);

      if (!user || user.role !== 'driver') {
        logger.warn('Unauthorized trip start attempt');
        return;
      }

      // Start trip in database
      const tripId = await locationService.startTrip(data.busId, data.driverId);

      // Notify all students
      await notificationService.sendTripStarted(data.busId);

      // Broadcast trip started event
      this.io.to(`bus_${data.busId}`).emit('trip_started', {
        tripId,
        busId: data.busId,
        startTime: new Date(),
      });

      logger.info(`Trip started for bus ${data.busId}`);
    } catch (error) {
      logger.error('Error starting trip:', error);
    }
  }

  private async handleEndTrip(
    socket: Socket,
    data: { tripId: string; busId: string }
  ) {
    try {
      const user = this.connectedUsers.get(socket.id);

      if (!user || user.role !== 'driver') {
        logger.warn('Unauthorized trip end attempt');
        return;
      }

      // End trip in database
      await locationService.endTrip(data.tripId);

      // Notify all students
      await notificationService.sendTripEnded(data.busId);

      // Broadcast trip ended event
      this.io.to(`bus_${data.busId}`).emit('trip_ended', {
        tripId: data.tripId,
        busId: data.busId,
        endTime: new Date(),
      });

      // Remove driver socket tracking
      this.driverSockets.delete(data.busId);

      logger.info(`Trip ended for bus ${data.busId}`);
    } catch (error) {
      logger.error('Error ending trip:', error);
    }
  }

  private handleDisconnect(socket: Socket) {
    const user = this.connectedUsers.get(socket.id);

    if (user) {
      logger.info(`User ${user.userId} disconnected from bus ${user.busId}`);

      if (user.role === 'driver' && user.busId) {
        this.driverSockets.delete(user.busId);
      }

      this.connectedUsers.delete(socket.id);
    }
  }

  private async sendCurrentLocation(socket: Socket, busId: string) {
    try {
      const location = await locationService.getBusLocation(busId);
      if (location) {
        socket.emit('bus_location', location);
      }
    } catch (error) {
      logger.error('Error sending current location:', error);
    }
  }

  public getIO(): SocketIOServer {
    return this.io;
  }
}

export default SocketHandler;
