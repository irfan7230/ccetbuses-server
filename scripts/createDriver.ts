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

const auth = admin.auth();
const firestore = admin.firestore();

// Driver credentials
const driverEmail = 'driver@ccetbuses.com';
const driverPassword = 'ccet@busesm';
const driverData = {
  email: driverEmail,
  fullName: 'Sundhara Bus Driver',
  role: 'driver',
  bus: 'bus-1',
  phone: '+91 9876543210',
  isProfileComplete: true,
  isApproved: true, // Drivers are pre-approved
  createdAt: admin.firestore.FieldValue.serverTimestamp(),
  updatedAt: admin.firestore.FieldValue.serverTimestamp(),
};

async function createDriverUser() {
  try {
    console.log('🚌 Creating driver user in Firebase...\n');

    // Create authentication user
    console.log('📧 Creating authentication user...');
    const userRecord = await auth.createUser({
      email: driverEmail,
      password: driverPassword,
      emailVerified: true,
      displayName: 'Sundhara Bus Driver',
    });

    const userId = userRecord.uid;
    console.log(`✅ Authentication user created: ${userId}\n`);

    // Create Firestore user document
    console.log('📄 Creating Firestore user document...');
    await firestore.collection('users').doc(userId).set(driverData);
    console.log('✅ Firestore document created\n');

    console.log('╔═══════════════════════════════════════════════════════╗');
    console.log('║                                                       ║');
    console.log('║   ✅ Driver User Created Successfully!               ║');
    console.log('║                                                       ║');
    console.log('╚═══════════════════════════════════════════════════════╝\n');

    console.log('📋 Driver Credentials:');
    console.log(`   Email:    ${driverEmail}`);
    console.log(`   Password: ${driverPassword}`);
    console.log(`   UID:      ${userId}`);
    console.log(`   Role:     driver`);
    console.log(`   Bus:      bus-1\n`);

    console.log('🎉 You can now login with these credentials in the app!');

    process.exit(0);
  } catch (error: any) {
    if (error.code === 'auth/email-already-exists') {
      console.log('\n⚠️  User already exists!');
      console.log('\n📋 Driver Credentials:');
      console.log(`   Email:    ${driverEmail}`);
      console.log(`   Password: ${driverPassword}`);
      console.log(`   Role:     driver`);
      console.log(`   Bus:      bus-1\n`);
      console.log('✅ You can login with these credentials in the app!');
      process.exit(0);
    } else {
      console.error('\n❌ Error creating driver user:', error.message);
      console.error('\nFull error:', error);
      process.exit(1);
    }
  }
}

// Run the script
createDriverUser();
