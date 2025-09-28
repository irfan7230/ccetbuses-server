import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Message } from '../../types';

interface ChatState {
  messages: Message[];
}

// We'll use the same mock data as the initial state
const initialMessages: Message[] = [
  { id: '4', type: 'sticker', content: 'thumbs_up_sticker', time: '13:09', sender: { id: 'user_student_123', name: 'You' } },
  { id: '3', type: 'text', content: 'ok! c u later. =D', time: '13:08', sender: { id: 'driver_01', name: 'Driver' } },
  { id: '2', type: 'text', content: 'No, meet @ my house at 5:45. Then we can take the bus 2 the cinema.', time: '13:06', sender: { id: 'user_student_123', name: 'You' } },
  { id: '1', type: 'voice', content: 'voice_note_1', time: '12:45', voiceDuration: '02:43', isPlaying: false, sender: { id: 'driver_01', name: 'Driver' } },
];

const initialState: ChatState = {
  messages: initialMessages,
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    addMessage: (state, action: PayloadAction<Message>) => {
      // Add the new message to the beginning of the array (for inverted list)
      state.messages.unshift(action.payload);
    },
    toggleVoicePlaying: (state, action: PayloadAction<string>) => {
        state.messages = state.messages.map(msg => 
            msg.id === action.payload 
              ? { ...msg, isPlaying: !msg.isPlaying }
              : { ...msg, isPlaying: false }
        );
    }
  },
});

export const { addMessage, toggleVoicePlaying } = chatSlice.actions;
export default chatSlice.reducer;