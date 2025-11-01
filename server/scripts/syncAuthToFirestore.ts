import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as readline from 'readline';

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

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query: string): Promise<string> {
  return new Promise(resolve => rl.question(query, resolve));
}

async function syncAuthToFirestore() {
  try {
    console.log('🔍 Checking for Auth users without Firestore documents...\n');

    // Get all users from Authentication
    const authUsers = await auth.listUsers();
    
    if (authUsers.users.length === 0) {
      console.log('⚠️  No users found in Authentication.');
      process.exit(0);
    }

    console.log(`📊 Found ${authUsers.users.length} user(s) in Authentication\n`);

    let syncedCount = 0;
    let skippedCount = 0;

    for (const authUser of authUsers.users) {
      const uid = authUser.uid;
      const email = authUser.email || 'no-email@example.com';

      // Check if Firestore document exists
      const userDoc = await firestore.collection('users').doc(uid).get();

      if (userDoc.exists) {
        console.log(`✅ ${email} - Firestore document exists`);
        skippedCount++;
        continue;
      }

      console.log(`\n⚠️  ${email} - Missing Firestore document`);
      console.log(`   UID: ${uid}`);

      // Ask for user role
      const role = await question('   Enter role (driver/student): ');
      
      if (role !== 'driver' && role !== 'student') {
        console.log('   ❌ Invalid role. Skipping...\n');
        continue;
      }

      const fullName = await question('   Enter full name: ');
      const bus = await question('   Enter bus (e.g., bus-1): ');
      let busStop = '';
      
      if (role === 'student') {
        busStop = await question('   Enter bus stop: ');
      }

      const phone = await question('   Enter phone (optional): ');

      // Create Firestore document
      const userData = {
        email,
        fullName: fullName || 'User',
        role,
        bus: bus || 'bus-1',
        ...(busStop && { busStop }),
        ...(phone && { phone }),
        isProfileComplete: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      await firestore.collection('users').doc(uid).set(userData);
      console.log(`   ✅ Firestore document created!\n`);
      syncedCount++;
    }

    console.log('\n╔═══════════════════════════════════════════════════════╗');
    console.log('║                                                       ║');
    console.log('║   ✅ Sync Complete!                                  ║');
    console.log('║                                                       ║');
    console.log('╚═══════════════════════════════════════════════════════╝\n');

    console.log(`📊 Summary:`);
    console.log(`   Synced: ${syncedCount}`);
    console.log(`   Skipped (already exists): ${skippedCount}`);
    console.log(`   Total: ${authUsers.users.length}\n`);

    console.log('🎉 You can now login with these users!');

    rl.close();
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Error syncing users:', error.message);
    console.error('\nFull error:', error);
    rl.close();
    process.exit(1);
  }
}

// Run the script
syncAuthToFirestore();
