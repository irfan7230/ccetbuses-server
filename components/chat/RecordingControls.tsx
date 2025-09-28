import React from 'react';
import { View, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface RecordingControlsProps {
  recordingTime: number;
  slideX: Animated.Value;
  pulseAnim: Animated.Value;
  panHandlers: any;
  onStopRecording: () => void;
  cancelThreshold: number;
}

export const RecordingControls = ({ 
  recordingTime, 
  slideX, 
  pulseAnim, 
  panHandlers, 
  onStopRecording,
  cancelThreshold 
}: RecordingControlsProps) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Animated.View 
      style={[
        styles.recordingContainer, 
        { transform: [{ translateX: slideX }] }
      ]}
      {...panHandlers}
    >
      <View style={styles.recordingIndicator}>
        <Animated.View style={[
          styles.redDot,
          { opacity: pulseAnim }
        ]} />
        <Text style={styles.recordingTime}>{formatTime(recordingTime)}</Text>
      </View>
      
      <Animated.View style={[
        styles.slideToCancel,
        {
          opacity: slideX.interpolate({
            inputRange: [cancelThreshold, -20, 0],
            outputRange: [1, 0.8, 0.5],
            extrapolate: 'clamp',
          })
        }
      ]}>
        <MaterialCommunityIcons 
          name="chevron-left" 
          size={20} 
          color="rgba(255, 255, 255, 0.6)" 
        />
        <Text style={styles.slideToCancelText}>Slide to cancel</Text>
      </Animated.View>
      
      <TouchableOpacity 
        style={styles.stopRecordButton}
        onPress={onStopRecording}
      >
        <MaterialCommunityIcons name="send" size={20} color="#FFFFFF" />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  recordingContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    height: 48,
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 0,
  },
  redDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF3B30',
    marginRight: 8,
  },
  recordingTime: {
    fontFamily: 'Inter_600SemiBold',
    color: '#FFFFFF',
    fontSize: 16,
    minWidth: 50,
  },
  slideToCancel: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    marginHorizontal: 20,
  },
  slideToCancelText: {
    fontFamily: 'Inter_400Regular',
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    marginLeft: 4,
  },
  stopRecordButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
});