import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, TouchableOpacity, View, ActivityIndicator, RefreshControl } from 'react-native';
import { Appbar, List, Divider, Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store/store';
import { markAsRead, clearOldNotifications, setNotifications, setLoading, addNotification } from '../../store/slices/notificationsSlice';
import apiService from '../../services/api';
import socketService from '../../services/socket';

const NotificationIcon = ({ type }: { type: string }) => {
  if (type === 'proximity') {
    return <List.Icon icon="map-marker-radius" />;
  }
  return <List.Icon icon="information" />;
};

export default function NotificationsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const dispatch = useDispatch<AppDispatch>();
  const notifications = useSelector((state: RootState) => state.notifications.items);
  const isLoading = useSelector((state: RootState) => state.notifications.isLoading);
  const [refreshing, setRefreshing] = useState(false);

  // Load notifications from backend
  const loadNotifications = async () => {
    try {
      dispatch(setLoading(true));
      const response: any = await apiService.getNotifications();
      if (response && response.data) {
        dispatch(setNotifications(response.data));
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      dispatch(setLoading(false));
    }
  };

  useEffect(() => {
    loadNotifications();
    dispatch(clearOldNotifications());
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      dispatch(markAsRead(id));
      await apiService.markNotificationAsRead(id);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Appbar.Header mode="small" style={styles.appbar}>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Notifications" titleStyle={styles.title} />
      </Appbar.Header>
      {isLoading && notifications.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          ItemSeparatorComponent={() => <Divider style={styles.divider} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <List.Icon icon="bell-off-outline" color="rgba(255,255,255,0.3)" />
              <Text style={styles.emptyText}>No notifications yet</Text>
            </View>
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={theme.colors.primary}
            />
          }
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => handleMarkAsRead(item.id)}>
              <List.Item
                title={item.title}
                description={item.message}
                left={() => <NotificationIcon type={item.type} />}
                titleStyle={[styles.itemTitle, !item.isRead && { color: theme.colors.primary }]}
                descriptionStyle={styles.itemMessage}
                style={!item.isRead && styles.unreadItem}
              />
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#000' },
  appbar: { backgroundColor: '#1E1E1E' },
  title: { fontFamily: 'Inter_700Bold' },
  divider: { backgroundColor: 'rgba(255, 255, 255, 0.1)' },
  unreadItem: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  itemTitle: { fontFamily: 'Inter_700Bold', color: '#FFFFFF' },
  itemMessage: { fontFamily: 'Inter_400Regular', color: 'rgba(255, 255, 255, 0.7)' },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    fontFamily: 'Inter_400Regular',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    marginTop: 100,
  },
  emptyText: {
    marginTop: 16,
    color: 'rgba(255, 255, 255, 0.5)',
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
  },
});