import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';

export const Logo = () => (
  <Animatable.View 
    animation="fadeInDown" 
    duration={1500} 
    style={styles.headerSection}
  >
    <View style={styles.logoWrapper}>
      <LinearGradient
        colors={['#007AFF', '#00C6FF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.logoGradient}
      >
        <Text style={styles.logoText}>S</Text>
      </LinearGradient>
    </View>
    <Text style={styles.title}>Sundhara Travels</Text>
    <Text style={styles.subtitle}>Your journey begins here</Text>
  </Animatable.View>
);

const styles = StyleSheet.create({
  headerSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoWrapper: {
    width: 100,
    height: 100,
    marginBottom: 24,
    shadowColor: '#007AFF',
    shadowRadius: 25,
    shadowOpacity: 0.5,
    shadowOffset: { height: 5, width: 0 },
    elevation: 15,
  },
  logoGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 48,
    color: '#FFFFFF',
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 28,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginTop: 8,
  },
});