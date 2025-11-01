// Quick script to enable route recording for a bus
// Run with: npx ts-node scripts/enableRouteRecording.ts

import admin from 'firebase-admin';
import * as path from 'path';

// Initialize Firebase Admin
const serviceAccount = require(path.join(__dirname, '..', 'server', 'sundhara-travels-32ffe-firebase-adminsdk-6i0vm-f388fa3ad8.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function enableRouteRecording(busId: string) {
  try {
    const busRef = db.collection('buses').doc(busId);
    const busDoc = await busRef.get();

    if (busDoc.exists()) {
      await busRef.update({
        routeRecordingEnabled: true,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log(`✅ Route recording enabled for ${busId}`);
    } else {
      // Create the bus document
      await busRef.set({
        id: busId,
        name: `${busId.toUpperCase()} - Route 1`,
        routeRecordingEnabled: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log(`✅ Bus document created and route recording enabled for ${busId}`);
    }

    // Check the status
    const updatedDoc = await busRef.get();
    const data = updatedDoc.data();
    console.log('\nBus Status:');
    console.log(`  ID: ${data?.id}`);
    console.log(`  Name: ${data?.name}`);
    console.log(`  Route Recording: ${data?.routeRecordingEnabled ? '✅ ENABLED' : '❌ DISABLED'}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Get bus ID from command line or use default
const busId = process.argv[2] || 'bus-1';
console.log(`\n🚌 Enabling route recording for: ${busId}\n`);

enableRouteRecording(busId);
