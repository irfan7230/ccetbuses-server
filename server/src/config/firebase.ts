import admin from 'firebase-admin';
import config from './index';
import logger from '../utils/logger';
import path from 'path';
import fs from 'fs';

// Initialize Firebase Admin SDK
try {
  if (!admin.apps.length) {
    // Option 1: Use service account JSON file if exists
    const serviceAccountPath = path.join(__dirname, '../../serviceAccountKey.json');
    
    if (fs.existsSync(serviceAccountPath)) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccountPath),
      });
      logger.info('Firebase Admin SDK initialized from serviceAccountKey.json');
    } 
    // Option 2: Use environment variables
    else {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: config.firebase.projectId,
          privateKey: config.firebase.privateKey?.replace(/\\n/g, '\n'),
          clientEmail: config.firebase.clientEmail,
        }),
      });
      logger.info('Firebase Admin SDK initialized from environment variables');
    }
  }
} catch (error) {
  logger.error('Failed to initialize Firebase Admin SDK:', error);
  logger.error('Please ensure you have either:');
  logger.error('1. Downloaded serviceAccountKey.json to server/ directory, OR');
  logger.error('2. Set valid FIREBASE_PRIVATE_KEY in server/.env');
  throw error;
}

export const auth = admin.auth();
export const firestore = admin.firestore();
export const db = admin.firestore(); // Alias for convenience
export const messaging = admin.messaging();

export default admin;
