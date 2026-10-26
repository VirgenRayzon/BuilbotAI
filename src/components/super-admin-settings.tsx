'use client';

import { useState, useEffect } from 'react';
import {
    Paper,
    Title,
    Text,
    Badge,
    Button,
    Group,
    Stack,
    ThemeIcon,
    PasswordInput,
} from '@mantine/core';
import { CompactInfo } from '@/components/ui/compact-info';
import { useFirestore, useAuth } from '@/firebase';
import {
    collection,
    query,
    where,
    getDocs,
    doc,
    setDoc,
    deleteDoc,
    onSnapshot,
    updateDoc,
    serverTimestamp,
    limit,
    arrayUnion,
} from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Check, X, RefreshCw, Mail, Key, Shield } from 'lucide-react';
import { useUserProfile } from '@/context/user-profile';
import { createAuditLog } from '@/firebase/audit';
import { listManagerAccountsAction } from '@/app/actions';

export function SuperAdminSettings() {
    const [managerKey, setManagerKey] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [originalManagerDocId, setOriginalManagerDocId] = useState<string | null>(null);
    const [requests, setRequests] = useState<any[]>([]);
    const [managers, setManagers] = useState<any[]>([]);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const firestore = useFirestore();
    const auth = useAuth();
    const { toast } = useToast();
    const { profile } = useUserProfile();

    useEffect(() => {
        async function fetchKeys() {
            if (!firestore) return;
            try {
                const keysRef = collection(firestore, 'authKeys');
                const snapshot = await getDocs(query(keysRef));

                snapshot.forEach((docSnap) => {
                    const data = docSnap.data();
                    if (data.role === 'manager') {
                        setManagerKey(docSnap.id);
                        setOriginalManagerDocId(docSnap.id);
                    }
                });
            } catch (err) {
                console.error("Error fetching keys:", err);
                toast({
                    title: "Error fetching keys",
                    variant: "destructive"
                });
            } finally {
                setLoading(false);
            }
        }
        fetchKeys();
    }, [firestore, toast]);

    useEffect(() => {
        if (!firestore) return;
        const q = query(
            collection(firestore, 'keyRequests'),
            where('status', '==', 'pending')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const reqs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            reqs.sort((a: any, b: any) => {
                const dateA = a.requestedAt?.toDate() || 0;
                const dateB = b.requestedAt?.toDate() || 0;
                return dateB - dateA;
            });
            setRequests(reqs);
        }, (err) => {
            console.error("Error listening to requests:", err);
        });

        return () => unsubscribe();
    }, [firestore]);

    useEffect(() => {
        if (!auth?.currentUser || !profile?.isSuperAdmin) return;
        let active = true;

        async function fetchManagers() {
            try {
                const token = await auth!.currentUser!.getIdToken();
                const result = await listManagerAccountsAction(token);
                if (active) setManagers(result.managers || []);
                if (result.error) console.error('Error loading managers:', result.error);
            } catch (err) {
                console.error('Error loading managers:', err);
            }
        }

        fetchManagers();
        return () => { active = false; };
    }, [auth, profile?.isSuperAdmin]);

    const handleSaveManagerKey = async () => {
        if (!firestore) return;
        if (!managerKey.trim()) {
            toast({ title: "Error", description: "Manager key cannot be empty", variant: "destructive" });
            return;
        }
        setSaving(true);
        try {
            if (originalManagerDocId && originalManagerDocId !== managerKey) {
                await deleteDoc(doc(firestore, 'authKeys', originalManagerDocId));
            }
            await setDoc(doc(firestore, 'authKeys', managerKey), { role: 'manager' });
            setOriginalManagerDocId(managerKey);
            toast({ title: "Success", description: "Manager Key updated successfully" });
        } catch (err) {
            console.error(err);
            toast({ title: "Error", description: "Failed to update Manager Key", variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    const handleApproveRequest = async (request: any) => {
        if (!firestore) return;
        const newKey = Math.floor(10000000 + Math.random() * 90000000).toString();
        setActionLoading(request.id);
        try {
            // Find manager by email
            const managerQuery = query(collection(firestore, 'users'), where('email', '==', request.email), limit(1));
            const managerSnap = await getDocs(managerQuery);

            if (!managerSnap.empty) {
                const managerDoc = managerSnap.docs[0];
                const managerData = managerDoc.data();
                const updates: any = {
                    activeManagerKey: newKey
                };
                if (managerData.activeManagerKey) {
                    updates.deprecatedKeys = arrayUnion(managerData.activeManagerKey);
                }
                await updateDoc(doc(firestore, 'users', managerDoc.id), updates);
            }

            await updateDoc(doc(firestore, 'keyRequests', request.id), {
                status: 'approved',
                newKey: newKey,
                processedAt: serverTimestamp()
            });

            await createAuditLog(firestore, {
                actionName: 'auth_update',
                actorId: profile?.id || 'unknown',
                actorName: profile?.name || profile?.email || 'Unknown User',
                actorEmail: profile?.email,
                scope: 'User',
                resourceName: request.email,
                details: `Approved key reset request for manager`
            });

            toast({
                title: "Request Approved",
                description: `New Key for ${request.email}: ${newKey}.`,
                duration: 10000
            });
        } catch (err) {
            console.error(err);
            toast({ title: "Error", description: "Failed to approve request", variant: "destructive" });
        } finally {
            setActionLoading(null);
        }
    };

    const handleResetManagerKey = async (manager: any) => {
        if (!firestore) return;
        const newKey = Math.floor(10000000 + Math.random() * 90000000).toString();
        setActionLoading(manager.id);
        try {
            const updates: any = {
                activeManagerKey: newKey
            };
            if (manager.activeManagerKey) {
                updates.deprecatedKeys = arrayUnion(manager.activeManagerKey);
            }
            await updateDoc(doc(firestore, 'users', manager.id), updates);

            await createAuditLog(firestore, {
                actionName: 'auth_update',
                actorId: profile?.id || 'unknown',
                actorName: profile?.name || profile?.email || 'Unknown User',
                actorEmail: profile?.email,
                scope: 'User',
                resourceName: manager.email,
                resourceId: manager.id,
                details: `Super Admin manually reset manager key`
            });

            toast({
                title: "Key Reset",
                description: `New Key for ${manager.email}: ${newKey}.`,
                duration: 10000
            });
        } catch (err) {
            console.error(err);
            toast({ title: "Error", description: "Failed to reset manager key", variant: "destructive" });
        } finally {
            setActionLoading(null);
        }
    };

    const handleRejectRequest = async (requestId: string) => {
        if (!firestore) return;
        setActionLoading(requestId);
        try {
            await updateDoc(doc(firestore, 'keyRequests', requestId), {
                status: 'rejected',
                processedAt: serverTimestamp()
            });
            toast({ title: "Request Rejected", description: "The key reset request has been rejected." });
        } catch (err) {
            console.error(err);
            toast({ title: "Error", description: "Failed to reject request", variant: "destructive" });
        } finally {
            setActionLoading(null);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-cyan-600 dark:text-cyan-400" />
            </div>
        );
    }

    return (
        <Stack gap="lg" className="w-full">
            <Paper
                withBorder
                radius="lg"
                p={{ base: 'md', sm: 'lg' }}
                className="border-slate-200 dark:border-white/10 bg-white dark:bg-[#111722] shadow-sm"
            >
                <Stack gap="md">
                    <Group gap="xs">
                        <ThemeIcon size="md" radius="md" color="cyan" variant="light">
                            <Key className="size-4" />
                        </ThemeIcon>
                        <Title order={4} className="text-base sm:text-lg font-bold font-headline text-slate-900 dark:text-white flex items-center gap-2">
                            <span>Default Manager Access Key</span>
                            <CompactInfo
                                label="About the default manager access key"
                                message="Manage the access key required for new manager signups."
                            />
                        </Title>
                    </Group>

                    <div className="flex flex-col gap-2">
                        <Text size="xs" fw={700} className="uppercase tracking-wider text-slate-700 dark:text-slate-300">
                            Manager Key
                        </Text>
                        <div className="flex flex-col sm:flex-row gap-2.5">
                            <PasswordInput
                                value={managerKey}
                                onChange={(e) => setManagerKey(e.target.value)}
                                placeholder="Enter Manager Key"
                                radius="md"
                                size="sm"
                                className="flex-1"
                                classNames={{
                                    input: "bg-slate-50 dark:bg-slate-900/60 border-slate-300 dark:border-white/10 text-slate-900 dark:text-slate-100 font-mono",
                                }}
                            />
                            <Button
                                color="cyan"
                                radius="md"
                                size="sm"
                                loading={saving}
                                onClick={handleSaveManagerKey}
                                disabled={saving || managerKey === originalManagerDocId}
                                className="font-headline font-bold text-xs uppercase tracking-wider shrink-0"
                            >
                                Save
                            </Button>
                        </div>
                    </div>
                </Stack>
            </Paper>

            <Paper
                withBorder
                radius="lg"
                p={{ base: 'md', sm: 'lg' }}
                className="border-slate-200 dark:border-white/10 bg-white dark:bg-[#111722] shadow-sm"
            >
                <Stack gap="md">
                    <Group justify="space-between" align="center">
                        <Group gap="xs">
                            <ThemeIcon size="md" radius="md" color="cyan" variant="light">
                                <Shield className="size-4" />
                            </ThemeIcon>
                            <Title order={4} className="text-base sm:text-lg font-bold font-headline text-slate-900 dark:text-white flex items-center gap-2">
                                <span>Manager Accounts</span>
                                <CompactInfo
                                    label="About manager accounts"
                                    message="Manage individual manager access keys and view key history."
                                />
                            </Title>
                        </Group>
                        <Badge size="sm" variant="light" color="cyan" className="font-mono font-bold">
                            {managers.length} {managers.length === 1 ? 'Account' : 'Accounts'}
                        </Badge>
                    </Group>

                    {managers.length === 0 ? (
                        <div className="text-center py-8 border-2 border-dashed rounded-xl border-slate-200 dark:border-white/10">
                            <Text size="sm" c="dimmed">No manager accounts found.</Text>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {managers.map((manager) => (
                                <Paper
                                    key={manager.id}
                                    withBorder
                                    radius="md"
                                    p="md"
                                    className="border-slate-200 dark:border-white/10 bg-slate-50/60 dark:bg-[#141a23]/80"
                                >
                                    <div className="flex flex-col gap-3">
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <div className="flex flex-col gap-0.5">
                                                <Text fw={700} size="sm" className="text-slate-900 dark:text-white">
                                                    {manager.email}
                                                </Text>
                                                <Text size="xs" c="dimmed" className="font-mono">
                                                    ID: {manager.id}
                                                </Text>
                                            </div>
                                            <Button
                                                size="xs"
                                                variant="default"
                                                radius="md"
                                                onClick={() => handleResetManagerKey(manager)}
                                                disabled={!!actionLoading}
                                                leftSection={
                                                    actionLoading === manager.id ? (
                                                        <Loader2 className="size-3.5 animate-spin" />
                                                    ) : (
                                                        <RefreshCw className="size-3.5 text-cyan-500" />
                                                    )
                                                }
                                                className="font-headline font-bold uppercase tracking-wider text-[11px] border-slate-300 dark:border-white/10 bg-white dark:bg-[#111722]"
                                            >
                                                Reset Key
                                            </Button>
                                        </div>
                                        <div className="flex flex-wrap gap-4 items-center pt-2 border-t border-slate-200/60 dark:border-white/10 text-xs">
                                            <div className="flex items-center gap-2">
                                                <span className="text-slate-500 font-semibold">Active Key:</span>
                                                <code className="bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 px-2 py-0.5 rounded-md font-mono font-bold border border-cyan-500/20">
                                                    {manager.activeManagerKey || 'Legacy/None'}
                                                </code>
                                            </div>
                                            {manager.deprecatedKeys && manager.deprecatedKeys.length > 0 && (
                                                <div className="flex flex-wrap items-center gap-1.5">
                                                    <span className="text-slate-500 font-semibold">Deprecated:</span>
                                                    <div className="flex flex-wrap gap-1">
                                                        {manager.deprecatedKeys.map((k: string, i: number) => (
                                                            <code key={i} className="bg-slate-200 dark:bg-white/10 px-1.5 py-0.5 rounded font-mono text-slate-500 dark:text-slate-400 text-[10px]">
                                                                {k}
                                                            </code>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </Paper>
                            ))}
                        </div>
                    )}
                </Stack>
            </Paper>

            <Paper
                withBorder
                radius="lg"
                p={{ base: 'md', sm: 'lg' }}
                className="border-slate-200 dark:border-white/10 bg-white dark:bg-[#111722] shadow-sm"
            >
                <Stack gap="md">
                    <Group justify="space-between" align="center">
                        <Group gap="xs">
                            <ThemeIcon size="md" radius="md" color="cyan" variant="light">
                                <RefreshCw className="size-4" />
                            </ThemeIcon>
                            <Title order={4} className="text-base sm:text-lg font-bold font-headline text-slate-900 dark:text-white flex items-center gap-2">
                                <span>Key Reset Requests</span>
                                <CompactInfo
                                    label="About key reset requests"
                                    message="Pending requests from managers who forgot their access key."
                                />
                            </Title>
                        </Group>
                        {requests.length > 0 && (
                            <Badge size="sm" variant="filled" color="yellow" className="font-mono font-bold text-slate-950">
                                {requests.length} Pending
                            </Badge>
                        )}
                    </Group>

                    {requests.length === 0 ? (
                        <div className="text-center py-8 border-2 border-dashed rounded-xl border-slate-200 dark:border-white/10">
                            <Text size="sm" c="dimmed">No pending requests found.</Text>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {requests.map((req) => {
                                const requester = managers.find(m => m.email === req.email);
                                return (
                                    <Paper
                                        key={req.id}
                                        withBorder
                                        radius="md"
                                        p="md"
                                        className="flex flex-wrap items-center justify-between gap-3 border-slate-200 dark:border-white/10 bg-slate-50/60 dark:bg-[#141a23]/80"
                                    >
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2">
                                                <Mail className="size-4 text-slate-500" />
                                                <span className="font-bold text-sm text-slate-900 dark:text-white">{req.email}</span>
                                                <Badge size="xs" variant="light" color={requester ? "cyan" : "yellow"} className="text-[10px] uppercase tracking-wider font-bold">
                                                    {requester ? 'Registered' : 'New Account'}
                                                </Badge>
                                            </div>
                                            <Text size="xs" c="dimmed">
                                                Requested: {req.requestedAt?.toDate().toLocaleString() || 'Just now'}
                                            </Text>
                                        </div>
                                        <Group gap="xs">
                                            <Button
                                                size="xs"
                                                variant="subtle"
                                                color="red"
                                                radius="md"
                                                onClick={() => handleRejectRequest(req.id)}
                                                disabled={!!actionLoading}
                                                leftSection={
                                                    actionLoading === req.id ? (
                                                        <Loader2 className="size-3.5 animate-spin" />
                                                    ) : (
                                                        <X className="size-3.5" />
                                                    )
                                                }
                                                className="font-headline font-bold uppercase tracking-wider text-[11px]"
                                            >
                                                Reject
                                            </Button>
                                            <Button
                                                size="xs"
                                                color="teal"
                                                radius="md"
                                                onClick={() => handleApproveRequest(req)}
                                                disabled={!!actionLoading}
                                                leftSection={
                                                    actionLoading === req.id ? (
                                                        <Loader2 className="size-3.5 animate-spin" />
                                                    ) : (
                                                        <Check className="size-3.5" />
                                                    )
                                                }
                                                className="font-headline font-bold uppercase tracking-wider text-[11px]"
                                            >
                                                Approve
                                            </Button>
                                        </Group>
                                    </Paper>
                                );
                            })}
                        </div>
                    )}
                </Stack>
            </Paper>
        </Stack>
    );
}
