import { useState, useRef, useEffect } from 'react';
import { Alert, Animated, PanResponder } from 'react-native';
import { Audio } from 'expo-av';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../store/store';
import { addMessage } from '../store/slices/chatSlice';
import { Message } from '../types';

const MY_USER_ID = 'user_student_123';
const CANCEL_THRESHOLD = -100;

export const useAudioRecording = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [slideX] = useState(new Animated.Value(0));
  const [showSlideToCancel, setShowSlideToCancel] = useState(false);
  
  const recordingTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordingStartTime = useRef<number>(0);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulsing animation for red dot
  useEffect(() => {
    if (isRecording) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.3,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecordingTimer = () => {
    recordingStartTime.current = Date.now();
    recordingTimer.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - recordingStartTime.current) / 1000);
      setRecordingTime(elapsed);
    }, 1000);
  };

  const stopRecordingTimer = () => {
    if (recordingTimer.current) {
      clearInterval(recordingTimer.current);
      recordingTimer.current = null;
    }
    setRecordingTime(0);
  };

  const startRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Sorry, we need microphone permissions to record audio.');
        return;
      }

      await Audio.setAudioModeAsync({ 
        allowsRecordingIOS: true, 
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
      
      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      setRecording(recording);
      setIsRecording(true);
      setShowSlideToCancel(true);
      startRecordingTimer();
      
      // Reset slide animation
      slideX.setValue(0);
      
      console.log('Recording started...');
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  };

  const stopRecording = async (cancelled = false) => {
    if (!recording) return;

    console.log(cancelled ? 'Recording cancelled' : 'Stopping recording..');
    setIsRecording(false);
    setShowSlideToCancel(false);
    stopRecordingTimer();
    
    await recording.stopAndUnloadAsync();
    
    if (!cancelled) {
      const uri = recording.getURI();
      console.log('Recording stopped and stored at', uri);

      // Create a new voice message
      const duration = Math.floor((Date.now() - recordingStartTime.current) / 1000);
      const newMsg: Message = {
        id: Date.now().toString(), 
        type: 'voice', 
        content: uri || '', 
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sender: { id: MY_USER_ID, name: 'You' },
        voiceDuration: formatTime(duration),
      };
      dispatch(addMessage(newMsg));
    }
    
    setRecording(null);
    
    // Reset slide animation
    Animated.spring(slideX, {
      toValue: 0,
      useNativeDriver: true,
    }).start();
  };

  // Pan responder for slide to cancel
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => isRecording,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return isRecording && Math.abs(gestureState.dx) > 5;
      },
      onPanResponderGrant: () => {
        // User started touching, prevent any default behavior
      },
      onPanResponderMove: (evt, gestureState) => {
        if (isRecording) {
          // Only allow leftward movement (negative dx)
          const newX = Math.min(0, gestureState.dx);
          slideX.setValue(newX);
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (isRecording) {
          if (gestureState.dx < CANCEL_THRESHOLD) {
            // Cancel recording
            stopRecording(true);
          } else {
            // Snap back to original position
            Animated.spring(slideX, {
              toValue: 0,
              tension: 100,
              friction: 8,
              useNativeDriver: true,
            }).start();
          }
        }
      },
      onPanResponderTerminate: () => {
        if (isRecording) {
          // Snap back if gesture is interrupted
          Animated.spring(slideX, {
            toValue: 0,
            tension: 100,
            friction: 8,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  return {
    recording,
    isRecording,
    recordingTime,
    slideX,
    showSlideToCancel,
    pulseAnim,
    panResponder,
    startRecording,
    stopRecording,
    CANCEL_THRESHOLD,
  };
};