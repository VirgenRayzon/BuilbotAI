
'use client';
import { getApps, initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { firebaseConfig } from './config';

export function initializeFirebase() {
  const useEmulators = process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_FIREBASE_USE_EMULATORS === 'true';
  if (useEmulators && !firebaseConfig.projectId?.startsWith('demo-')) throw new Error('Emulator mode requires a demo Firebase project.');
  const apps = getApps();
  const app = apps.length ? apps[0] : initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const firestore = getFirestore(app);
  const storage = getStorage(app);
  if (!apps.length && useEmulators) {
    connectAuthEmulator(auth, 'http://127.0.0.1:9098', { disableWarnings: true });
    connectFirestoreEmulator(firestore, '127.0.0.1', 8088);
  }

  return { firebaseApp: app, auth, firestore, storage };
}
