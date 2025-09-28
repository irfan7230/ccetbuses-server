import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, FlatList, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { Appbar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store/store';
import { addMessage, toggleVoicePlaying } from '../../store/slices/chatSlice';
import { Message } from '../../types';
import { GroupMembers } from '../../components/chat/GroupMembers';
import { TypingIndicator } from '../../components/chat/TypingIndicator';
import { MessageItem } from '../../components/chat/MessageItem';
import { ChatInput } from '../../components/chat/ChatInput';
import { RecordingControls } from '../../components/chat/RecordingControls';
import { useAudioRecording } from '../../hooks/useAudioRecording';
import * as ImagePicker from 'expo-image-picker';

const MY_USER_ID = 'user_student_123';

export default function ChatScreen() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const messages = useSelector((state: RootState) => state.chat.messages);
  const [newMessage, setNewMessage] = useState('');
  const [showTyping] = useState(true);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const inputRef = useRef<any>(null);

  // Use the custom audio recording hook
  const {
    isRecording,
    recordingTime,
    slideX,
    pulseAnim,
    panResponder,
    startRecording,
    stopRecording,
    CANCEL_THRESHOLD,
  } = useAudioRecording();

  // Keyboard event listeners
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (event) => {
      setKeyboardHeight(event.endCoordinates.height);
    });
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
    });

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, []);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!result.canceled) {
      const newMsg: Message = {
        id: Date.now().toString(),
        type: 'image',
        content: '',
        imageUrl: result.assets[0].uri,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sender: { id: MY_USER_ID, name: 'You' },
      };
      dispatch(addMessage(newMsg));
    }
  };

  const handleVoicePress = (messageId: string) => {
    dispatch(toggleVoicePlaying(messageId));
  };
  
  const handleSend = () => {
    if (newMessage.trim()) {
      const newMsg: Message = {
        id: Date.now().toString(),
        type: 'text',
        content: newMessage.trim(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sender: { id: MY_USER_ID, name: 'You' },
      };
      dispatch(addMessage(newMsg));
      setNewMessage('');
    }
  };

  const handleStopRecording = () => {
    stopRecording(false);
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMyMessage = item.sender.id === MY_USER_ID;
    return (
      <MessageItem
        item={item}
        isMyMessage={isMyMessage}
        onVoicePress={handleVoicePress}
      />
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <Appbar.Header style={styles.appbar}>
        <Appbar.BackAction onPress={() => router.back()} color="#FFFFFF" />
        <Appbar.Content title="Bus A - Group Chat" titleStyle={styles.title} />
        <GroupMembers />
      </Appbar.Header>
      
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messageList}
          inverted
          ListHeaderComponent={showTyping ? <TypingIndicator /> : null}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="none"
        />

        <View style={[styles.inputContainer, isRecording && styles.recordingInputContainer]}>
          {isRecording ? (
            <RecordingControls
              recordingTime={recordingTime}
              slideX={slideX}
              pulseAnim={pulseAnim}
              panHandlers={panResponder.panHandlers}
              onStopRecording={handleStopRecording}
              cancelThreshold={CANCEL_THRESHOLD}
            />
          ) : (
            <ChatInput
              newMessage={newMessage}
              onChangeText={setNewMessage}
              onSend={handleSend}
              onPickImage={pickImage}
              onStartRecording={startRecording}
              isRecording={isRecording}
              inputRef={inputRef}
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
    backgroundColor: '#1C1C1E' 
  },
  appbar: { 
    backgroundColor: 'transparent' 
  },
  title: { 
    fontFamily: 'Inter_700Bold', 
    color: '#FFFFFF' 
  },
  keyboardView: { 
    flex: 1 
  },
  messageList: { 
    paddingHorizontal: 16 
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 16,
    marginBottom: Platform.OS === 'ios' ? 8 : 16,
    marginTop: 8,
    backgroundColor: '#2C2C2E',
    borderRadius: 24,
    minHeight: 48,
    maxHeight: 120,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  recordingInputContainer: {
    backgroundColor: '#1F1F1F',
    borderWidth: 2,
    borderColor: '#FF3B30',
  },
});