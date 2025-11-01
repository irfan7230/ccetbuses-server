import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface BusLocation {
  latitude: number;
  longitude: number;
  timestamp: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
}

interface LocationState {
  currentLocation: BusLocation | null;
  isTracking: boolean;
  lastUpdate: number | null;
  tripId: string | null;
  isTripActive: boolean;
}

const initialState: LocationState = {
  currentLocation: null,
  isTracking: false,
  lastUpdate: null,
  tripId: null,
  isTripActive: false,
};

const locationSlice = createSlice({
  name: 'location',
  initialState,
  reducers: {
    updateLocation: (state, action: PayloadAction<BusLocation>) => {
      state.currentLocation = action.payload;
      state.lastUpdate = Date.now();
    },
    startTracking: (state) => {
      state.isTracking = true;
    },
    stopTracking: (state) => {
      state.isTracking = false;
    },
    setTripId: (state, action: PayloadAction<string>) => {
      state.tripId = action.payload;
      state.isTripActive = true;
    },
    clearTripId: (state) => {
      state.tripId = null;
      state.isTripActive = false;
    },
    resetLocation: (state) => {
      state.currentLocation = null;
      state.lastUpdate = null;
      state.isTracking = false;
      state.tripId = null;
      state.isTripActive = false;
    },
  },
});

export const {
  updateLocation,
  startTracking,
  stopTracking,
  setTripId,
  clearTripId,
  resetLocation,
} = locationSlice.actions;

export default locationSlice.reducer;
