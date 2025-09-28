import React from 'react';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Message } from '../../types'; // Import the central type
import { AudioWaveform } from './AudioWaveform';

export const MessageContent = ({ item, onVoicePress }: { item: Message; onVoicePress: (id: string) => void }) => {
  switch (item.type) {
    case 'voice':
      return (
        <View style={styles.voiceMessageContainer}>
          <TouchableOpacity 
            style={styles.playButton}
            onPress={() => onVoicePress(item.id)}
          >
            <MaterialCommunityIcons 
              name={item.isPlaying ? "pause" : "play"} 
              size={20} 
              color="#FFFFFF" 
            />
          </TouchableOpacity>
          <AudioWaveform />
          <Text style={styles.voiceDuration}>{item.voiceDuration}</Text>
        </View>
      );
    case 'sticker':
      return <Text style={styles.sticker}>👍</Text>;
    case 'image':
      return <Image source={{ uri: item.imageUrl }} style={styles.chatImage} />;
    case 'text':
    default:
      return <Text style={styles.messageText}>{item.content || ''}</Text>;
  }
};

const styles = StyleSheet.create({
  messageText: { fontFamily: 'Inter_400Regular', color: '#FFFFFF', fontSize: 16, lineHeight: 20 },
  voiceMessageContainer: { flexDirection: 'row', alignItems: 'center', minWidth: 200 },
  playButton: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#4A9EFF', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  voiceDuration: { fontFamily: 'Inter_400Regular', color: '#FFFFFF', fontSize: 14, minWidth: 35, textAlign: 'right' },
  sticker: { fontSize: 80 },
  chatImage: { 
    width: 200, 
    height: 200, 
    borderRadius: 12,
  }
});