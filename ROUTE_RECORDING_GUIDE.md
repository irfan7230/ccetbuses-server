# Route Recording Feature - Guide

## Overview
The route recording feature allows drivers to dynamically create and update bus routes and bus stops. This is useful when routes change weekly, monthly, or for new semesters.

## Features Implemented

### 1. **Image Upload Fixes**
Fixed image uploading in both profile and chat screens by:
- Adding proper `Content-Type: multipart/form-data` headers
- Correcting FormData structure for React Native
- Adding better error handling and logging

**Files Modified:**
- `services/api.ts` - Fixed `uploadProfileImage`, `uploadChatImage`, and `uploadVoiceMessage` methods

### 2. **Driver Route Recording**
Complete route recording system for drivers with the following capabilities:

#### Client-Side (React Native)
**New Screen:** `app/(screens)/route-recording.tsx`
- Continuous GPS tracking during route recording
- Real-time display of route points, bus stops, and distance
- Check-in button to mark bus stops while recording
- Visual stats showing route points, bus stops, and distance covered
- Save route and bus stops to backend

**Features:**
- ✅ Geolocation tracking starting from initial position
- ✅ Continuous monitoring of route (every 3 seconds or 5 meters)
- ✅ Check-in button to mark bus stops during recording
- ✅ Named bus stops with coordinates
- ✅ Calculate total distance covered
- ✅ Save complete route data to backend

**Driver Screen Updates:**
- Added "Record Bus Route" button in `app/(screens)/driver.tsx`
- Easy access to route recording feature

#### Backend (Node.js/Express)
**New Files:**
- `server/src/routes/routeRoutes.ts` - Route endpoints
- `server/src/controllers/routeController.ts` - Route logic
- `server/src/services/routeService.ts` - Firestore operations

**API Endpoints:**
- `GET /api/routes/recording-status/:busId` - Check if recording is enabled
- `POST /api/routes/save-recorded` - Save recorded route
- `GET /api/routes/recorded/:busId` - Get all recorded routes
- `POST /api/routes/enable-recording` - Enable route recording (admin)
- `POST /api/routes/disable-recording` - Disable route recording (admin)

## How to Use

### For Drivers

1. **Enable Route Recording** (Admin must enable this first)
   - Contact administrator to enable route recording for your bus

2. **Start Recording**
   - Open the Sundhara Travels app
   - Navigate to Driver Control Panel
   - Tap "Record Bus Route"
   - Grant location permissions if prompted
   - Tap "Start Recording Route"

3. **Record the Route**
   - Drive your normal bus route
   - The app will automatically track your path
   - When you reach a bus stop:
     - Tap "Check In (Mark Bus Stop)"
     - Enter the bus stop name
     - Tap "Add"
   - Continue driving and marking all bus stops

4. **Complete Recording**
   - When you reach the end of the route
   - Tap "Stop Recording & Save"
   - Confirm to save the route
   - The route and bus stops will be submitted for review

### For Administrators

#### Enable Route Recording for a Bus
```typescript
// Using the API
await apiService.enableRouteRecording('bus-a');
```

Or via Firestore:
```javascript
// Update bus document
db.collection('buses').doc('bus-a').update({
  routeRecordingEnabled: true
});
```

#### Review Recorded Routes
```typescript
// Get recorded routes for a bus
const routes = await apiService.getRecordedRoutes('bus-a');
```

#### Approve a Route
The backend includes an `approveRecordedRoute` method in `routeService.ts` that:
- Changes route status to 'active'
- Updates the bus document with new stops and route points
- Can be called when implementing an admin approval interface

## Data Structure

### Recorded Route Object
```typescript
{
  id: string;
  busId: string;
  driverId: string;
  startPoint: {
    latitude: number;
    longitude: number;
  };
  routePoints: Array<{
    latitude: number;
    longitude: number;
    timestamp: number;
    accuracy: number;
    speed?: number;
  }>;
  busStops: Array<{
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    order: number;
    timestamp: number;
  }>;
  distance: number; // in kilometers
  recordedAt: number; // timestamp
  status: 'pending' | 'approved' | 'active';
}
```

## Firestore Collections

### `recordedRoutes`
Stores all recorded routes with status tracking

### `buses`
Updated with `routeRecordingEnabled` flag and approved route data

## Configuration

### Location Tracking Settings
In `route-recording.tsx`:
```typescript
{
  accuracy: Location.Accuracy.BestForNavigation,
  timeInterval: 3000, // Update every 3 seconds
  distanceInterval: 5, // Update every 5 meters
}
```

### Distance Calculation
Uses Haversine formula to calculate distance between GPS points:
```typescript
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  // ... Haversine formula implementation
}
```

## Testing

### Test Image Uploads
1. Profile Screen:
   - Go to Profile → Edit Profile
   - Tap "Change Photo"
   - Select an image
   - Verify upload completes

2. Chat Screen:
   - Go to Group Chat
   - Tap camera icon
   - Select an image
   - Verify upload and message sent

### Test Route Recording
1. Enable recording for a test bus
2. Use the driver account
3. Start route recording
4. Move around (or simulate GPS)
5. Mark 2-3 bus stops
6. Stop recording
7. Check Firestore for saved route

## Error Handling

The implementation includes comprehensive error handling:
- Permission checks before starting
- Network error handling for API calls
- User-friendly error messages
- Automatic cleanup on errors

## Future Enhancements

Potential improvements:
- Admin dashboard for route approval
- Visual map display of recorded route
- Edit recorded routes before submission
- Route history and versioning
- Automatic route detection from multiple recordings
- Offline recording with sync when online

## Security Considerations

- All routes require authentication
- Only drivers can record routes
- Only admins should enable/disable recording
- Route data is validated before saving

## Performance

- Efficient GPS tracking (3s intervals or 5m distance)
- Optimized Firestore queries with limits
- Minimal battery drain with smart location updates

## Support

For issues or questions:
1. Check the app logs for error messages
2. Verify location permissions are granted
3. Ensure route recording is enabled for the bus
4. Contact system administrator
