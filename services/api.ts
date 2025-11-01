import { getAuth } from 'firebase/auth';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

class ApiService {
  private async getAuthToken(): Promise<string | null> {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return null;
    
    try {
      return await user.getIdToken();
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = await this.getAuthToken();
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: 'An error occurred',
      }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // User Profile APIs
  async getProfile() {
    return this.request('/users/profile');
  }

  async updateProfile(data: {
    fullName?: string;
    busStop?: string;
    profileImageUri?: string;
  }) {
    return this.request('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async updateFCMToken(fcmToken: string) {
    return this.request('/users/fcm-token', {
      method: 'PUT',
      body: JSON.stringify({ fcmToken }),
    });
  }

  async getBusMembers(busId: string) {
    return this.request(`/users/bus/${busId}/members`);
  }

  // Upload APIs
  async uploadProfileImage(fileUri: string): Promise<{ data: { url: string } }> {
    const token = await this.getAuthToken();
    
    const formData = new FormData();
    const filename = fileUri.split('/').pop() || 'image.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';

    // React Native FormData expects this specific format
    (formData as any).append('image', {
      uri: fileUri,
      name: filename,
      type,
    });

    const response = await fetch(`${API_BASE_URL}/upload/profile-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Upload profile image error:', errorText);
      throw new Error('Failed to upload image');
    }

    return response.json();
  }

  async uploadChatImage(fileUri: string): Promise<{ data: { url: string } }> {
    const token = await this.getAuthToken();
    
    const formData = new FormData();
    const filename = fileUri.split('/').pop() || 'image.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';

    // React Native FormData expects this specific format
    (formData as any).append('image', {
      uri: fileUri,
      name: filename,
      type,
    });

    const response = await fetch(`${API_BASE_URL}/upload/chat-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Upload chat image error:', errorText);
      throw new Error('Failed to upload image');
    }

    return response.json();
  }

  async uploadVoiceMessage(fileUri: string): Promise<{ data: { url: string; duration?: number } }> {
    const token = await this.getAuthToken();
    
    const formData = new FormData();
    const filename = fileUri.split('/').pop() || 'voice.m4a';

    // React Native FormData expects this specific format
    (formData as any).append('audio', {
      uri: fileUri,
      name: filename,
      type: 'audio/m4a',
    });

    const response = await fetch(`${API_BASE_URL}/upload/voice`, {
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Upload voice message error:', errorText);
      throw new Error('Failed to upload voice message');
    }

    return response.json();
  }

  // Notification APIs
  async getNotifications() {
    return this.request('/notifications');
  }

  async markNotificationAsRead(notificationId: string) {
    return this.request(`/notifications/${notificationId}/read`, {
      method: 'PUT',
    });
  }

  // Route Recording APIs
  async checkRouteRecordingStatus(busId: string) {
    return this.request(`/routes/recording-status/${busId}`);
  }

  async saveRecordedRoute(data: {
    busId: string;
    driverId: string;
    startPoint: { latitude: number; longitude: number } | null;
    endPoint?: { latitude: number; longitude: number } | null;
    routePoints: Array<{
      latitude: number;
      longitude: number;
      timestamp: number;
      accuracy: number;
      speed?: number;
    }>;
    busStops: Array<{
      id: string;
      name: string;
      latitude: number;
      longitude: number;
      order: number;
      timestamp: number;
    }>;
    distance: number;
    recordedAt: number;
  }) {
    return this.request('/routes/save-recorded', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getRecordedRoutes(busId: string) {
    return this.request(`/routes/recorded/${busId}`);
  }

  async enableRouteRecording(busId: string) {
    return this.request('/routes/enable-recording', {
      method: 'POST',
      body: JSON.stringify({ busId }),
    });
  }

  async disableRouteRecording(busId: string) {
    return this.request('/routes/disable-recording', {
      method: 'POST',
      body: JSON.stringify({ busId }),
    });
  }
}

export default new ApiService();
