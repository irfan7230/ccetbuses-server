# Sundhara Travels Backend Server

Production-ready Node.js backend for the Sundhara Travels college bus tracking application.

## Features

- **Real-time Location Tracking**: Socket.io for live bus location updates
- **Push Notifications**: Firebase Cloud Messaging for proximity alerts
- **Media Storage**: Cloudinary integration for images and voice messages
- **Authentication**: Firebase Admin SDK for secure user authentication
- **RESTful API**: Express.js with TypeScript
- **Database**: Cloud Firestore for data persistence
- **Security**: Helmet, CORS, rate limiting
- **Logging**: Winston for comprehensive logging

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Real-time**: Socket.io
- **Database**: Cloud Firestore
- **Authentication**: Firebase Admin SDK
- **Storage**: Cloudinary
- **Logging**: Winston
- **Process Management**: PM2 (production)

## Project Structure

```
server/
├── src/
│   ├── config/           # Configuration files
│   │   ├── index.ts      # Main config
│   │   ├── firebase.ts   # Firebase Admin setup
│   │   └── cloudinary.ts # Cloudinary setup
│   ├── controllers/      # Route controllers
│   ├── middleware/       # Express middleware
│   ├── routes/           # API routes
│   ├── services/         # Business logic
│   ├── sockets/          # Socket.io handlers
│   ├── types/            # TypeScript types
│   ├── utils/            # Utility functions
│   └── server.ts         # Entry point
├── dist/                 # Compiled JavaScript
├── logs/                 # Application logs
├── .env                  # Environment variables
├── package.json
└── tsconfig.json
```

## Installation

1. **Navigate to server directory**:
   ```bash
   cd server
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   ```bash
   cp .env.example .env
   ```

4. **Configure `.env` file**:
   - Add Firebase Admin SDK credentials
   - Add Cloudinary credentials
   - Set allowed origins for CORS
   - Configure other settings

5. **Download Firebase service account key**:
   - Go to Firebase Console → Project Settings → Service Accounts
   - Generate a new private key
   - Save as `serviceAccountKey.json` in the `server` directory (git ignored)

## Development

**Start development server**:
```bash
npm run dev
```

The server will run on `http://localhost:3000` with hot-reload enabled.

## Build

**Compile TypeScript**:
```bash
npm run build
```

**Watch mode**:
```bash
npm run watch
```

## Production

**Start production server**:
```bash
npm start
```

**Using PM2** (recommended):
```bash
# Install PM2 globally
npm install -g pm2

# Start with PM2
pm2 start dist/server.js --name sundhara-travels

# View logs
pm2 logs sundhara-travels

# Monitor
pm2 monit
```

## API Endpoints

### Health Check
- `GET /` - Root endpoint
- `GET /api/health` - Health check

### User Management
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `PUT /api/users/fcm-token` - Update FCM token
- `GET /api/users/bus/:busId/members` - Get bus members

### File Uploads
- `POST /api/upload/profile-image` - Upload profile image
- `POST /api/upload/chat-image` - Upload chat image
- `POST /api/upload/voice` - Upload voice message

### Notifications
- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications/:notificationId/read` - Mark as read

## Socket.io Events

### Client → Server
- `join` - Join bus room
- `location_update` - Update bus location (driver)
- `chat_message` - Send chat message
- `typing` - Typing indicator
- `start_trip` - Start trip (driver)
- `end_trip` - End trip (driver)

### Server → Client
- `bus_location` - Bus location update
- `chat_message` - New chat message
- `user_typing` - User typing
- `trip_started` - Trip started notification
- `trip_ended` - Trip ended notification

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NODE_ENV` | Environment (development/production) | Yes |
| `PORT` | Server port | Yes |
| `ALLOWED_ORIGINS` | CORS allowed origins | Yes |
| `FIREBASE_PROJECT_ID` | Firebase project ID | Yes |
| `FIREBASE_PRIVATE_KEY` | Firebase private key | Yes |
| `FIREBASE_CLIENT_EMAIL` | Firebase client email | Yes |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | Yes |
| `CLOUDINARY_API_KEY` | Cloudinary API key | Yes |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | Yes |
| `JWT_SECRET` | JWT secret key | Yes |
| `LOCATION_UPDATE_INTERVAL` | Location update interval (ms) | No |
| `PROXIMITY_DISTANCE_KM` | Proximity alert distance (km) | No |

## Security

- **Helmet**: Security headers
- **CORS**: Configured origins only
- **Rate Limiting**: 100 requests per 15 minutes
- **Authentication**: Firebase ID token verification
- **Input Validation**: Express validator
- **File Upload**: Size limits and type restrictions

## Logging

Logs are stored in:
- `logs/app.log` - All logs
- `logs/error.log` - Error logs only

Log levels: `error`, `warn`, `info`, `debug`

## Testing

```bash
npm test
```

## Deployment

### Heroku
1. Create Heroku app
2. Set environment variables
3. Deploy:
   ```bash
   git push heroku main
   ```

### Digital Ocean / AWS
1. Set up Node.js server
2. Install dependencies
3. Build project
4. Configure PM2
5. Set up Nginx reverse proxy
6. Enable SSL with Let's Encrypt

### Docker
```bash
docker build -t sundhara-travels-server .
docker run -p 3000:3000 --env-file .env sundhara-travels-server
```

## Monitoring

- **PM2**: Process monitoring
- **Winston**: Application logging
- **Cron Jobs**: Cleanup tasks every 5 minutes

## Support

For issues or questions, contact the development team.

## License

MIT
