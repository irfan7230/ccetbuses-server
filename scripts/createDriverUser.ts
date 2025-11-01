import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

// Firebase web config from your .env
const firebaseConfig = {
  apiKey: "AIzaSyAlXn9eXN8J2KoM50BDJRt9tVc1zY0aMfk",
  authDomain: "sundhara-travels-32ffe.firebaseapp.com",
  projectId: "sundhara-travels-32ffe",
  storageBucket: "sundhara-travels-32ffe.firebasestorage.app",
  messagingSenderId: "160905402764",
  appId: "1:160905402764:web:b37311752095ac14c4dea9",
  measurementId: "G-8PVPLCL96X"
};

// Driver credentials
const driverEmail = 'driver@esmbuses.com';
const driverPassword = 'ccet@busesm';
const driverData = {
  email: driverEmail,
  fullName: 'Sundhara Bus Driver',
  role: 'driver',
  bus: 'bus-1',
  phone: '+91 9876543210',
  createdAt: new Date(),
  updatedAt: new Date(),
};

async function createDriverUser() {
  try {
    console.log('🚌 Creating driver user in Firebase...\n');

    // Initialize Firebase Web SDK
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);

    // Create authentication user
    console.log('📧 Creating authentication user...');
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      driverEmail,
      driverPassword
    );
    
    const userId = userCredential.user.uid;
    console.log(`✅ Authentication user created: ${userId}\n`);

    // Create Firestore user document
    console.log('📄 Creating Firestore user document...');
    await setDoc(doc(db, 'users', userId), driverData);
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
    if (error.code === 'auth/email-already-in-use') {
      console.log('\n⚠️  User already exists!');
      console.log('\n📋 Driver Credentials:');
      console.log(`   Email:    ${driverEmail}`);
      console.log(`   Password: ${driverPassword}`);
      console.log(`   Role:     driver`);
      console.log(`   Bus:      bus-1\n`);
      console.log('✅ You can login with these credentials in the app!');
    } else {
      console.error('\n❌ Error creating driver user:', error.message);
      console.error('\nFull error:', error);
    }
    process.exit(1);
  }
}

// Run the script
createDriverUser();
