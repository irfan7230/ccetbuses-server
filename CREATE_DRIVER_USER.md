# 🚌 Create Driver User - Complete Guide

## 📋 Driver Credentials

```
Email:    driver@sundharatravels.com
Password: ccet@busesm
Role:     driver
Bus:      bus-1
```

---

## 🚀 Quick Setup (Recommended)

### **Method 1: Using Backend Script**

1. **Open terminal in server folder:**
   ```bash
   cd server
   ```

2. **Run the script:**
   ```bash
   npm run create-driver
   ```

3. **Done!** ✅ The driver user is created in Firebase.

---

## 🔧 Manual Setup (Alternative)

### **Option A: Firebase Console**

1. Go to [Firebase Console](https://console.firebase.google.com/project/sundhara-travels-32ffe)

2. **Create Authentication User:**
   - Go to **Authentication** → **Users**
   - Click **Add user**
   - Email: `driver@sundharatravels.com`
   - Password: `ccet@busesm`
   - Click **Add user**
   - Copy the **UID** (you'll need it)

3. **Create Firestore Document:**
   - Go to **Firestore Database**
   - Navigate to `users` collection
   - Click **Add document**
   - Document ID: `<paste the UID from step 2>`
   - Add fields:
     ```
     email: "driver@sundharatravels.com"
     fullName: "Sundhara Bus Driver"
     role: "driver"
     bus: "bus-1"
     phone: "+91 9876543210"
     createdAt: <current timestamp>
     updatedAt: <current timestamp>
     ```

### **Option B: Firebase CLI**

```bash
# Login to Firebase
firebase login

# Use project
firebase use sundhara-travels-32ffe

# Run in Firebase console (Functions or shell)
```

---

## ✅ Verification Steps

1. **Test Login in App:**
   - Start the app: `npm start`
   - Go to Login screen
   - Enter:
     - Email: `driver@sundharatravels.com`
     - Password: `ccet@busesm`
   - Click **Sign In**

2. **Check Firebase:**
   - **Authentication**: User should appear in Users list
   - **Firestore**: Document should exist in `users/{uid}`
   - **Role**: Should be `driver`
   - **Bus**: Should be `bus-1`

3. **Driver Screen:**
   - After login, you should see the Driver screen
   - **Start Trip** and **End Trip** buttons should be visible
   - GPS tracking should work when trip is active

---

## 🎯 What This User Can Do

### **Driver Capabilities:**
- ✅ Start and end bus trips
- ✅ Automatic GPS location tracking (every 5 seconds)
- ✅ Send real-time location to students
- ✅ Access driver control panel
- ✅ View trip statistics
- ✅ Chat with students
- ✅ Receive notifications

### **Bus Assignment:**
- Assigned to: **bus-1**
- Can only control **bus-1** trips
- Location updates tied to **bus-1**

---

## 🔐 Security Notes

### **Firestore Rules:**
The driver user has these permissions:
```javascript
// Can update bus location
allow write on /busLocations/bus-1: if role == 'driver'

// Can start/end trips
allow write on /trips/*: if role == 'driver' && busId == 'bus-1'

// Can read users in same bus
allow read on /users/*: if bus == 'bus-1'
```

### **API Access:**
- Driver can access all driver-specific endpoints
- Backend validates role from Firebase token
- Socket.io events restricted by role

---

## 🐛 Troubleshooting

### **"Email already in use"**
- User already exists! ✅
- Just login with the credentials
- Or reset password if needed

### **"User not found in Firestore"**
- Authentication user exists but Firestore document missing
- Manually create Firestore document (see Option A above)
- Or delete auth user and run script again

### **"Invalid credentials"**
- Check email is exactly: `driver@sundharatravels.com`
- Check password is exactly: `ccet@busesm`
- Case-sensitive!

### **"Permission denied"**
- Firestore rules not deployed
- Run: `firebase deploy --only firestore:rules`
- Check user has `role: "driver"` in Firestore

### **Driver screen not showing**
- Check user role in Firestore is `"driver"`
- Check `bus` field is set to `"bus-1"`
- Logout and login again

---

## 📱 Testing the Full Flow

1. **Create Driver User:**
   ```bash
   cd server
   npm run create-driver
   ```

2. **Start Backend:**
   ```bash
   npm run dev
   ```
   Server should be running on port 3001

3. **Start Frontend:**
   ```bash
   cd ..
   npm start
   ```

4. **Login:**
   - Scan QR with Expo Go
   - Login with driver credentials
   - Should see Driver screen

5. **Test Features:**
   - Click "Start Trip"
   - Location should update every 5 seconds
   - Check Firebase → busLocations/bus-1
   - Click "End Trip"
   - Trip should be saved to Firestore

---

## 🎉 Success Indicators

You'll know everything works when:
- ✅ Driver can login successfully
- ✅ Driver screen shows (not student dashboard)
- ✅ "Start Trip" button is visible
- ✅ GPS permissions are requested
- ✅ Location updates appear in Firebase
- ✅ Students see bus moving on map
- ✅ Chat works between driver and students

---

## 📞 Quick Commands Reference

```bash
# Create driver user
cd server
npm run create-driver

# Start backend server
cd server
npm run dev

# Start frontend
npm start

# Deploy Firestore rules
firebase deploy --only firestore:rules

# Check Firebase logs
firebase functions:log

# Reset everything (if needed)
firebase auth:export users.json
firebase firestore:delete --all-collections
```

---

## 🔄 Create Additional Drivers

To create more drivers (e.g., for bus-2, bus-3):

1. Edit `server/scripts/createDriver.ts`
2. Change:
   ```typescript
   const driverEmail = 'driver2@sundharatravels.com';
   const driverPassword = 'your-password';
   const driverData = {
     ...
     bus: 'bus-2', // Change bus number
   };
   ```
3. Run: `npm run create-driver`

---

**Status:** ✅ Ready to create driver user!
**Next Step:** Run `cd server && npm run create-driver`
