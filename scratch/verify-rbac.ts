import { initializeApp as initializeClientApp } from 'firebase/app';
import { getAuth as getClientAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore as getClientFirestore, doc as clientDoc, updateDoc as clientUpdateDoc } from 'firebase/firestore';
import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';

dotenv.config();

// Initialize Client SDK
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const clientApp = initializeClientApp(firebaseConfig);
const clientAuth = getClientAuth(clientApp);
const clientDb = getClientFirestore(clientApp);

// Initialize Admin SDK
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
if (!serviceAccount) {
  console.error("Missing FIREBASE_SERVICE_ACCOUNT environment variable.");
  process.exit(1);
}

const cert = JSON.parse(Buffer.from(serviceAccount, 'base64').toString('utf8'));
admin.initializeApp({
  credential: admin.credential.cert(cert),
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
});

const adminAuth = admin.auth();
const adminDb = admin.firestore();

async function runTests() {
  const email = `test-rbac-${Date.now()}@buildbotai.com`;
  const password = "password123";
  let userId: string | null = null;

  try {
    console.log(`[1] Creating client user with email: ${email}...`);
    const userCredential = await createUserWithEmailAndPassword(clientAuth, email, password);
    userId = userCredential.user.uid;
    console.log(`[1] User created. UID: ${userId}`);

    // Create user profile as standard user (must not have isManager or isSuperAdmin)
    console.log(`[2] Initializing standard user profile in Firestore...`);
    await adminDb.collection('users').doc(userId).set({
      email,
      isManager: false,
      isSuperAdmin: false,
      createdAt: new Date().toISOString()
    });
    console.log(`[2] Profile initialized successfully.`);

    // Test Privilege Escalation via Client SDK
    console.log(`[3] Attempting to self-promote to isManager = true via Client SDK...`);
    const clientUserDocRef = clientDoc(clientDb, 'users', userId);
    
    let escalated = false;
    try {
      await clientUpdateDoc(clientUserDocRef, {
        isManager: true
      });
      escalated = true;
    } catch (err: any) {
      console.log(`[3] Caught expected error: ${err.message}`);
      if (err.code === 'permission-denied') {
        console.log(`\n✅ SUCCESS: Privilege escalation to 'isManager' was successfully BLOCKED by Firestore rules!\n`);
      } else {
        console.log(`\n⚠️ WARNING: Write failed with unexpected error code: ${err.code}\n`);
      }
    }

    if (escalated) {
      console.error(`\n❌ SECURITY FAILURE: The client was able to self-promote to 'isManager'!\n`);
    }

    // Test Privilege Escalation for activeManagerKey
    console.log(`[4] Attempting to set activeManagerKey via Client SDK...`);
    let keyEscalated = false;
    try {
      await clientUpdateDoc(clientUserDocRef, {
        activeManagerKey: 'some-key'
      });
      keyEscalated = true;
    } catch (err: any) {
      console.log(`[4] Caught expected error: ${err.message}`);
      if (err.code === 'permission-denied') {
        console.log(`\n✅ SUCCESS: Privilege escalation to 'activeManagerKey' was successfully BLOCKED by Firestore rules!\n`);
      } else {
        console.log(`\n⚠️ WARNING: Write failed with unexpected error code: ${err.code}\n`);
      }
    }

    if (keyEscalated) {
      console.error(`\n❌ SECURITY FAILURE: The client was able to modify 'activeManagerKey'!\n`);
    }

  } catch (error) {
    console.error("Test execution failed:", error);
  } finally {
    if (userId) {
      console.log(`[Cleanup] Deleting test user ${userId} from Auth and Firestore...`);
      try {
        await adminAuth.deleteUser(userId);
        await adminDb.collection('users').doc(userId).delete();
        console.log(`[Cleanup] Deleted test user successfully.`);
      } catch (cleanupErr) {
        console.error("Cleanup failed:", cleanupErr);
      }
    }
    process.exit(0);
  }
}

runTests();
