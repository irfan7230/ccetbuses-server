import { io, Socket } from 'socket.io-client';
import { getAuth } from 'firebase/auth';

const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL || 'http://localhost:3000';

interface LocationUpdate {
  busId: string;
  driverId: string;
  latitude: number;
  longitude: number;
  timestamp: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
  isActive: boolean;
}

interface ChatMessage {
  id: string;
  busId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  type: 'text' | 'image' | 'voice';
  content: string;
  imageUrl?: string;
  voiceUrl?: string;
  voiceDuration?: number;
  timestamp: number;
}

class SocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Function[]> = new Map();

  async connect(userId: string, role: 'student' | 'driver', busId: string): Promise<void> {
    if (this.socket?.connected) {
      console.log('Socket already connected');
      return;
    }

    try {
      const auth = getAuth();
      const user = auth.currentUser;
      const token = user ? await user.getIdToken() : null;

      this.socket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        auth: {
          token,
        },
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      this.socket.on('connect', () => {
        console.log('Socket connected:', this.socket?.id);
        this.socket?.emit('join', { userId, role, busId });
      });

      this.socket.on('disconnect', () => {
        console.log('Socket disconnected');
      });

      this.socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
      });

      // Set up listeners for emitted events
      this.setupInternalListeners();
    } catch (error) {
      console.error('Failed to connect socket:', error);
      throw error;
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.listeners.clear();
    }
  }

  private setupInternalListeners(): void {
    if (!this.socket) return;

    // Bus location updates
    this.socket.on('bus_location', (data: LocationUpdate) => {
      this.emit('bus_location', data);
    });

    // Chat messages
    this.socket.on('chat_message', (data: ChatMessage) => {
      this.emit('chat_message', data);
    });

    // Typing indicator
    this.socket.on('user_typing', (data: { isTyping: boolean; userName: string }) => {
      this.emit('user_typing', data);
    });

    // Trip events
    this.socket.on('trip_started', (data: any) => {
      this.emit('trip_started', data);
    });

    this.socket.on('trip_ended', (data: any) => {
      this.emit('trip_ended', data);
    });
  }

  // Event emitter pattern for components to listen
  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)?.push(callback);
  }

  off(event: string, callback: Function): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      const index = eventListeners.indexOf(callback);
      if (index > -1) {
        eventListeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach((callback) => callback(data));
    }
  }

  // Driver: Send location update
  sendLocationUpdate(location: LocationUpdate): void {
    if (this.socket?.connected) {
      this.socket.emit('location_update', location);
    } else {
      console.warn('Socket not connected');
    }
  }

  // Send chat message
  sendChatMessage(message: Omit<ChatMessage, 'senderId'>): void {
    if (this.socket?.connected) {
      this.socket.emit('chat_message', message);
    } else {
      console.warn('Socket not connected');
    }
  }

  // Send typing indicator
  sendTypingIndicator(busId: string, isTyping: boolean, userName: string): void {
    if (this.socket?.connected) {
      this.socket.emit('typing', { busId, isTyping, userName });
    }
  }

  // Driver: Start trip
  startTrip(busId: string, driverId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('start_trip', { busId, driverId });
    } else {
      console.warn('Socket not connected');
    }
  }

  // Driver: End trip
  endTrip(tripId: string, busId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('end_trip', { tripId, busId });
    } else {
      console.warn('Socket not connected');
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export default new SocketService();
export type { LocationUpdate, ChatMessage };
