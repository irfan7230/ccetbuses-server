import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Appbar, List, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

export default function HelpScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <Appbar.Header mode="small" style={styles.appbar}>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Help & Support" titleStyle={styles.title} />
      </Appbar.Header>
      <ScrollView style={styles.container}>
        <List.AccordionGroup>
          <List.Accordion title="How does the tracking work?" id="1">
            <Text style={styles.answer}>The bus driver's phone acts as a GPS transmitter. When they start their trip, their location is broadcast securely to the students registered for that bus.</Text>
          </List.Accordion>
          <List.Accordion title="How do I get notifications?" id="2">
            <Text style={styles.answer}>Notifications are sent automatically when the bus is approximately 2km away from your designated stop. Ensure notifications are enabled in your phone's settings and in the app's settings screen.</Text>
          </List.Accordion>
        </List.AccordionGroup>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#000' },
  appbar: { backgroundColor: '#1E1E1E' },
  title: { fontFamily: 'Inter_700Bold' },
  container: { paddingHorizontal: 16 },
  answer: { padding: 16, fontFamily: 'Inter_400Regular', color: 'rgba(255, 255, 255, 0.7)' },
});