import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Appbar, List, Switch } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

export default function SettingsScreen() {
  const router = useRouter();
  const [isNotificationsOn, setIsNotificationsOn] = useState(true);

  return (
    <SafeAreaView style={styles.safeArea}>
      <Appbar.Header mode="small" style={styles.appbar}>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Settings" titleStyle={styles.title} />
      </Appbar.Header>
      <View style={styles.container}>
        <List.Item
          title="Enable Notifications"
          description="Receive alerts when the bus is near"
          right={() => <Switch value={isNotificationsOn} onValueChange={setIsNotificationsOn} />}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#000' },
  appbar: { backgroundColor: '#1E1E1E' },
  title: { fontFamily: 'Inter_700Bold' },
  container: { flex: 1, paddingVertical: 20 },
});