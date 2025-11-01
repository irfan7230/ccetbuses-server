/**
 * Script to seed bus stops into Firestore
 * Run this once to populate initial data
 * Usage: npx ts-node scripts/seedBusStops.ts
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, setDoc, doc } from 'firebase/firestore';

// Firebase config - get from your Firebase console
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Bus stops data based on routeData.ts coordinates
const busStops = [
  {
    id: 'stop-1',
    name: 'Mallapuram',
    location: { latitude: 10.6817, longitude: 78.0420 },
    busId: 'bus-1',
    order: 1,
  },
  {
    id: 'stop-2',
    name: 'Soolapuram',
    location: { latitude: 10.70686, longitude: 78.024441 },
    busId: 'bus-1',
    order: 2,
  },
  {
    id: 'stop-3',
    name: 'Esanatham',
    location: { latitude: 10.706854, longitude: 78.003016 },
    busId: 'bus-1',
    order: 3,
  },
  {
    id: 'stop-4',
    name: 'Intermediate Stop 1',
    location: { latitude: 10.696463, longitude: 77.969597 },
    busId: 'bus-1',
    order: 4,
  },
  {
    id: 'stop-5',
    name: 'Jamin Aathur',
    location: { latitude: 10.691624, longitude: 77.970198 },
    busId: 'bus-1',
    order: 5,
  },
  {
    id: 'stop-6',
    name: 'Pallapatti',
    location: { latitude: 10.723762, longitude: 77.892119 },
    busId: 'bus-1',
    order: 6,
  },
  {
    id: 'stop-7',
    name: 'Aravakurichi',
    location: { latitude: 10.774, longitude: 77.909 },
    busId: 'bus-1',
    order: 7,
  },
  {
    id: 'stop-8',
    name: 'MalaiKovilur',
    location: { latitude: 10.848177, longitude: 77.975038 },
    busId: 'bus-1',
    order: 8,
  },
  {
    id: 'stop-9',
    name: 'Intermediate Stop 2',
    location: { latitude: 10.925841, longitude: 78.098027 },
    busId: 'bus-1',
    order: 9,
  },
  {
    id: 'stop-10',
    name: 'Intermediate Stop 3',
    location: { latitude: 10.918128, longitude: 78.093783 },
    busId: 'bus-1',
    order: 10,
  },
  {
    id: 'stop-11',
    name: 'Thanthonimalai',
    location: { latitude: 10.934731, longitude: 78.089785 },
    busId: 'bus-1',
    order: 11,
  },
  {
    id: 'stop-12',
    name: 'Gandhigramam',
    location: { latitude: 10.950067, longitude: 78.088314 },
    busId: 'bus-1',
    order: 12,
  },
  {
    id: 'stop-13',
    name: 'Chettinad College',
    location: { latitude: 10.939604, longitude: 78.134679 },
    busId: 'bus-1',
    order: 13,
  },
];

async function seedBusStops() {
  console.log('🚌 Starting to seed bus stops...');
  
  try {
    for (const stop of busStops) {
      await setDoc(doc(db, 'busStops', stop.id), {
        ...stop,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log(`✅ Added: ${stop.name}`);
    }
    
    console.log('\n🎉 Successfully seeded all bus stops!');
    console.log(`📊 Total stops added: ${busStops.length}`);
  } catch (error) {
    console.error('❌ Error seeding bus stops:', error);
  }
}

// Run the seeding function
seedBusStops()
  .then(() => {
    console.log('\n✨ Seeding complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
