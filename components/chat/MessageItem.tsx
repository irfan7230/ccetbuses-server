import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Avatar } from 'react-native-paper';
import { Message } from '../../types';
import { MessageContent } from './MessageContent';

interface MessageItemProps {
  item: Message;
  isMyMessage: boolean;
  onVoicePress: (messageId: string) => void;
}

export const MessageItem = ({ item, isMyMessage, onVoicePress }: MessageItemProps) => {
  return (
    <View style={[styles.messageRow, { justifyContent: isMyMessage ? 'flex-end' : 'flex-start' }]}>
      {!isMyMessage && <Avatar.Image size={32} source={require('../../assets/images/avatar.png')} style={styles.avatar} />}
      <View style={{ maxWidth: '80%' }}>
        {!isMyMessage && <Text style={styles.senderName}>{item.sender.name}</Text>}
        <View style={[styles.messageBubble, isMyMessage ? styles.myMessage : styles.theirMessage]}>
          <MessageContent item={item} onVoicePress={onVoicePress} />
        </View>
        <Text style={[styles.messageTime, { textAlign: isMyMessage ? 'right' : 'left' }]}>
          {item.time}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  messageRow: { 
    flexDirection: 'row', 
    marginVertical: 10, 
    alignItems: 'flex-end' 
  },
  avatar: { 
    marginRight: 8 
  },
  senderName: { 
    fontFamily: 'Inter_700Bold', 
    color: '#4A90E2', 
    fontSize: 12, 
    marginLeft: 16, 
    marginBottom: 4 
  },
  messageBubble: { 
    paddingVertical: 10, 
    paddingHorizontal: 15, 
    borderRadius: 20 
  },
  myMessage: { 
    backgroundColor: '#007AFF' 
  },
  theirMessage: { 
    backgroundColor: '#3A3A3C' 
  },
  messageTime: { 
    fontFamily: 'Inter_400Regular', 
    color: 'rgba(255, 255, 255, 0.5)', 
    fontSize: 12, 
    marginHorizontal: 4, 
    marginTop: 4 
  },
});