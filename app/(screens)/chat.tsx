import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, FlatList, KeyboardAvoidingView, Platform, Keyboard, Alert, ActivityIndicator } from 'react-native';
import { Appbar, Menu, IconButton } from 'react-native-paper';
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
import socketService from '../../services/socket';
import apiService from '../../services/api';
import { playVoiceMessage, stopVoiceMessage } from '../../utils/voicePlayer';

export default function ChatScreen() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((state: RootState) => state.auth.user);
  const messages = useSelector((state: RootState) => state.chat.messages);
  const [newMessage, setNewMessage] = useState('');
  const [showTyping, setShowTyping] = useState(false);
  const [typingUser, setTypingUser] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);

  const inputRef = useRef<any>(null);
  const MY_USER_ID = user?.email || 'unknown';

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

  // Socket.io - Listen for incoming messages
  useEffect(() => {
    if (!user?.bus) return;

    // Define callback functions so they can be removed later
    const handleChatMessage = (message: any) => {
      // Skip messages sent by current user (already added locally)
      const senderId = message.senderId || message.sender?.id;
      if (senderId === MY_USER_ID) {
        return;
      }

      const newMsg: Message = {
        id: message.id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: message.type,
        content: message.content,
        imageUrl: message.imageUrl,
        voiceUrl: message.voiceUrl,
        voiceDuration: message.voiceDuration,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sender: {
          id: senderId || 'unknown',
          name: message.senderName || message.sender?.name || 'Unknown',
          avatar: message.senderAvatar || message.sender?.avatar,
        },
      };
      dispatch(addMessage(newMsg));
    };

    const handleUserTyping = (data: { isTyping: boolean; userName: string }) => {
      // Skip typing indicator if it's from current user
      if (data.userName === user?.fullName) {
        return;
      }
      setShowTyping(data.isTyping);
      setTypingUser(data.userName);
    };

    // Listen for chat messages
    socketService.on('chat_message', handleChatMessage);

    // Listen for typing indicator
    socketService.on('user_typing', handleUserTyping);

    return () => {
      // Cleanup listeners when component unmounts to prevent duplicates
      socketService.off('chat_message', handleChatMessage);
      socketService.off('user_typing', handleUserTyping);
    };
  }, [user?.bus, user?.fullName, MY_USER_ID, dispatch]);

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

  // Send typing indicator
  const handleTextChange = (text: string) => {
    setNewMessage(text);
    if (user?.bus && user?.fullName) {
      socketService.sendTypingIndicator(user.bus, text.length > 0, user.fullName);
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: true,
      });

      if (!result.canceled) {
        setUploading(true);
        
        // Upload image to backend (Cloudinary)
        const uploadResult = await apiService.uploadChatImage(result.assets[0].uri);
        
        if (uploadResult.data.url) {
          const newMsg: Message = {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: 'image',
            content: '',
            imageUrl: uploadResult.data.url,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            sender: { id: MY_USER_ID, name: user?.fullName || 'You' },
          };
          
          // Add to local state
          dispatch(addMessage(newMsg));
          
          // Send via Socket.io
          if (user?.bus) {
            socketService.sendChatMessage({
              id: newMsg.id,
              busId: user.bus,
              senderName: user.fullName || 'Student',
              senderAvatar: user.profileImageUri,
              type: 'image',
              content: '',
              imageUrl: uploadResult.data.url,
              timestamp: Date.now(),
            });
          }
        }
        
        setUploading(false);
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', 'Failed to upload image. Please try again.');
      setUploading(false);
    }
  };

  const handleVoicePress = async (messageId: string) => {
    const message = messages.find(m => m.id === messageId);
    if (!message || message.type !== 'voice') return;
    
    try {
      if (message.isPlaying) {
        // Stop playing
        await stopVoiceMessage();
        dispatch(toggleVoicePlaying(messageId));
      } else {
        // Start playing
        dispatch(toggleVoicePlaying(messageId));
        if (message.voiceUrl) {
          await playVoiceMessage(message.voiceUrl, (status: any) => {
            if (status.didJustFinish) {
              dispatch(toggleVoicePlaying(messageId));
            }
          });
        }
      }
    } catch (error) {
      console.error('Error playing voice:', error);
      dispatch(toggleVoicePlaying(messageId));
    }
  };
  
  const handleSend = () => {
    if (newMessage.trim() && user) {
      const newMsg: Message = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'text',
        content: newMessage.trim(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sender: { id: MY_USER_ID, name: user.fullName || 'You' },
      };
      
      // Add to local state
      dispatch(addMessage(newMsg));
      
      // Send via Socket.io
      if (user.bus) {
        socketService.sendChatMessage({
          id: newMsg.id,
          busId: user.bus,
          senderName: user.fullName || 'Student',
          senderAvatar: user.profileImageUri,
          type: 'text',
          content: newMsg.content,
          timestamp: Date.now(),
        });
      }
      
      setNewMessage('');
      
      // Stop typing indicator
      if (user.bus && user.fullName) {
        socketService.sendTypingIndicator(user.bus, false, user.fullName);
      }
    }
  };

  const handleStopRecording = async () => {
    const audioUri = await stopRecording(false);
    
    if (audioUri && user) {
      try {
        setUploading(true);
        
        // Upload voice message to backend (Cloudinary)
        const uploadResult = await apiService.uploadVoiceMessage(audioUri);
        
        if (uploadResult.data.url) {
          const newMsg: Message = {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: 'voice',
            content: '',
            voiceUrl: uploadResult.data.url,
            voiceDuration: uploadResult.data.duration?.toString() || '00:00',
            isPlaying: false,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            sender: { id: MY_USER_ID, name: user.fullName || 'You' },
          };
          
          // Add to local state
          dispatch(addMessage(newMsg));
          
          // Send via Socket.io
          if (user.bus) {
            socketService.sendChatMessage({
              id: newMsg.id,
              busId: user.bus,
              senderName: user.fullName || 'Student',
              senderAvatar: user.profileImageUri,
              type: 'voice',
              content: '',
              voiceUrl: uploadResult.data.url,
              voiceDuration: uploadResult.data.duration,
              timestamp: Date.now(),
            });
          }
        }
        
        setUploading(false);
      } catch (error) {
        console.error('Error uploading voice message:', error);
        Alert.alert('Error', 'Failed to upload voice message. Please try again.');
        setUploading(false);
      }
    }
  };

  const handleExitChat = () => {
    Alert.alert(
      'Exit Chat',
      'Are you sure you want to exit the group chat?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Exit',
          onPress: () => {
            router.back();
          },
        },
      ]
    );
  };

  const renderMessage = ({ item }: { item: Message }) => {
    if (!item || !item.sender) {
      return null; // Skip rendering if message or sender is invalid
    }
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
        {user?.role === 'driver' && (
          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={
              <IconButton
                icon="dots-vertical"
                iconColor="#FFFFFF"
                size={24}
                onPress={() => setMenuVisible(true)}
              />
            }
          >
            <Menu.Item
              onPress={() => {
                setMenuVisible(false);
                handleExitChat();
              }}
              title="Exit Chat"
              leadingIcon="exit-to-app"
            />
          </Menu>
        )}
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
          ListHeaderComponent={showTyping ? <TypingIndicator typingUser={typingUser} /> : null}
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
            <>
            {uploading && (
              <View style={styles.uploadingContainer}>
                <ActivityIndicator size="small" color="#007AFF" />
              </View>
            )}
            <ChatInput
              newMessage={newMessage}
              onChangeText={handleTextChange}
              onSend={handleSend}
              onPickImage={pickImage}
              onStartRecording={startRecording}
              isRecording={isRecording}
              inputRef={inputRef}
            />
          </>  
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
  uploadingContainer: {
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});