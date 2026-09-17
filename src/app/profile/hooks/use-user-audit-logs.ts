"use client";

import { useMemo } from 'react';
import { useFirestore } from '@/firebase';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, query, orderBy, where } from 'firebase/firestore';
import type { UserAuditLog } from '@/lib/types';
import { useUserProfile } from '@/context/user-profile';

export function useUserAuditLogs() {
    const firestore = useFirestore();
    const { authUser } = useUserProfile();

    const userAuditLogsQuery = useMemo(() => {
        if (!firestore || !authUser?.uid) return null;
        return query(
            collection(firestore, 'user_auditLogs'),
            where('userId', '==', authUser.uid)
        );
    }, [firestore, authUser?.uid]);

    const { data: rawLogs, loading } = useCollection<UserAuditLog>(userAuditLogsQuery);

    const logs = useMemo(() => {
        if (!rawLogs) return [];
        return [...rawLogs].sort((a, b) => {
            const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
            const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
            return timeB - timeA;
        });
    }, [rawLogs]);

    return {
        logs,
        loading
    };
}
