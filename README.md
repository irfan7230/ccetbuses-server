# 🚌 Sundhara Travels - College Bus Tracking App

A production-ready real-time bus tracking mobile application built with React Native (Expo), Node.js, Socket.io, Firebase, and Cloudinary.

## 📱 Features

### For Students
- **Real-time Bus Tracking**: Track your college bus location on an interactive dark-themed map
- **Proximity Notifications**: Get notified when the bus is ~2km from your stop
- **Group Chat**: WhatsApp-style chat with bus group (text, images, voice messages)
- **User Profile**: Manage profile with avatar, name, and bus stop selection
- **Modern UI**: Beautiful dark theme with glassmorphism effects and animations

### For Drivers
- **Trip Control**: Start and end trips with a single tap
- **Automatic GPS Tracking**: Share location automatically during active trips
- **Real-time Updates**: Students see your location updated every 5 seconds
- **Speed & Distance Tracking**: Monitor trip statistics

### Technical Features
- **Real-time Communication**: Socket.io for instant location updates and chat
- **Cloud Storage**: Cloudinary for media files (profile images, chat media, voice notes)
- **Authentication**: Firebase Authentication with email/password
- **Database**: Cloud Firestore for user profiles and trip data
- **Push Notifications**: Firebase Cloud Messaging for proximity alerts
- **State Management**: Redux Toolkit
- **Navigation**: Expo Router with custom tab bar
- **Maps**: React Native Maps with CartoDB dark tiles and OSRM routing

## 🏗️ Project Structure

```
SundharaTravels/
├── app/                          # Frontend Expo app
│   ├── (tabs)/                   # Tab navigation screens
│   │   ├── dashboard.tsx         # Map view with real-time tracking
│   │   └── profile.tsx           # User profile screen
│   ├── (screens)/                # Other screens
│   │   ├── chat.tsx              # Group chat
│   │   ├── driver.tsx            # Driver control panel
│   │   ├── edit-profile.tsx      # Profile editing
│   │   └── notifications.tsx     # Notifications list
│   ├── login.tsx                 # Login screen
│   └── signup.tsx                # Signup screen
├── server/                       # Backend Node.js server
│   ├── src/
│   │   ├── config/               # Configuration files
│   │   ├── controllers/          # Route controllers
│   │   ├── middleware/           # Express middleware
│   │   ├── routes/               # API routes
│   │   ├── services/             # Business logic
│   │   ├── sockets/              # Socket.io handlers
│   │   ├── types/                # TypeScript types
│   │   └── server.ts             # Entry point
│   ├── package.json
│   └── tsconfig.json
├── components/                   # Reusable React components
├── services/                     # Frontend API & Socket services
├── store/                        # Redux store and slices
├── constants/                    # App constants
└── types/                        # TypeScript types

```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm 9+
- Expo CLI (`npm install -g expo-cli`)
- Firebase account
- Cloudinary account

### Frontend Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-repo/SundharaTravels.git
   cd SundharaTravels
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your Firebase and API credentials
   ```

4. **Start development server**
   ```bash
   npm start
   ```

5. **Run on device/emulator**
   - Scan QR code with Expo Go app (iOS/Android)
   - Press `a` for Android emulator
   - Press `i` for iOS simulator

### Backend Setup

1. **Navigate to server directory**
   ```bash
   cd server
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with Firebase Admin SDK, Cloudinary, and other credentials
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

The server will run on `http://localhost:3000`

## 📦 Installation Commands

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server && npm install

# Install Expo CLI globally (if not installed)
npm install -g expo-cli eas-cli

# Install PM2 for production (backend)
npm install -g pm2
```

## 🔧 Configuration

### Firebase Setup
1. Create a Firebase project
2. Enable Email/Password authentication
3. Create Firestore database
4. Download service account key for backend
5. Add Firebase config to `.env`

### Cloudinary Setup
1. Create Cloudinary account
2. Get Cloud Name, API Key, and API Secret
3. Add credentials to `.env`

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed setup instructions.

## 🛠️ Tech Stack

### Frontend
- **Framework**: React Native with Expo SDK
- **Language**: TypeScript
- **UI Library**: React Native Paper
- **Navigation**: Expo Router
- **State Management**: Redux Toolkit
- **Maps**: React Native Maps + CartoDB
- **Real-time**: Socket.io Client
- **Forms**: Yup validation
- **Storage**: AsyncStorage

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Real-time**: Socket.io
- **Database**: Cloud Firestore
- **Authentication**: Firebase Admin SDK
- **Storage**: Cloudinary
- **Logging**: Winston
- **Process Manager**: PM2

## 📱 Available Scripts

### Frontend
```bash
npm start              # Start Expo development server
npm run android        # Run on Android
npm run ios            # Run on iOS
npm run web            # Run on web
npm run lint           # Lint code
```

### Backend
```bash
npm run dev            # Start with nodemon (development)
npm run build          # Build TypeScript
npm start              # Start production server
npm run watch          # Watch TypeScript files
```

## 🌐 API Endpoints

### Authentication
- Health check: `GET /api/health`

### User Management
- Get profile: `GET /api/users/profile`
- Update profile: `PUT /api/users/profile`
- Update FCM token: `PUT /api/users/fcm-token`
- Get bus members: `GET /api/users/bus/:busId/members`

### File Uploads
- Upload profile image: `POST /api/upload/profile-image`
- Upload chat image: `POST /api/upload/chat-image`
- Upload voice message: `POST /api/upload/voice`

### Notifications
- Get notifications: `GET /api/notifications`
- Mark as read: `PUT /api/notifications/:id/read`

## 🔌 Socket.io Events

### Client → Server
- `join` - Join bus room
- `location_update` - Update bus location (driver)
- `chat_message` - Send chat message
- `typing` - Typing indicator
- `start_trip` - Start trip (driver)
- `end_trip` - End trip (driver)

### Server → Client
- `bus_location` - Real-time bus location
- `chat_message` - New chat message
- `user_typing` - Typing indicator
- `trip_started` - Trip started notification
- `trip_ended` - Trip ended notification

## 📖 Documentation

- [Deployment Guide](./DEPLOYMENT.md) - Complete production deployment instructions
- [Backend README](./server/README.md) - Backend server documentation
- [API Documentation](./server/README.md#api-endpoints) - API endpoint details

## 🧪 Testing

```bash
# Frontend testing
npm test

# Backend testing
cd server && npm test
```

## 🚢 Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete deployment instructions including:
- Backend deployment (Digital Ocean, Heroku, AWS)
- Frontend app builds (Android & iOS)
- Firebase configuration
- Cloudinary setup
- SSL certificates
- Monitoring and logging

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👥 Authors

- **Sundhara Travels Development Team**

## 🙏 Acknowledgments

- React Native community
- Expo team
- Firebase
- Cloudinary
- All open-source contributors

## 📞 Support

For support, email support@sundharatravels.com or create an issue in the repository.

---

**Made with ❤️ for safer and smarter college commutes**
