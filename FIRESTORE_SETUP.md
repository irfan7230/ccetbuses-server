# 🔥 Firestore Security Rules & Indexes Setup

## 📋 Overview

This document explains how to deploy Firestore security rules and indexes for the Sundhara Travels app.

---

## 🔐 Security Rules Features

### **Access Control:**
- ✅ **Role-based access** (Student, Driver)
- ✅ **Bus-based isolation** (users only see their bus data)
- ✅ **Owner-only profile updates**
- ✅ **Driver-only location & trip management**
- ✅ **Private notifications per user**
- ✅ **Immutable chat messages**
- ✅ **Emergency SOS handling**

### **Data Validation:**
- ✅ Email verification required
- ✅ GPS coordinate validation
- ✅ Required field enforcement
- ✅ Type checking
- ✅ Immutable fields protection

### **Collections Secured:**
1. `users` - User profiles
2. `busLocations` - Real-time bus GPS
3. `trips` - Trip management
4. `busStops` - Bus stop data
5. `notifications` - User notifications
6. `chatMessages` - Group chat (optional)
7. `locationHistory` - GPS history
8. `fcmTokens` - Push notification tokens
9. `tripHistory` - Completed trips
10. `emergencySOS` - Emergency alerts
11. `feedback` - User feedback

---

## 🚀 Deployment Methods

### **Method 1: Firebase Console (Easiest)**

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Navigate to **Firestore Database** → **Rules**
4. Copy contents of `firestore.rules`
5. Paste into the editor
6. Click **Publish**

**For Indexes:**
1. Navigate to **Firestore Database** → **Indexes**
2. Click **Add Index** for each composite index
3. Or upload `firestore.indexes.json` via Firebase CLI

### **Method 2: Firebase CLI (Recommended)**

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in your project
firebase init

# Select:
# - Firestore (Rules and Indexes)
# - Choose your Firebase project

# Deploy rules and indexes
firebase deploy --only firestore
```

### **Method 3: Manual Index Creation**

If you prefer manual creation, here are the indexes needed:

---

## 📊 Required Composite Indexes

### **1. Notifications by User & Time**
```
Collection: notifications
Fields:
  - userId (Ascending)
  - timestamp (Descending)
```

### **2. Unread Notifications**
```
Collection: notifications
Fields:
  - userId (Ascending)
  - isRead (Ascending)
  - timestamp (Descending)
```

### **3. Chat Messages by Bus**
```
Collection: chatMessages
Fields:
  - busId (Ascending)
  - timestamp (Ascending)
```

### **4. Active Trips by Bus**
```
Collection: trips
Fields:
  - busId (Ascending)
  - status (Ascending)
  - startTime (Descending)
```

### **5. Driver Trip History**
```
Collection: trips
Fields:
  - driverId (Ascending)
  - startTime (Descending)
```

### **6. Bus Stops Order**
```
Collection: busStops
Fields:
  - busId (Ascending)
  - order (Ascending)
```

### **7. Location History**
```
Collection Group: locations
Fields:
  - timestamp (Descending)
```

### **8. Trip History by Bus**
```
Collection: tripHistory
Fields:
  - busId (Ascending)
  - endTime (Descending)
```

### **9. Trip History by Driver**
```
Collection: tripHistory
Fields:
  - driverId (Ascending)
  - endTime (Descending)
```

### **10. Emergency SOS by Status**
```
Collection: emergencySOS
Fields:
  - status (Ascending)
  - timestamp (Descending)
```

### **11. User SOS History**
```
Collection: emergencySOS
Fields:
  - userId (Ascending)
  - timestamp (Descending)
```

### **12. Users by Bus & Role**
```
Collection: users
Fields:
  - bus (Ascending)
  - role (Ascending)
```

### **13. User Feedback**
```
Collection: feedback
Fields:
  - userId (Ascending)
  - createdAt (Descending)
```

---

## 🧪 Testing Security Rules

### **Test Suite Commands:**

```bash
# Install Firestore emulator
npm install -g @firebase/rules-unit-testing

# Create test file: firestore.test.js
# Run tests
npm test
```

### **Manual Testing:**

1. **Test User Read:**
   - ✅ User can read own profile
   - ❌ User cannot read other user profiles (unless same bus)

2. **Test Location Updates:**
   - ✅ Driver can update bus location
   - ❌ Student cannot update location

3. **Test Notifications:**
   - ✅ User can read own notifications
   - ❌ User cannot read others' notifications

4. **Test Trip Management:**
   - ✅ Driver can start/end trips
   - ❌ Student cannot manage trips

---

## 📝 Important Notes

### **Admin Operations:**
Some operations require Firebase Admin SDK (bypass security rules):
- Creating bus stops
- Creating notifications
- Writing trip history
- Administrative tasks

Use Admin SDK in your backend (already configured in `server/src/config/firebase.ts`)

### **Role Assignment:**
- Users set their role during signup (student/driver)
- Role **cannot be changed** after creation (enforced by rules)
- If role change needed, create new account or use Admin SDK

### **Bus Assignment:**
- Users must be assigned to a bus
- Bus ID format: `bus-1`, `bus-2`, etc.
- Students and drivers in same bus can see each other's data

### **Location History:**
- Automatically cleaned up after 24 hours (in rules)
- Use cron job for permanent deletion

---

## 🔧 Firestore Data Structure

```
firestore/
├── users/{userId}
│   ├── email: string
│   ├── fullName: string
│   ├── role: "student" | "driver"
│   ├── bus: string (e.g., "bus-1")
│   ├── busStop?: string
│   ├── profileImageUri?: string
│   ├── phone?: string
│   ├── fcmToken?: string
│   ├── createdAt: timestamp
│   └── updatedAt: timestamp
│
├── busLocations/{busId}
│   ├── latitude: number
│   ├── longitude: number
│   ├── timestamp: number
│   ├── accuracy?: number
│   ├── speed?: number
│   ├── heading?: number
│   └── isActive: boolean
│
├── trips/{tripId}
│   ├── busId: string
│   ├── driverId: string
│   ├── startTime: timestamp
│   ├── endTime?: timestamp
│   ├── status: "active" | "completed"
│   ├── distance?: number
│   └── route?: array
│
├── busStops/{stopId}
│   ├── name: string
│   ├── location: { latitude: number, longitude: number }
│   ├── busId: string
│   ├── order: number
│   ├── createdAt: timestamp
│   └── updatedAt: timestamp
│
├── notifications/{notificationId}
│   ├── userId: string
│   ├── type: string
│   ├── title: string
│   ├── message: string
│   ├── timestamp: timestamp
│   ├── isRead: boolean
│   └── data?: object
│
└── chatMessages/{messageId} (optional)
    ├── senderId: string
    ├── busId: string
    ├── type: "text" | "image" | "voice"
    ├── content: string
    ├── imageUrl?: string
    ├── voiceUrl?: string
    ├── timestamp: timestamp
    └── metadata?: object
```

---

## 🚨 Common Issues

### **1. Permission Denied Error**
```
Error: Missing or insufficient permissions
```
**Solution:** Ensure user is authenticated and has correct role/bus assignment.

### **2. Index Not Created**
```
Error: The query requires an index
```
**Solution:** 
- Click the link in error message to auto-create index
- Or manually create from `firestore.indexes.json`

### **3. Rules Not Applied**
**Solution:**
- Wait 1-2 minutes after deployment
- Clear app cache
- Re-authenticate user

### **4. Location Validation Failed**
```
Error: Invalid latitude/longitude
```
**Solution:** Ensure GPS coordinates are:
- latitude: -90 to 90
- longitude: -180 to 180

---

## ✅ Deployment Checklist

- [ ] Install Firebase CLI: `npm install -g firebase-tools`
- [ ] Login: `firebase login`
- [ ] Initialize: `firebase init firestore`
- [ ] Review `firestore.rules` file
- [ ] Review `firestore.indexes.json` file
- [ ] Deploy: `firebase deploy --only firestore`
- [ ] Test read permissions
- [ ] Test write permissions
- [ ] Test role-based access
- [ ] Verify indexes created
- [ ] Test queries performance
- [ ] Monitor Firestore usage in console

---

## 📊 Monitoring

### **Firebase Console:**
1. Go to **Firestore** → **Usage**
2. Monitor:
   - Read operations
   - Write operations
   - Delete operations
   - Storage usage

### **Set Alerts:**
1. Go to **Budget & Alerts**
2. Set usage thresholds
3. Configure email notifications

---

## 🔗 Useful Links

- [Firestore Security Rules Documentation](https://firebase.google.com/docs/firestore/security/get-started)
- [Composite Indexes](https://firebase.google.com/docs/firestore/query-data/indexing)
- [Firebase CLI Reference](https://firebase.google.com/docs/cli)
- [Best Practices](https://firebase.google.com/docs/firestore/best-practices)

---

## 📞 Support

If you encounter issues:
1. Check Firebase Console logs
2. Review security rules
3. Verify user authentication
4. Check indexes are created
5. Test with Firebase Emulator first

---

**Last Updated:** October 29, 2025
**Version:** 1.0.0
