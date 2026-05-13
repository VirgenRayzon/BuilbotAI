import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';

dotenv.config();

// Initialize Firebase Admin
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.applicationDefault()
    });
}

const db = admin.firestore();

async function migrate() {
    console.log("Starting migration of SystemNotifications to AuditLogs...");
    
    const notificationsSnap = await db.collection('system_notifications').get();
    console.log(`Found ${notificationsSnap.size} system notifications.`);

    const batch = db.batch();
    let count = 0;

    for (const d of notificationsSnap.docs) {
        const notif = d.data();
        let actionName = 'other';
        let resourceType = 'System';
        
        if (notif.type === 'item_archived') {
            actionName = notif.title?.includes('Restored') ? 'restored' : 'archived';
            resourceType = notif.title?.includes('Prebuilt') ? 'Prebuilt' : 'Part';
        } else if (notif.type === 'status_changed') {
            actionName = 'status_changed';
            resourceType = 'Order';
        } else if (notif.type === 'user_cancelled') {
            actionName = 'status_changed';
            resourceType = 'Order';
        }

        let resourceName = notif.targetId || 'Unknown Resource';
        if (notif.message?.includes(': ')) {
            const parts = notif.message.split(': ');
            if (parts.length > 1) {
                resourceName = parts.slice(1).join(': ');
            }
        } else if (notif.title === 'Reservation Cancelled') {
            const emailMatch = notif.message?.match(/user (.*?) has/);
            if (emailMatch && emailMatch[1]) {
                 resourceName = `Order from ${emailMatch[1]}`;
            }
        }

        const auditRef = db.collection('auditLogs').doc();
        batch.set(auditRef, {
            id: auditRef.id,
            actionName,
            actorId: notif.actorId || 'system',
            actorName: notif.actorName || 'System',
            resourceType,
            resourceName,
            resourceId: notif.targetId || null,
            details: notif.message || '',
            createdAt: notif.createdAt || admin.firestore.FieldValue.serverTimestamp()
        });

        count++;

        if (count % 400 === 0) {
            await batch.commit();
            console.log(`Committed ${count} logs...`);
        }
    }
    
    if (count % 400 !== 0) {
        await batch.commit();
    }

    console.log(`Migration complete. Successfully migrated ${count} logs.`);
}

migrate()
    .then(() => process.exit(0))
    .catch(err => {
        console.error("Migration failed:", err);
        process.exit(1);
    });
