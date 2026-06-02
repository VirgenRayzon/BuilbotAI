import { initializeApp as initializeClientApp } from 'firebase/app';
import { getAuth as getClientAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import { authenticateSystemAccessAction } from '../src/app/actions';

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

// Initialize Admin SDK (if not already done inside any imports)
if (admin.apps.length === 0) {
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
}

const adminAuth = admin.auth();
const adminDb = admin.firestore();

async function runTests() {
  const email = `test-server-actions-${Date.now()}@buildbotai.com`;
  const password = "password123";
  let userId: string | null = null;
  const tempManagerKey = `test-manager-${Date.now()}`;
  const tempSuperAdminKey = `test-super-${Date.now()}`;

  try {
    // 1. Create temporary auth keys in firestore using Admin SDK
    console.log(`[1] Creating temporary auth keys: ${tempManagerKey} (manager) and ${tempSuperAdminKey} (superadmin)...`);
    await adminDb.collection('authKeys').doc(tempManagerKey).set({ role: 'manager' });
    await adminDb.collection('authKeys').doc(tempSuperAdminKey).set({ role: 'superadmin' });
    console.log(`[1] Keys created successfully.`);

    // 2. Register a new test user
    console.log(`[2] Registering test user: ${email}...`);
    const userCredential = await createUserWithEmailAndPassword(clientAuth, email, password);
    const user = userCredential.user;
    userId = user.uid;
    console.log(`[2] Test user registered. UID: ${userId}`);

    // Get client ID Token
    const idToken = await user.getIdToken();

    // 3. Test authenticateSystemAccessAction with incorrect key
    console.log(`[3] Testing authenticateSystemAccessAction with incorrect key...`);
    const badKeyRes = await authenticateSystemAccessAction(idToken, 'invalid-key-xyz', 'manager');
    console.log(`[3] Result:`, badKeyRes);
    if (badKeyRes.error) {
      console.log(`✅ SUCCESS: Incorrect key was rejected: "${badKeyRes.error}"`);
    } else {
      console.error(`❌ FAILURE: Incorrect key was accepted!`);
    }

    // 4. Test authenticateSystemAccessAction with valid manager key
    console.log(`[4] Testing authenticateSystemAccessAction with valid manager key...`);
    const goodKeyRes = await authenticateSystemAccessAction(idToken, tempManagerKey, 'manager');
    console.log(`[4] Result:`, goodKeyRes);
    if (goodKeyRes.success) {
      console.log(`✅ SUCCESS: Valid manager key was accepted!`);
      
      // Verify user document has been updated
      const userDoc = await adminDb.collection('users').doc(userId).get();
      const userData = userDoc.data();
      console.log(`[4] User document in Firestore:`, userData);
      if (userData?.isManager === true && userData?.activeManagerKey === tempManagerKey) {
        console.log(`✅ SUCCESS: Firestore profile fields (isManager, activeManagerKey) set correctly!`);
      } else {
        console.error(`❌ FAILURE: Firestore profile fields not updated correctly!`);
      }

      // Verify custom claims on auth
      const userRecord = await adminAuth.getUser(userId);
      console.log(`[4] User custom claims:`, userRecord.customClaims);
      if (userRecord.customClaims?.isManager === true) {
        console.log(`✅ SUCCESS: Custom claims 'isManager: true' set successfully!`);
      } else {
        console.error(`❌ FAILURE: Custom claims 'isManager' not set!`);
      }
    } else {
      console.error(`❌ FAILURE: Valid manager key was rejected:`, goodKeyRes.error);
    }

    // 5. Test authenticateSystemAccessAction as Super Admin (should verify key and user role)
    // Note: To be authenticated as a superadmin, the user document must already have isSuperAdmin: true.
    // Let's set that on the profile first, then try authenticating.
    console.log(`[5] Setting isSuperAdmin: true in user document to allow super admin authentication...`);
    await adminDb.collection('users').doc(userId).update({ isSuperAdmin: true });

    // Refresh ID Token to pick up changes (if any) or just pass it
    const idToken2 = await user.getIdToken(true);

    console.log(`[6] Testing authenticateSystemAccessAction with incorrect super admin key...`);
    const badSaKeyRes = await authenticateSystemAccessAction(idToken2, 'invalid-super-key', 'superadmin');
    console.log(`[6] Result:`, badSaKeyRes);
    if (badSaKeyRes.error) {
      console.log(`✅ SUCCESS: Incorrect super admin key was rejected: "${badSaKeyRes.error}"`);
    } else {
      console.error(`❌ FAILURE: Incorrect super admin key was accepted!`);
    }

    console.log(`[7] Testing authenticateSystemAccessAction with valid super admin key...`);
    const goodSaKeyRes = await authenticateSystemAccessAction(idToken2, tempSuperAdminKey, 'superadmin');
    console.log(`[7] Result:`, goodSaKeyRes);
    if (goodSaKeyRes.success) {
      console.log(`✅ SUCCESS: Valid super admin key was accepted!`);

      // Verify custom claims on auth
      const userRecord = await adminAuth.getUser(userId);
      console.log(`[7] User custom claims:`, userRecord.customClaims);
      if (userRecord.customClaims?.isSuperAdmin === true && userRecord.customClaims?.isManager === true) {
        console.log(`✅ SUCCESS: Custom claims 'isSuperAdmin: true, isManager: true' set successfully!`);
      } else {
        console.error(`❌ FAILURE: Custom claims not set correctly!`);
      }
    } else {
      console.error(`❌ FAILURE: Valid super admin key was rejected:`, goodSaKeyRes.error);
    }

  } catch (error) {
    console.error("Test execution failed:", error);
  } finally {
    console.log(`[Cleanup] Cleaning up temporary keys and test user...`);
    try {
      await adminDb.collection('authKeys').doc(tempManagerKey).delete();
      await adminDb.collection('authKeys').doc(tempSuperAdminKey).delete();
      if (userId) {
        await adminAuth.deleteUser(userId);
        await adminDb.collection('users').doc(userId).delete();
      }
      console.log(`[Cleanup] Cleanup completed successfully.`);
    } catch (cleanupErr) {
      console.error("Cleanup failed:", cleanupErr);
    }
    process.exit(0);
  }
}

runTests();
