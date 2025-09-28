import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { TextInput } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface ChatInputProps {
  newMessage: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  onPickImage: () => void;
  onStartRecording: () => void;
  isRecording: boolean;
  inputRef: React.RefObject<any>;
}

export const ChatInput = ({
  newMessage,
  onChangeText,
  onSend,
  onPickImage,
  onStartRecording,
  isRecording,
  inputRef
}: ChatInputProps) => {
  return (
    <>
      <TextInput
        ref={inputRef}
        value={newMessage}
        onChangeText={onChangeText}
        placeholder="Type a message..."
        placeholderTextColor="rgba(255, 255, 255, 0.4)"
        multiline
        style={styles.input}
        mode="outlined"
        outlineStyle={{ borderWidth: 0 }}
        contentStyle={{
          color: '#FFFFFF',
          fontFamily: 'Inter_400Regular',
        }}
        theme={{
          colors: {
            primary: 'transparent',
            outline: 'transparent',
            background: 'transparent',
          },
        }}
        blurOnSubmit={false}
        returnKeyType="default"
      />
      
      {newMessage.trim().length > 0 ? (
        <TouchableOpacity style={styles.sendButton} onPress={onSend}>
          <MaterialCommunityIcons name="send" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      ) : (
        <>
          <TouchableOpacity style={styles.emojiButton} onPress={onPickImage}>
            <MaterialCommunityIcons 
              name="paperclip" 
              size={22} 
              color="rgba(255, 255, 255, 0.6)" 
            />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.attachButton}
            onLongPress={onStartRecording}
            delayLongPress={200}
          >
            <MaterialCommunityIcons 
              name="microphone" 
              size={22} 
              color="#FFFFFF" 
            />
          </TouchableOpacity>
        </>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  input: {
    flex: 1,
    backgroundColor: 'transparent',
    marginHorizontal: 12,
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 20,
    maxHeight: 80,
    minHeight: 32,
    paddingVertical: 8,
    fontFamily: 'Inter_400Regular',
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
    shadowColor: '#007AFF',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  emojiButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  attachButton: {
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