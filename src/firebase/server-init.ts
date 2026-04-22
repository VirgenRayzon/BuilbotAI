
import * as admin from 'firebase-admin';

function initializeAdmin() {
    if (admin.apps.length > 0) return;

    try {
        const serviceAccount = process.env.FB_SERVICE_ACCOUNT || process.env.FIREBASE_SERVICE_ACCOUNT;
        const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
        
        console.log("[Firebase Admin] Attempting initialization...");
        console.log("[Firebase Admin] Project ID:", projectId);
        console.log("[Firebase Admin] Service Account Env exists:", !!serviceAccount);

        if (serviceAccount && serviceAccount !== "") {
            try {
                let cert;
                if (serviceAccount.trim().startsWith('{')) {
                    // Raw JSON
                    cert = JSON.parse(serviceAccount);
                } else {
                    // Assume Base64
                    const decoded = Buffer.from(serviceAccount, 'base64').toString('utf8');
                    cert = JSON.parse(decoded);
                }
                
                admin.initializeApp({
                    credential: admin.credential.cert(cert),
                    projectId: projectId,
                    storageBucket: `${projectId}.firebasestorage.app`
                });
                console.log("[Firebase Admin] Initialized with service account from environment.");
            } catch (jsonError) {
                console.error("[Firebase Admin] JSON Parse Error Detail:", jsonError);
                throw new Error("Invalid FB_SERVICE_ACCOUNT JSON format.");
            }
        } else {
            console.warn("[Firebase Admin] No FB_SERVICE_ACCOUNT found. Falling back to default credentials.");
            // Fallback to default credentials (works in GCP environments like Vercel/Firebase Functions)
            admin.initializeApp({
                projectId: projectId,
                storageBucket: `${projectId}.firebasestorage.app`
            });
            console.log("[Firebase Admin] Initialized with default credentials (likely to fail locally).");
        }
    } catch (error) {
        console.error("[Firebase Admin] Initialization failed:", error);
        throw error;
    }
}

export function getAdminFirestore() {
    initializeAdmin();
    return admin.firestore();
}

export function getAdminStorage() {
    initializeAdmin();
    return admin.storage();
}
