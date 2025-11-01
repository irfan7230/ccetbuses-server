# 🔥 Firestore Rules & Indexes - Quick Reference

## 🚀 Quick Deploy

```bash
# Method 1: Using script (Windows)
.\deploy-firestore.bat

# Method 2: Manual
firebase login
firebase init firestore
firebase deploy --only firestore
```

---

## 📊 Required Indexes Summary

| Collection | Fields | Purpose |
|------------|--------|---------|
| `notifications` | userId ↑, timestamp ↓ | User notifications timeline |
| `notifications` | userId ↑, isRead ↑, timestamp ↓ | Unread notifications |
| `chatMessages` | busId ↑, timestamp ↑ | Chat history per bus |
| `trips` | busId ↑, status ↑, startTime ↓ | Active trips per bus |
| `trips` | driverId ↑, startTime ↓ | Driver trip history |
| `busStops` | busId ↑, order ↑ | Ordered bus stops |
| `locations` | timestamp ↓ | Location history (collection group) |
| `tripHistory` | busId ↑, endTime ↓ | Completed trips per bus |
| `tripHistory` | driverId ↑, endTime ↓ | Driver completed trips |
| `emergencySOS` | status ↑, timestamp ↓ | Active emergencies |
| `emergencySOS` | userId ↑, timestamp ↓ | User SOS history |
| `users` | bus ↑, role ↑ | Users by bus and role |
| `feedback` | userId ↑, createdAt ↓ | User feedback history |

**↑ = Ascending | ↓ = Descending**

---

## 🔐 Security Rules Summary

### **Users Collection**
```javascript
✅ Read: Own profile OR same bus
✅ Create: Own profile only (role: student/driver)
✅ Update: Own profile (cannot change role/email)
❌ Delete: Not allowed
```

### **Bus Locations**
```javascript
✅ Read: Same bus users
✅ Write: Drivers only (their bus)
❌ Delete: Not allowed
```

### **Trips**
```javascript
✅ Read: Same bus OR trip driver
✅ Create/Update: Driver only (their bus)
❌ Delete: Not allowed
```

### **Notifications**
```javascript
✅ Read: Own notifications
✅ Update: Own notifications (isRead field only)
❌ Create: Backend only (Admin SDK)
✅ Delete: Own notifications
```

### **Chat Messages**
```javascript
✅ Read: Same bus users
✅ Create: Authenticated users (their bus)
❌ Update/Delete: Immutable
```

### **Bus Stops**
```javascript
✅ Read: All authenticated users
❌ Write: Backend only (Admin SDK)
```

---

## 🧪 Test Queries

### **1. Get User's Notifications**
```javascript
db.collection('notifications')
  .where('userId', '==', currentUserId)
  .orderBy('timestamp', 'desc')
  .limit(50)
```
**Required Index:** ✅ Included

### **2. Get Unread Notifications**
```javascript
db.collection('notifications')
  .where('userId', '==', currentUserId)
  .where('isRead', '==', false)
  .orderBy('timestamp', 'desc')
```
**Required Index:** ✅ Included

### **3. Get Chat Messages**
```javascript
db.collection('chatMessages')
  .where('busId', '==', 'bus-1')
  .orderBy('timestamp', 'asc')
  .limit(100)
```
**Required Index:** ✅ Included

### **4. Get Active Trip**
```javascript
db.collection('trips')
  .where('busId', '==', 'bus-1')
  .where('status', '==', 'active')
  .orderBy('startTime', 'desc')
  .limit(1)
```
**Required Index:** ✅ Included

### **5. Get Bus Stops in Order**
```javascript
db.collection('busStops')
  .where('busId', '==', 'bus-1')
  .orderBy('order', 'asc')
```
**Required Index:** ✅ Included

### **6. Get Trip History**
```javascript
db.collection('tripHistory')
  .where('busId', '==', 'bus-1')
  .orderBy('endTime', 'desc')
  .limit(20)
```
**Required Index:** ✅ Included

### **7. Get Location History (Last 24h)**
```javascript
db.collectionGroup('locations')
  .where('timestamp', '>', Date.now() - 86400000)
  .orderBy('timestamp', 'desc')
```
**Required Index:** ✅ Included

---

## 🔑 Key Helper Functions

```javascript
// Check if user is authenticated
function isAuthenticated() {
  return request.auth != null;
}

// Check if user owns the resource
function isOwner(userId) {
  return request.auth.uid == userId;
}

// Check if user is a driver
function isDriver() {
  return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'driver';
}

// Check if user belongs to the same bus
function isSameBus(busId) {
  return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.bus == busId;
}
```

---

## 🎯 Common Patterns

### **Pattern 1: User-Specific Data**
```javascript
match /notifications/{notificationId} {
  allow read: if resource.data.userId == request.auth.uid;
  allow update: if resource.data.userId == request.auth.uid;
}
```

### **Pattern 2: Role-Based Access**
```javascript
match /busLocations/{busId} {
  allow write: if isDriver() && isSameBus(busId);
}
```

### **Pattern 3: Bus-Based Isolation**
```javascript
match /chatMessages/{messageId} {
  allow read: if isSameBus(resource.data.busId);
}
```

### **Pattern 4: Immutable Fields**
```javascript
allow update: if 
  request.resource.data.role == resource.data.role &&
  request.resource.data.email == resource.data.email;
```

### **Pattern 5: Data Validation**
```javascript
allow create: if 
  request.resource.data.keys().hasAll(['latitude', 'longitude']) &&
  request.resource.data.latitude >= -90 && 
  request.resource.data.latitude <= 90;
```

---

## ⚠️ Important Constraints

### **Latitude/Longitude Validation**
```javascript
latitude: -90 to 90
longitude: -180 to 180
```

### **Role Values**
```javascript
role: "student" | "driver"
```

### **Trip Status**
```javascript
status: "active" | "completed"
```

### **Message Types**
```javascript
type: "text" | "image" | "voice"
```

### **SOS Status**
```javascript
status: "active" | "resolved" | "cancelled"
```

---

## 🔍 Debugging Tips

### **1. Check Rule Simulator**
Firebase Console → Firestore → Rules → Simulator
- Test read/write operations
- Verify authenticated vs unauthenticated

### **2. Enable Firestore Debug Mode**
```javascript
firebase.firestore.setLogLevel('debug');
```

### **3. Common Errors**

**"Missing or insufficient permissions"**
- User not authenticated
- Wrong bus assignment
- Wrong role

**"The query requires an index"**
- Click error link to create
- Or deploy indexes manually

**"Field does not exist"**
- Check field names match exactly
- Verify document structure

---

## 📱 App Integration

### **Initialize Firestore**
```typescript
import { getFirestore } from 'firebase/firestore';
const db = getFirestore();
```

### **Query with Security**
```typescript
// Automatically applies security rules
const q = query(
  collection(db, 'notifications'),
  where('userId', '==', user.uid),
  orderBy('timestamp', 'desc')
);
const snapshot = await getDocs(q);
```

### **Handle Permissions**
```typescript
try {
  await setDoc(doc(db, 'trips', tripId), tripData);
} catch (error) {
  if (error.code === 'permission-denied') {
    console.error('Not authorized to perform this action');
  }
}
```

---

## 🚀 Performance Tips

1. **Use Indexes** - All composite queries covered
2. **Limit Results** - Use `.limit()` on queries
3. **Paginate** - Use `startAfter()` for large datasets
4. **Cache Locally** - Enable offline persistence
5. **Optimize Reads** - Fetch only needed fields

---

## ✅ Deployment Checklist

- [ ] Copy `firestore.rules` to project root
- [ ] Copy `firestore.indexes.json` to project root
- [ ] Create `firebase.json` configuration
- [ ] Run `firebase login`
- [ ] Run `firebase init firestore`
- [ ] Run `firebase deploy --only firestore`
- [ ] Wait 1-2 minutes for indexes to build
- [ ] Test read operations in app
- [ ] Test write operations in app
- [ ] Verify indexes in Firebase Console
- [ ] Test role-based access
- [ ] Test bus-based isolation

---

## 📞 Quick Commands

```bash
# Login
firebase login

# Initialize
firebase init firestore

# Deploy
firebase deploy --only firestore

# Deploy rules only
firebase deploy --only firestore:rules

# Deploy indexes only
firebase deploy --only firestore:indexes

# List projects
firebase projects:list

# Use project
firebase use <project-id>

# Open console
firebase open firestore
```

---

**Quick Start:** Just run `.\deploy-firestore.bat` and follow prompts! 🚀
