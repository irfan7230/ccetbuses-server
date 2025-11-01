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
  isLoading: boolean;
}

const initialState: NotificationsState = {
  items: [],
  isLoading: false,
};

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addNotification: (state, action: PayloadAction<Notification>) => {
      state.items.unshift(action.payload);
    },
    setNotifications: (state, action: PayloadAction<Notification[]>) => {
      state.items = action.payload;
    },
    markAsRead: (state, action: PayloadAction<string>) => {
      const notification = state.items.find(item => item.id === action.payload);
      if (notification) {
        notification.isRead = true;
      }
    },
    clearOldNotifications: (state) => {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      state.items = state.items.filter(item => new Date(item.date) > threeDaysAgo);
    },
    clearAllNotifications: (state) => {
      state.items = [];
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
});

export const { addNotification, setNotifications, markAsRead, clearOldNotifications, clearAllNotifications, setLoading } = notificationsSlice.actions;
export default notificationsSlice.reducer;