import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Initialize Firebase Admin
const serviceAccountPath = path.join(__dirname, '../serviceAccountKey.json');

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccountPath),
    });
    console.log('✅ Firebase Admin initialized\n');
  } catch (error) {
    console.error('❌ Error initializing Firebase Admin:', error);
    process.exit(1);
  }
}

const firestore = admin.firestore();

// Bus stops data from the existing seedBusStops.ts
const busStops = [
  {
    id: 'stop-1',
    name: 'Mallapuram',
    location: { latitude: 10.6817, longitude: 78.0420, timestamp: Date.now() },
    busId: 'bus-1',
    order: 1,
  },
  {
    id: 'stop-2',
    name: 'Soolapuram',
    location: { latitude: 10.70686, longitude: 78.024441, timestamp: Date.now() },
    busId: 'bus-1',
    order: 2,
  },
  {
    id: 'stop-3',
    name: 'Esanatham',
    location: { latitude: 10.706854, longitude: 78.003016, timestamp: Date.now() },
    busId: 'bus-1',
    order: 3,
  },
  {
    id: 'stop-4',
    name: 'Intermediate Stop 1',
    location: { latitude: 10.696463, longitude: 77.969597, timestamp: Date.now() },
    busId: 'bus-1',
    order: 4,
  },
  {
    id: 'stop-5',
    name: 'Jamin Aathur',
    location: { latitude: 10.691624, longitude: 77.970198, timestamp: Date.now() },
    busId: 'bus-1',
    order: 5,
  },
  {
    id: 'stop-6',
    name: 'Pallapatti',
    location: { latitude: 10.723762, longitude: 77.892119, timestamp: Date.now() },
    busId: 'bus-1',
    order: 6,
  },
  {
    id: 'stop-7',
    name: 'Aravakurichi',
    location: { latitude: 10.774, longitude: 77.909, timestamp: Date.now() },
    busId: 'bus-1',
    order: 7,
  },
  {
    id: 'stop-8',
    name: 'MalaiKovilur',
    location: { latitude: 10.848177, longitude: 77.975038, timestamp: Date.now() },
    busId: 'bus-1',
    order: 8,
  },
  {
    id: 'stop-9',
    name: 'Intermediate Stop 2',
    location: { latitude: 10.925841, longitude: 78.098027, timestamp: Date.now() },
    busId: 'bus-1',
    order: 9,
  },
  {
    id: 'stop-10',
    name: 'Intermediate Stop 3',
    location: { latitude: 10.918128, longitude: 78.093783, timestamp: Date.now() },
    busId: 'bus-1',
    order: 10,
  },
  {
    id: 'stop-11',
    name: 'Thanthonimalai',
    location: { latitude: 10.934731, longitude: 78.089785, timestamp: Date.now() },
    busId: 'bus-1',
    order: 11,
  },
  {
    id: 'stop-12',
    name: 'Gandhigramam',
    location: { latitude: 10.950067, longitude: 78.088314, timestamp: Date.now() },
    busId: 'bus-1',
    order: 12,
  },
  {
    id: 'stop-13',
    name: 'Chettinad College',
    location: { latitude: 10.939604, longitude: 78.134679, timestamp: Date.now() },
    busId: 'bus-1',
    order: 13,
  },
];

async function seedExistingBusRoute() {
  try {
    console.log('🚌 Seeding existing Bus-1 route and data...\n');

    // Step 1: Create the route
    console.log('📍 Step 1: Creating route...');
    const routeData = {
      id: 'route-1',
      name: 'Main College Route',
      description: 'Mallapuram to Chettinad College via multiple stops',
      stops: busStops,
      distance: 45, // Approximate distance in km
      estimatedDuration: 90, // Approximate duration in minutes
      isActive: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await firestore.collection('routes').doc('route-1').set(routeData);
    console.log('✅ Route created: route-1\n');

    // Step 2: Get driver info if exists
    console.log('👨‍✈️ Step 2: Checking for existing driver...');
    let driverId = undefined;
    let driverName = undefined;
    
    const driversSnapshot = await firestore
      .collection('users')
      .where('role', '==', 'driver')
      .where('bus', '==', 'bus-1')
      .limit(1)
      .get();

    if (!driversSnapshot.empty) {
      const driverDoc = driversSnapshot.docs[0];
      driverId = driverDoc.id;
      driverName = driverDoc.data().fullName;
      console.log(`✅ Found driver: ${driverName} (${driverId})\n`);
    } else {
      console.log('⚠️  No driver found for bus-1 yet\n');
    }

    // Step 3: Create the bus
    console.log('🚌 Step 3: Creating bus...');
    
    // Count existing students on bus-1
    const studentsSnapshot = await firestore
      .collection('users')
      .where('role', '==', 'student')
      .where('bus', '==', 'bus-1')
      .where('isApproved', '==', true)
      .get();
    
    const currentStudents = studentsSnapshot.size;

    const busData = {
      id: 'bus-1',
      name: 'Bus A - Route 1',
      number: 'TN-01-AB-1234',
      routeId: 'route-1',
      driverId: driverId,
      driverName: driverName,
      capacity: 50,
      currentStudents: currentStudents,
      isActive: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await firestore.collection('buses').doc('bus-1').set(busData);
    console.log(`✅ Bus created: bus-1 (${currentStudents} students enrolled)\n`);

    // Step 4: Update bus stops (if not already seeded)
    console.log('🛑 Step 4: Ensuring bus stops exist...');
    let stopsCreated = 0;
    for (const stop of busStops) {
      const stopRef = firestore.collection('busStops').doc(stop.id);
      const stopDoc = await stopRef.get();
      
      if (!stopDoc.exists) {
        await stopRef.set({
          ...stop,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        stopsCreated++;
      }
    }
    console.log(`✅ Bus stops verified (${stopsCreated} created, ${busStops.length - stopsCreated} already existed)\n`);

    // Step 5: Update existing students to have isApproved field
    console.log('👨‍🎓 Step 5: Updating existing students...');
    const allStudentsSnapshot = await firestore
      .collection('users')
      .where('role', '==', 'student')
      .get();

    const batch = firestore.batch();
    let studentsUpdated = 0;
    
    for (const studentDoc of allStudentsSnapshot.docs) {
      const studentData = studentDoc.data();
      if (studentData.isApproved === undefined) {
        // Existing students are auto-approved
        batch.update(studentDoc.ref, {
          isApproved: true,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        studentsUpdated++;
      }
    }
    
    if (studentsUpdated > 0) {
      await batch.commit();
      console.log(`✅ Updated ${studentsUpdated} existing students\n`);
    } else {
      console.log('✅ All students already have approval status\n');
    }

    console.log('╔═══════════════════════════════════════════════════════╗');
    console.log('║                                                       ║');
    console.log('║   ✅ Existing Bus-1 Data Migrated Successfully!      ║');
    console.log('║                                                       ║');
    console.log('╚═══════════════════════════════════════════════════════╝\n');

    console.log('📊 Summary:');
    console.log(`   Route:    route-1 (Main College Route)`);
    console.log(`   Bus:      bus-1 (${currentStudents} students)`);
    console.log(`   Stops:    ${busStops.length} stops`);
    console.log(`   Driver:   ${driverName || 'Not assigned yet'}\n`);

    console.log('🎉 Your existing bus-1 route has been preserved and enhanced!');

    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Error seeding bus route:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  }
}

// Run the script
seedExistingBusRoute();
