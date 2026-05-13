"use client";

import { useMemo } from 'react';
import { useFirestore } from '@/firebase';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, query, orderBy } from 'firebase/firestore';
import type { AuditLog } from '@/lib/types';

export function useAuditLogs() {
    const firestore = useFirestore();

    const auditLogsQuery = useMemo(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'auditLogs'), orderBy('createdAt', 'desc'));
    }, [firestore]);

    const { data: rawAuditLogs, loading: auditLogsLoading } = useCollection<AuditLog>(auditLogsQuery);

    const auditLogs = useMemo(() => {
        // We only want the last 90 days of logs per requirements
        const now = new Date();
        const ninetyDaysAgo = new Date(now.getTime() - (90 * 24 * 60 * 60 * 1000));
        
        return rawAuditLogs?.filter(log => {
            const logDate = log.createdAt?.toDate?.() || log.createdAt;
            if (!logDate) return false;
            return new Date(logDate) >= ninetyDaysAgo;
        }) || [];
    }, [rawAuditLogs]);

    return {
        auditLogs,
        auditLogsLoading
    };
}
