import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Notification {
  id: string;
  type: 'proximity' | 'broadcast';
  title: string;
  message: string;
  date: string; // ISO date string for accurate time-based filtering
  isRead: boolean;
}

interface NotificationsState {
  items: Notification[];
}

// Get today's date and subtract 3 days for the cleanup rule
const threeDaysAgo = new Date();
threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

// Initial mock data with read/unread status
const initialState: NotificationsState = {
  items: [
    { id: '1', type: 'proximity', title: 'Your bus is approaching!', message: 'Bus A is approximately 2km away from your stop.', date: new Date().toISOString(), isRead: false },
    { id: '2', type: 'broadcast', title: 'Service Update', message: 'Bus A will be running 15 minutes late today due to traffic.', date: new Date().toISOString(), isRead: false },
    { id: '3', type: 'proximity', title: 'Your bus is approaching!', message: 'Bus A is approximately 2km away from your stop.', date: new Date(Date.now() - 86400000).toISOString(), isRead: true }, // Yesterday
  ],
};

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    markAsRead: (state, action: PayloadAction<string>) => {
      const notification = state.items.find(item => item.id === action.payload);
      if (notification) {
        notification.isRead = true;
      }
    },
    clearOldNotifications: (state) => {
      state.items = state.items.filter(item => new Date(item.date) > threeDaysAgo);
    },
  },
});

export const { markAsRead, clearOldNotifications } = notificationsSlice.actions;
export default notificationsSlice.reducer;