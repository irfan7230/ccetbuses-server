import React, { useEffect } from 'react';
import { FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { Appbar, List, Divider, Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store/store';
import { markAsRead, clearOldNotifications } from '../../store/slices/notificationsSlice';

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

  useEffect(() => {
    // Simulate the automatic cleanup when the screen is opened
    dispatch(clearOldNotifications());
  }, []);

  const handleMarkAsRead = (id: string) => {
    dispatch(markAsRead(id));
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Appbar.Header mode="small" style={styles.appbar}>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Notifications" titleStyle={styles.title} />
      </Appbar.Header>
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        ItemSeparatorComponent={() => <Divider style={styles.divider} />}
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
});