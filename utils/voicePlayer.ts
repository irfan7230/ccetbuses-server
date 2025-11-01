import { Audio } from 'expo-av';

let currentSound: Audio.Sound | null = null;

/**
 * Play voice message
 */
export async function playVoiceMessage(uri: string, onPlaybackStatusUpdate?: (status: any) => void): Promise<void> {
  try {
    // Stop current sound if playing
    if (currentSound) {
      await currentSound.stopAsync();
      await currentSound.unloadAsync();
      currentSound = null;
    }

    // Set audio mode
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
      staysActiveInBackground: false,
    });

    // Create and play sound
    const { sound } = await Audio.Sound.createAsync(
      { uri },
      { shouldPlay: true },
      onPlaybackStatusUpdate
    );

    currentSound = sound;

    // Unload when finished
    sound.setOnPlaybackStatusUpdate((status: any) => {
      if (status.didJustFinish) {
        sound.unloadAsync();
        currentSound = null;
      }
      if (onPlaybackStatusUpdate) {
        onPlaybackStatusUpdate(status);
      }
    });
  } catch (error) {
    console.error('Error playing voice message:', error);
    throw error;
  }
}

/**
 * Stop currently playing voice
 */
export async function stopVoiceMessage(): Promise<void> {
  if (currentSound) {
    try {
      await currentSound.stopAsync();
      await currentSound.unloadAsync();
      currentSound = null;
    } catch (error) {
      console.error('Error stopping voice message:', error);
    }
  }
}

/**
 * Pause currently playing voice
 */
export async function pauseVoiceMessage(): Promise<void> {
  if (currentSound) {
    try {
      await currentSound.pauseAsync();
    } catch (error) {
      console.error('Error pausing voice message:', error);
    }
  }
}

/**
 * Resume paused voice
 */
export async function resumeVoiceMessage(): Promise<void> {
  if (currentSound) {
    try {
      await currentSound.playAsync();
    } catch (error) {
      console.error('Error resuming voice message:', error);
    }
  }
}

/**
 * Get current playback status
 */
export async function getPlaybackStatus(): Promise<any> {
  if (currentSound) {
    return await currentSound.getStatusAsync();
  }
  return null;
}
