import { Request } from 'express';

// User Types
export interface User {
  uid: string;
  email: string;
  fullName: string;
  role: 'student' | 'driver' | 'admin';
  bus?: string; // Optional for admin
  busStop?: string;
  profileImageUri?: string;
  isProfileComplete: boolean;
  isApproved: boolean; // For students waiting approval
  fcmToken?: string;
  phone?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Location Types
export interface Location {
  latitude: number;
  longitude: number;
  timestamp: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
}

export interface BusLocation extends Location {
  busId: string;
  driverId: string;
  isActive: boolean;
}

// Chat Types
export interface ChatMessage {
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
  isDeleted: boolean;
}

// Notification Types
export interface Notification {
  id: string;
  userId: string;
  type: 'proximity' | 'trip_started' | 'trip_ended' | 'announcement';
  title: string;
  message: string;
  data?: any;
  isRead: boolean;
  createdAt: Date;
}

// Trip Types
export interface Trip {
  id: string;
  busId: string;
  driverId: string;
  startTime: Date;
  endTime?: Date;
  status: 'active' | 'completed' | 'cancelled';
  route: Location[];
  estimatedArrival?: Date;
}

// Bus Stop Types
export interface BusStop {
  id: string;
  name: string;
  location: Location;
  busId: string;
  order: number;
}

// Bus Types
export interface Bus {
  id: string;
  name: string;
  number: string;
  routeId: string;
  driverId?: string;
  driverName?: string;
  capacity: number;
  currentStudents: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Route Types
export interface Route {
  id: string;
  name: string;
  description: string;
  stops: BusStop[];
  distance: number; // in kilometers
  estimatedDuration: number; // in minutes
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Student Approval Request Types
export interface ApprovalRequest {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  busId: string;
  busName: string;
  requestedAt: Date;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewedByName?: string;
  reviewedAt?: Date;
  rejectionReason?: string;
}

// Extended Request Types
export interface AuthRequest extends Request {
  user?: {
    uid: string;
    email: string;
    role: 'student' | 'driver' | 'admin';
  };
}

// Socket Types
export interface SocketUser {
  socketId: string;
  userId: string;
  role: 'student' | 'driver' | 'admin';
  busId?: string; // Optional for admin
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

// Upload Types
export interface UploadResult {
  url: string;
  publicId: string;
  format: string;
  resourceType: string;
}
