import React from 'react';
import { View, StyleSheet } from 'react-native';

export const AudioWaveform = () => {
  const waveformBars = [0.3, 0.7, 0.4, 0.8, 0.5, 0.9, 0.6, 0.4, 0.7, 0.3, 0.8, 0.5, 0.6, 0.9, 0.4, 0.7];

  return (
    <View style={styles.waveformContainer}>
      {waveformBars.map((height, index) => (
        <View
          key={index}
          style={[
            styles.waveformBar,
            {
              height: 20 * height,
              // Example of dynamic coloring for "played" part of the audio
              backgroundColor: index < 6 ? '#4A9EFF' : 'rgba(255, 255, 255, 0.3)',
            }
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 24,
    flex: 1,
    marginRight: 12,
  },
  waveformBar: {
    width: 3,
    borderRadius: 1.5,
    marginHorizontal: 1,
  },
});