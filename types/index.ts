export interface Message {
  id: string;
  type: 'text' | 'voice' | 'sticker' | 'image';
  content: string;
  imageUrl?: string;
  voiceUrl?: string;
  time: string;
  voiceDuration?: string;
  isPlaying?: boolean;
  sender: {
    id: string;
    name: string;
    avatar?: any;
  };
}