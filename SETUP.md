# 🚀 Quick Setup Guide - Sundhara Travels

Get your Sundhara Travels app running in minutes!

## ⚡ Quick Start (Development)

### Step 1: Install Dependencies

```bash
# Frontend dependencies
npm install

# Backend dependencies
cd server
npm install
cd ..
```

### Step 2: Setup Environment Files

**Frontend (.env)**
```bash
cp .env.example .env
```

Edit `.env`:
```env
EXPO_PUBLIC_API_URL=http://192.168.1.100:3000/api
EXPO_PUBLIC_SOCKET_URL=http://192.168.1.100:3000

# Add your Firebase config here
EXPO_PUBLIC_FIREBASE_API_KEY=your-key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-domain
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
# ... etc
```

**Backend (server/.env)**
```bash
cd server
cp .env.example .env
```

Edit `server/.env`:
```env
NODE_ENV=development
PORT=3000
ALLOWED_ORIGINS=http://localhost:8081,exp://192.168.1.100:8081

# Firebase Admin SDK
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="your-private-key"
FIREBASE_CLIENT_EMAIL=your-email@project.iam.gserviceaccount.com

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# JWT
JWT_SECRET=your-super-secret-key
```

### Step 3: Start Backend Server

```bash
cd server
npm run dev
```

Server should start on `http://localhost:3000`

### Step 4: Start Frontend App

In a new terminal:

```bash
# Make sure you're in the root directory
npm start
```

Then:
- **Android**: Press `a` or scan QR with Expo Go
- **iOS**: Press `i` or scan QR with Expo Go
- **Web**: Press `w`

---

## 🔥 Firebase Setup (Required)

### 1. Create Firebase Project

1. Go to https://console.firebase.google.com/
2. Click "Add project"
3. Name it "Sundhara Travels"
4. Follow the setup wizard

### 2. Enable Authentication

1. In Firebase Console, go to **Authentication**
2. Click **Get Started**
3. Enable **Email/Password** provider
4. Save

### 3. Create Firestore Database

1. Go to **Firestore Database**
2. Click **Create database**
3. Choose **Start in production mode**
4. Select your region
5. Click **Enable**

### 4. Set Security Rules

In Firestore, go to **Rules** tab and paste:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    match /busLocations/{busId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    match /trips/{tripId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    match /notifications/{notificationId} {
      allow read: if request.auth != null && resource.data.userId == request.auth.uid;
    }
    match /busStops/{stopId} {
      allow read: if request.auth != null;
    }
  }
}
```

Click **Publish**

### 5. Get Web Config

1. Go to **Project Settings** (gear icon)
2. Scroll to **Your apps**
3. Click **Web** icon (</>) to add web app
4. Register app with name "Sundhara Travels Web"
5. Copy the config object
6. Add values to `.env` file:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=AIza...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef
```

### 6. Get Admin SDK Key (Backend)

1. Go to **Project Settings** → **Service Accounts**
2. Click **Generate new private key**
3. Download the JSON file
4. Open the file and extract:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `private_key` → `FIREBASE_PRIVATE_KEY`
   - `client_email` → `FIREBASE_CLIENT_EMAIL`
5. Add to `server/.env`

---

## ☁️ Cloudinary Setup (Required)

### 1. Create Account

1. Go to https://cloudinary.com/
2. Sign up for free account
3. Verify email

### 2. Get Credentials

1. Go to **Dashboard**
2. Copy these values:
   - **Cloud Name**
   - **API Key**
   - **API Secret**
3. Add to `server/.env`:

```env
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abcdefghijklmnopqrstuvwx
```

---

## 📱 First Run

### 1. Start Backend

```bash
cd server
npm run dev
```

You should see:
```
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   🚌  Sundhara Travels Server                        ║
║                                                       ║
║   Environment: development                            ║
║   Server:      http://0.0.0.0:3000                   ║
║   Socket.io:   Ready for real-time connections       ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
```

### 2. Test Backend

Open browser or use curl:
```bash
curl http://localhost:3000/api/health
```

Should return:
```json
{
  "success": true,
  "message": "Sundhara Travels API is running",
  "timestamp": "2025-10-28T..."
}
```

### 3. Update Frontend API URL

In `.env`, replace `192.168.1.100` with your computer's local IP:

```bash
# On Windows
ipconfig
# Look for IPv4 Address

# On Mac/Linux
ifconfig
# Look for inet address
```

Update `.env`:
```env
EXPO_PUBLIC_API_URL=http://YOUR_LOCAL_IP:3000/api
EXPO_PUBLIC_SOCKET_URL=http://YOUR_LOCAL_IP:3000
```

### 4. Start Frontend

```bash
npm start
```

### 5. Test on Device

1. Install **Expo Go** app on your phone
2. Scan the QR code
3. App should load

---

## 🧪 Testing the App

### Create Test User

1. Open app on device
2. Click **Sign Up**
3. Enter:
   - Email: `student@test.com`
   - Password: `Test123!`
   - Confirm password
4. Click **Sign Up**

### Complete Profile

1. Add full name: `Test Student`
2. Select bus stop: `Pallapatti Stop`
3. (Optional) Add profile photo
4. Click **Save**

### Test Features

**Dashboard:**
- ✅ Map should load with dark theme
- ✅ Route line should appear
- ✅ Bus marker visible

**Profile:**
- ✅ View profile information
- ✅ Edit profile
- ✅ Upload profile picture

**Chat:**
- ✅ Send text messages
- ✅ Send images
- ✅ Record voice messages

---

## 🔧 Troubleshooting

### Backend won't start

**Problem**: `Cannot find module 'express'`

**Solution**:
```bash
cd server
rm -rf node_modules package-lock.json
npm install
```

### Frontend can't connect to backend

**Problem**: Network request failed

**Solution**:
1. Check backend is running (`http://localhost:3000/api/health`)
2. Update IP address in `.env` to your local IP
3. Ensure phone and computer are on same WiFi
4. Check firewall isn't blocking port 3000

### Firebase authentication fails

**Problem**: API key errors

**Solution**:
1. Double-check all Firebase config values in `.env`
2. Ensure quotation marks are correct
3. Restart Expo server after changing `.env`

### Images won't upload

**Problem**: Cloudinary upload fails

**Solution**:
1. Verify Cloudinary credentials in `server/.env`
2. Check backend logs for errors
3. Ensure phone has camera/gallery permissions

### Socket.io not connecting

**Problem**: Real-time updates not working

**Solution**:
1. Check `EXPO_PUBLIC_SOCKET_URL` in `.env`
2. Verify backend Socket.io is initialized
3. Check browser console for connection errors

---

## 📋 Checklist

Before you start development, ensure:

- [ ] Node.js 18+ installed
- [ ] npm 9+ installed
- [ ] Expo CLI installed globally
- [ ] Frontend dependencies installed
- [ ] Backend dependencies installed
- [ ] Firebase project created
- [ ] Firebase Auth enabled
- [ ] Firestore database created
- [ ] Firebase security rules set
- [ ] Firebase web config added to `.env`
- [ ] Firebase Admin SDK downloaded
- [ ] Cloudinary account created
- [ ] Cloudinary credentials added
- [ ] Backend `.env` configured
- [ ] Frontend `.env` configured
- [ ] Backend server starts successfully
- [ ] Frontend app runs on device
- [ ] Test user can sign up
- [ ] Profile can be completed

---

## 🎯 Next Steps

Once everything is running:

1. **Create Driver Account**: Modify a user in Firestore to have `role: 'driver'`
2. **Test Real-time Tracking**: Start a trip from driver screen
3. **Test Proximity Alerts**: Configure bus stops in Firestore
4. **Customize UI**: Update theme colors, logos, etc.
5. **Add Production Config**: Follow [DEPLOYMENT.md](./DEPLOYMENT.md)

---

## 📚 Need Help?

- **Documentation**: [README.md](./README.md)
- **Deployment**: [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Backend Docs**: [server/README.md](./server/README.md)
- **Issues**: Create an issue on GitHub

---

**Happy Coding! 🚀**
