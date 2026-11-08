import { collection, doc, Firestore, setDoc, getDocs, writeBatch } from "firebase/firestore";
import type { AuditLog, UserAuditLog, SystemNotification } from "@/lib/types";

export async function createAuditLog(firestore: Firestore, data: Omit<AuditLog, 'id' | 'createdAt'>) {
    const auditRef = doc(collection(firestore, 'auditLogs'));
    const auditLog: AuditLog = {
        ...data,
        id: auditRef.id,
        createdAt: new Date()
    };
    await setDoc(auditRef, auditLog);
}

export async function createUserAuditLog(firestore: Firestore, data: Omit<UserAuditLog, 'id' | 'createdAt'>) {
    const logRef = doc(collection(firestore, 'user_auditLogs'));
    const userLog: UserAuditLog = {
        ...data,
        id: logRef.id,
        createdAt: new Date()
    };
    await setDoc(logRef, userLog);
}

export async function migrateNotificationsToAuditLogs(firestore: Firestore) {
    const notificationsSnap = await getDocs(collection(firestore, 'system_notifications'));
    const notifications = notificationsSnap.docs.map(d => ({ id: d.id, ...d.data() } as SystemNotification));

    const batch = writeBatch(firestore);
    let count = 0;

    for (const notif of notifications) {
        let actionName: AuditLog['actionName'] = 'other';
        let scope: AuditLog['scope'] = 'System';

        if (notif.type === 'item_archived') {
            actionName = notif.title.includes('Restored') ? 'restored' : 'archived';
            scope = notif.title.includes('Prebuilt') ? 'Prebuilt' : 'Part';
        } else if (notif.type === 'status_changed') {
            actionName = 'status_changed';
            scope = 'Order';
        } else if (notif.type === 'user_cancelled') {
            actionName = 'status_changed';
            scope = 'Order';
        }

        let resourceName = notif.targetId;
        if (notif.message.includes(': ')) {
            const parts = notif.message.split(': ');
            if (parts.length > 1) {
                resourceName = parts.slice(1).join(': ');
            }
        } else if (notif.title === 'Reservation Cancelled') {
            const emailMatch = notif.message.match(/user (.*?) has/);
            if (emailMatch && emailMatch[1]) {
                 resourceName = `Order from ${emailMatch[1]}`;
            }
        }

        const auditRef = doc(collection(firestore, 'auditLogs'));
        const auditData: AuditLog = {
            id: auditRef.id,
            actionName,
            actorId: notif.actorId || 'system',
            actorName: notif.actorName || 'System',
            scope,
            resourceName,
            resourceId: notif.targetId,
            details: notif.message,
            createdAt: notif.createdAt
        };

        batch.set(auditRef, auditData);
        count++;

        if (count % 500 === 0) {
            await batch.commit();
        }
    }

    if (count % 500 !== 0) {
        await batch.commit();
    }

    console.log(`Migrated ${count} SystemNotifications to AuditLogs.`);
}
