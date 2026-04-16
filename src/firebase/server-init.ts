
import * as admin from 'firebase-admin';

export function getAdminFirestore() {
    if (admin.apps.length === 0) {
        admin.initializeApp({
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        });
    }
    return admin.firestore();
}

export function getAdminStorage() {
    if (admin.apps.length === 0) {
        admin.initializeApp({
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        });
    }
    return admin.storage();
}
