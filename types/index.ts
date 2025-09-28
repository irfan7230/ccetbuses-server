export interface Message {
  id: string;
  type: 'text' | 'voice' | 'sticker' | 'image';
  content: string;
  imageUrl?: string;
  time: string;
  voiceDuration?: string;
  isPlaying?: boolean;
  // Add these properties
  sender: {
    id: string;
    name: string;
    avatar?: any;
  };
}