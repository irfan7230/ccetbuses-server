import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Appbar, Text, Paragraph } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

export default function PrivacyScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <Appbar.Header mode="small" style={styles.appbar}>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Privacy Policy" titleStyle={styles.title} />
      </Appbar.Header>
      <ScrollView contentContainerStyle={styles.container}>
        <Paragraph style={styles.paragraph}>Last updated: September 26, 2025</Paragraph>
        <Paragraph style={styles.paragraph}>
          Sundhara Travels ("us", "we", or "our") operates the Sundhara Travels mobile application (the "Service"). This page informs you of our policies regarding the collection, use, and disclosure of personal data when you use our Service and the choices you have associated with that data.
        </Paragraph>
        <Text variant="titleMedium" style={styles.heading}>Information Collection and Use</Text>
        <Paragraph style={styles.paragraph}>
          We collect several different types of information for various purposes to provide and improve our Service to you. While using our Service, we may ask you to provide us with certain personally identifiable information, including but not limited to your name and email address.
        </Paragraph>
        <Text variant="titleMedium" style={styles.heading}>Location Data</Text>
        <Paragraph style={styles.paragraph}>
          The core functionality of this app is to provide real-time location tracking of your designated bus. This requires the collection of location data from the driver's device during an active trip. Student users' location data is not collected or stored.
        </Paragraph>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#000' },
  appbar: { backgroundColor: '#1E1E1E' },
  title: { fontFamily: 'Inter_700Bold' },
  container: { padding: 24 },
  heading: { fontFamily: 'Inter_700Bold', color: '#FFFFFF', marginTop: 16, marginBottom: 8 },
  paragraph: { fontFamily: 'Inter_400Regular', color: 'rgba(255, 255, 255, 0.7)', marginBottom: 12 },
});