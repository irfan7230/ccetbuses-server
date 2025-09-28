import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface User {
  fullName: string;
  email: string;
  bus: string;
  profileImageUri?: string;
  busStop?: string;
  isProfileComplete: boolean;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
}

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    login: (state, action: PayloadAction<User>) => {
      state.isAuthenticated = true;
      state.user = action.payload;
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
    },
    // Add this new reducer
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        state.user.isProfileComplete = true;
      }
    },
  },
});

// Export the new action
export const { login, logout, updateUser } = authSlice.actions;
export default authSlice.reducer;