import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Message } from '../../types';

interface ChatState {
  messages: Message[];
  isLoading: boolean;
}

const initialState: ChatState = {
  messages: [],
  isLoading: false,
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    addMessage: (state, action: PayloadAction<Message>) => {
      // Check if message already exists to prevent duplicates
      const messageExists = state.messages.some(msg => msg.id === action.payload.id);
      if (!messageExists) {
        // Add the new message to the beginning of the array (for inverted list)
        state.messages.unshift(action.payload);
      }
    },
    setMessages: (state, action: PayloadAction<Message[]>) => {
      state.messages = action.payload;
    },
    toggleVoicePlaying: (state, action: PayloadAction<string>) => {
      state.messages = state.messages.map(msg => 
        msg.id === action.payload 
          ? { ...msg, isPlaying: !msg.isPlaying }
          : { ...msg, isPlaying: false }
      );
    },
    clearMessages: (state) => {
      state.messages = [];
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
});

export const { addMessage, setMessages, toggleVoicePlaying, clearMessages, setLoading } = chatSlice.actions;
export default chatSlice.reducer;