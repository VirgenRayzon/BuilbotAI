'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFirestore } from '@/firebase';
import { collection, query, where, getDocs, doc, setDoc, deleteDoc, onSnapshot, updateDoc, serverTimestamp, limit, arrayUnion } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Check, X, RefreshCw, Mail, Key, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useUserProfile } from '@/context/user-profile';
import { createAuditLog } from '@/firebase/audit';
import { listManagerAccountsAction } from '@/app/actions';
import { useAuth } from '@/firebase';

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
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6 w-full">
            <Card className="border-slate-200 dark:border-white/10 bg-white dark:bg-[#111722] shadow-sm">
                <CardHeader className="p-3 pb-3">
                    <CardTitle className="text-lg font-bold font-headline text-slate-900 dark:text-white flex items-center gap-2">
                        <Key className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                        Default Manger Access Key
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-600 dark:text-slate-400">
                        Manage the access key required for new manager signups.
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-3 pt-0 space-y-3">
                    <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Manager Key</Label>
                        <div className="flex gap-2">
                            <Input
                                value={managerKey}
                                onChange={(e) => setManagerKey(e.target.value)}
                                placeholder="Enter Manager Key"
                                type="password"
                                className="bg-slate-50 dark:bg-slate-900/50 border-slate-300 dark:border-white/10"
                            />
                            <Button
                                onClick={handleSaveManagerKey}
                                disabled={saving || managerKey === originalManagerDocId}
                                className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs uppercase tracking-wider"
                            >
                                Save
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-slate-200 dark:border-white/10 bg-white dark:bg-[#111722] shadow-sm">
                <CardHeader className="p-3 pb-3">
                    <CardTitle className="text-lg font-bold font-headline text-slate-900 dark:text-white flex items-center gap-2">
                        <Shield className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                        Manager Accounts
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-600 dark:text-slate-400">
                        Manage individual manager access keys and view key history.
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                    {managers.length === 0 ? (
                        <div className="text-center py-8 border-2 border-dashed rounded-lg border-slate-200 dark:border-white/10">
                            <p className="text-slate-500 text-sm">No manager accounts found.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {managers.map((manager) => (
                                <div key={manager.id} className="flex flex-col space-y-3 p-3 border border-slate-200 dark:border-white/10 rounded-xl bg-slate-50/50 dark:bg-black/20">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <p className="font-bold text-sm text-slate-900 dark:text-white">{manager.email}</p>
                                            <p className="text-xs text-slate-500 font-mono">ID: {manager.id}</p>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleResetManagerKey(manager)}
                                            disabled={!!actionLoading}
                                            className="text-xs border-slate-300 dark:border-white/10"
                                        >
                                            {actionLoading === manager.id ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <RefreshCw className="h-3 w-3 mr-2 text-cyan-500" />}
                                            Reset Key
                                        </Button>
                                    </div>
                                    <div className="flex flex-wrap gap-4 items-center pt-2 border-t border-slate-200/60 dark:border-white/5 text-xs">
                                        <div className="space-y-1">
                                            <span className="text-slate-500 font-semibold">Active Key:</span>
                                            <div className="flex items-center gap-2">
                                                <code className="bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 px-1.5 py-0.5 rounded font-mono font-bold">
                                                    {manager.activeManagerKey || 'Legacy/None'}
                                                </code>
                                            </div>
                                        </div>
                                        {manager.deprecatedKeys && manager.deprecatedKeys.length > 0 && (
                                            <div className="space-y-1">
                                                <span className="text-slate-500 font-semibold">Deprecated:</span>
                                                <div className="flex flex-wrap gap-1">
                                                    {manager.deprecatedKeys.map((k: string, i: number) => (
                                                        <code key={i} className="bg-slate-200 dark:bg-white/10 px-1 py-0.5 rounded font-mono text-slate-500 text-[10px]">
                                                            {k}
                                                        </code>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card className="border-slate-200 dark:border-white/10 bg-white dark:bg-[#111722] shadow-sm">
                <CardHeader className="p-3 pb-3">
                    <CardTitle className="text-lg font-bold font-headline text-slate-900 dark:text-white flex items-center gap-2">
                        <RefreshCw className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                        Key Reset Requests
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-600 dark:text-slate-400">
                        Pending requests from managers who forgot their access key.
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                    {requests.length === 0 ? (
                        <div className="text-center py-8 border-2 border-dashed rounded-lg border-slate-200 dark:border-white/10">
                            <p className="text-slate-500 text-sm">No pending requests found.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {requests.map((req) => {
                                const requester = managers.find(m => m.email === req.email);
                                return (
                                    <div key={req.id} className="flex items-center justify-between p-3 border border-slate-200 dark:border-white/10 rounded-xl bg-slate-50/50 dark:bg-black/20">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <Mail className="h-4 w-4 text-slate-500" />
                                                <span className="font-bold text-sm text-slate-900 dark:text-white">{req.email}</span>
                                                <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
                                                    {requester ? 'Registered' : 'New Account'}
                                                </Badge>
                                            </div>
                                            <p className="text-xs text-slate-500">
                                                Requested: {req.requestedAt?.toDate().toLocaleString() || 'Just now'}
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                                                onClick={() => handleRejectRequest(req.id)}
                                                disabled={!!actionLoading}
                                            >
                                                {actionLoading === req.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                                                <span className="ml-2 hidden sm:inline">Reject</span>
                                            </Button>
                                            <Button
                                                size="sm"
                                                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                                                onClick={() => handleApproveRequest(req)}
                                                disabled={!!actionLoading}
                                            >
                                                {actionLoading === req.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                                                <span className="ml-2 hidden sm:inline">Approve</span>
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
