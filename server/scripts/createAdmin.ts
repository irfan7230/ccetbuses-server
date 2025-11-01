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

// Admin credentials
const adminEmail = 'admin@ccetbuses.com';
const adminPassword = 'Miirfan@72';
const adminData = {
  email: adminEmail,
  fullName: 'Sundhara Admin',
  role: 'admin',
  phone: '+91 9876543210',
  isProfileComplete: true,
  isApproved: true, // Admin is always approved
  createdAt: admin.firestore.FieldValue.serverTimestamp(),
  updatedAt: admin.firestore.FieldValue.serverTimestamp(),
};

async function createAdminUser() {
  try {
    console.log('🔐 Creating admin user in Firebase...\n');

    // Create authentication user
    console.log('📧 Creating authentication user...');
    const userRecord = await auth.createUser({
      email: adminEmail,
      password: adminPassword,
      emailVerified: true,
      displayName: 'Sundhara Admin',
    });

    const userId = userRecord.uid;
    console.log(`✅ Authentication user created: ${userId}\n`);

    // Create Firestore user document
    console.log('📄 Creating Firestore user document...');
    await firestore.collection('users').doc(userId).set(adminData);
    console.log('✅ Firestore document created\n');

    console.log('╔═══════════════════════════════════════════════════════╗');
    console.log('║                                                       ║');
    console.log('║   ✅ Admin User Created Successfully!                ║');
    console.log('║                                                       ║');
    console.log('╚═══════════════════════════════════════════════════════╝\n');

    console.log('📋 Admin Credentials:');
    console.log(`   Email:    ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);
    console.log(`   UID:      ${userId}`);
    console.log(`   Role:     admin\n`);

    console.log('🎉 You can now login with these credentials in the app!');
    console.log('⚠️  IMPORTANT: Change the password after first login!\n');

    process.exit(0);
  } catch (error: any) {
    if (error.code === 'auth/email-already-exists') {
      console.log('\n⚠️  Admin user already exists!');
      console.log('\n📋 Admin Credentials:');
      console.log(`   Email:    ${adminEmail}`);
      console.log(`   Password: ${adminPassword}`);
      console.log(`   Role:     admin\n`);
      console.log('✅ You can login with these credentials in the app!');
      process.exit(0);
    } else {
      console.error('\n❌ Error creating admin user:', error.message);
      console.error('\nFull error:', error);
      process.exit(1);
    }
  }
}

// Run the script
createAdminUser();
