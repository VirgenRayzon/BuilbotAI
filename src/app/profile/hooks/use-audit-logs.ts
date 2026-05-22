"use client";

import { useMemo } from 'react';
import { useFirestore } from '@/firebase';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, query, orderBy, where } from 'firebase/firestore';
import type { AuditLog } from '@/lib/types';

export function useAuditLogs() {
    const firestore = useFirestore();

    const auditLogsQuery = useMemo(() => {
        if (!firestore) return null;
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
        return query(
            collection(firestore, 'auditLogs'),
            where('createdAt', '>=', ninetyDaysAgo),
            orderBy('createdAt', 'desc')
        );
    }, [firestore]);

    const { data: rawAuditLogs, loading: auditLogsLoading } = useCollection<AuditLog>(auditLogsQuery);

    const auditLogs = useMemo(() => {
        return rawAuditLogs?.map(log => ({
            ...log,
            scope: log.scope || (log as any).resourceType
        })) || [];
    }, [rawAuditLogs]);

    return {
        auditLogs,
        auditLogsLoading
    };
}
