
import { getApps, initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { firebaseConfig } from './config';

export function getAdminFirestore() {
    const apps = getApps();
    const app = apps.length ? apps[0] : initializeApp(firebaseConfig);
    const firestore = getFirestore(app);
    return firestore;
}

export function getAdminStorage() {
    const apps = getApps();
    const app = apps.length ? apps[0] : initializeApp(firebaseConfig);
    return getStorage(app);
}
