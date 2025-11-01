import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

interface TypingIndicatorProps {
  typingUser?: string;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ typingUser = 'Someone' }) => {
  return (
    <View style={styles.typingContainer}>
      <Text style={styles.typingText}>{typingUser} is typing</Text>
      <View style={styles.typingDots}>
        <View style={[styles.dot, styles.dot1]} />
        <View style={[styles.dot, styles.dot2]} />
        <View style={[styles.dot, styles.dot3]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  typingContainer: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16 },
  typingText: { fontFamily: 'Inter_400Regular', color: 'rgba(255, 255, 255, 0.6)', fontSize: 14, marginRight: 8 },
  typingDots: { flexDirection: 'row' },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: 'rgba(255, 255, 255, 0.6)', marginHorizontal: 1 },
  dot1: { opacity: 0.4 },
  dot2: { opacity: 0.7 },
  dot3: { opacity: 1 },
});