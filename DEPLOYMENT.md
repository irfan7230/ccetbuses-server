# Sundhara Travels - Production Deployment Guide

Complete guide for deploying the Sundhara Travels bus tracking application to production.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Backend Deployment](#backend-deployment)
3. [Frontend Deployment](#frontend-deployment)
4. [Environment Configuration](#environment-configuration)
5. [Firebase Setup](#firebase-setup)
6. [Cloudinary Setup](#cloudinary-setup)
7. [Testing](#testing)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Accounts
- **Firebase Account** - For authentication, database, and push notifications
- **Cloudinary Account** - For media storage (images, voice messages)
- **Server Hosting** - Digital Ocean, AWS, Heroku, or similar
- **Apple Developer Account** (iOS deployment)
- **Google Play Console** (Android deployment)

### Required Software
- Node.js 18+ and npm 9+
- Git
- Expo CLI (`npm install -g expo-cli eas-cli`)
- PM2 (`npm install -g pm2`) for server process management

---

## Backend Deployment

### Step 1: Server Setup

**Option A: Using Digital Ocean Droplet**

```bash
# SSH into your server
ssh root@your-server-ip

# Update system
apt update && apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt install -y nodejs

# Install PM2
npm install -g pm2

# Install Nginx
apt install -y nginx

# Install Certbot for SSL
apt install -y certbot python3-certbot-nginx
```

**Option B: Using Heroku**

```bash
# Install Heroku CLI
curl https://cli-assets.heroku.com/install.sh | sh

# Login to Heroku
heroku login

# Create new app
heroku create sundhara-travels-api
```

### Step 2: Deploy Backend Code

```bash
# Clone repository on server
git clone https://github.com/your-repo/SundharaTravels.git
cd SundharaTravels/server

# Install dependencies
npm install

# Create production .env file
cp .env.example .env
nano .env
# Fill in all production values

# Build TypeScript
npm run build

# Start with PM2
pm2 start dist/server.js --name sundhara-travels
pm2 save
pm2 startup
```

### Step 3: Configure Nginx Reverse Proxy

Create `/etc/nginx/sites-available/sundhara-travels`:

```nginx
server {
    listen 80;
    server_name api.sundharatravels.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

```bash
# Enable site
ln -s /etc/nginx/sites-available/sundhara-travels /etc/nginx/sites-enabled/

# Test configuration
nginx -t

# Restart Nginx
systemctl restart nginx

# Setup SSL
certbot --nginx -d api.sundharatravels.com
```

### Step 4: Configure Firewall

```bash
ufw allow 22
ufw allow 80
ufw allow 443
ufw enable
```

---

## Frontend Deployment

### Step 1: Configure Environment

Create `.env` file in project root:

```bash
cp .env.example .env
```

Update with production values:

```env
EXPO_PUBLIC_API_URL=https://api.sundharatravels.com/api
EXPO_PUBLIC_SOCKET_URL=https://api.sundharatravels.com

# Firebase config
EXPO_PUBLIC_FIREBASE_API_KEY=your-api-key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

EXPO_PUBLIC_ENV=production
```

### Step 2: Build for Android

```bash
# Install dependencies
npm install

# Login to Expo
eas login

# Configure EAS
eas build:configure

# Build APK for Android
eas build --platform android --profile production

# Or build AAB for Play Store
eas build --platform android --profile production --auto-submit
```

### Step 3: Build for iOS

```bash
# Build for iOS
eas build --platform ios --profile production

# Submit to App Store
eas submit --platform ios
```

### Step 4: Update app.json

```json
{
  "expo": {
    "name": "Sundhara Travels",
    "slug": "sundhara-travels",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/images/icon.png",
    "scheme": "sundharatravels",
    "userInterfaceStyle": "automatic",
    "splash": {
      "image": "./assets/images/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#0A0E27"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.sundharatravels.app",
      "infoPlist": {
        "NSLocationWhenInUseUsageDescription": "We need your location to track the bus.",
        "NSLocationAlwaysAndWhenInUseUsageDescription": "We need your location to track the bus in background."
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/adaptive-icon.png",
        "backgroundColor": "#0A0E27"
      },
      "package": "com.sundharatravels.app",
      "permissions": [
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION",
        "ACCESS_BACKGROUND_LOCATION"
      ]
    },
    "plugins": [
      "expo-router",
      [
        "expo-location",
        {
          "locationAlwaysAndWhenInUsePermission": "Allow Sundhara Travels to use your location for bus tracking."
        }
      ]
    ],
    "extra": {
      "router": {
        "origin": false
      },
      "eas": {
        "projectId": "your-expo-project-id"
      }
    }
  }
}
```

---

## Environment Configuration

### Backend (.env)

```env
# Server
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
ALLOWED_ORIGINS=https://yourdomain.com,exp://192.168.1.100:8081

# Firebase Admin SDK
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=your-secret-key

# JWT
JWT_SECRET=your-super-secret-production-key-change-this
JWT_EXPIRES_IN=7d

# Location Tracking
LOCATION_UPDATE_INTERVAL=5000
PROXIMITY_DISTANCE_KM=2

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
LOG_FILE_PATH=./logs/app.log
```

---

## Firebase Setup

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create new project: "Sundhara Travels"
3. Enable Google Analytics (optional)

### 2. Enable Authentication

1. Go to **Authentication** → **Sign-in method**
2. Enable **Email/Password**
3. Configure authorized domains

### 3. Create Firestore Database

1. Go to **Firestore Database** → **Create database**
2. Start in **production mode**
3. Choose region closest to users

### 4. Set Up Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Bus locations
    match /busLocations/{busId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'driver';
    }
    
    // Trips
    match /trips/{tripId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'driver';
    }
    
    // Notifications
    match /notifications/{notificationId} {
      allow read: if request.auth != null && 
        resource.data.userId == request.auth.uid;
      allow write: if false; // Only server can write
    }
    
    // Bus stops
    match /busStops/{stopId} {
      allow read: if request.auth != null;
      allow write: if false; // Admin only
    }
  }
}
```

### 5. Download Service Account Key

1. Go to **Project Settings** → **Service Accounts**
2. Click **Generate new private key**
3. Save as `serviceAccountKey.json`
4. Extract values for `.env` file

### 6. Enable Cloud Messaging

1. Go to **Cloud Messaging**
2. Note the **Server key** for push notifications
3. Configure for both Android and iOS

---

## Cloudinary Setup

### 1. Create Account

1. Go to [Cloudinary](https://cloudinary.com/)
2. Sign up for free account
3. Navigate to Dashboard

### 2. Get Credentials

From Dashboard, copy:
- **Cloud Name**
- **API Key**
- **API Secret**

### 3. Configure Upload Presets

1. Go to **Settings** → **Upload**
2. Create preset: `sundhara-travels`
3. Set folder structure:
   - `/sundhara-travels/profiles`
   - `/sundhara-travels/chat`
   - `/sundhara-travels/voice`

### 4. Set Up Transformations

Create transformation presets:
- **Profile images**: 500x500, crop to face
- **Chat images**: 1000x1000, quality auto
- **Voice messages**: Auto format

---

## Testing

### Backend Health Check

```bash
curl https://api.sundharatravels.com/api/health
```

Expected response:
```json
{
  "success": true,
  "message": "Sundhara Travels API is running",
  "timestamp": "2025-10-28T..."
}
```

### Socket.io Connection Test

```javascript
const io = require('socket.io-client');
const socket = io('https://api.sundharatravels.com');

socket.on('connect', () => {
  console.log('Connected!');
  socket.emit('join', {
    userId: 'test-user',
    role: 'student',
    busId: 'bus-1'
  });
});
```

### Frontend Test

```bash
# Start Expo development server
npm start

# Scan QR code with Expo Go app
```

---

## Troubleshooting

### Common Issues

**1. Socket.io connection fails**
- Check CORS settings in backend
- Verify firewall allows WebSocket connections
- Check Nginx WebSocket configuration

**2. Location tracking not working**
- Ensure location permissions granted
- Check GPS is enabled on device
- Verify API credentials

**3. Image upload fails**
- Check Cloudinary credentials
- Verify file size limits
- Check network connectivity

**4. Push notifications not received**
- Verify FCM token is registered
- Check Firebase Cloud Messaging setup
- Ensure notification permissions granted

### Logs

**Backend logs:**
```bash
pm2 logs sundhara-travels
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

**Check backend status:**
```bash
pm2 status
pm2 monit
```

---

## Post-Deployment Checklist

- [ ] Backend server running and accessible
- [ ] SSL certificate installed and valid
- [ ] Firebase authentication working
- [ ] Firestore database accessible
- [ ] Cloudinary uploads working
- [ ] Socket.io connections established
- [ ] Push notifications sending
- [ ] Location tracking functional
- [ ] Chat features working
- [ ] Mobile apps built and tested
- [ ] App Store / Play Store submission complete
- [ ] Domain DNS configured
- [ ] Monitoring and alerts set up
- [ ] Backup strategy implemented
- [ ] Documentation updated

---

## Support

For issues or questions:
- Email: support@sundharatravels.com
- Documentation: https://docs.sundharatravels.com
- GitHub Issues: https://github.com/your-repo/issues

---

**Last Updated**: October 28, 2025
**Version**: 1.0.0
