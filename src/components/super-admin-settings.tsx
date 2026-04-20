'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFirestore } from '@/firebase';
import { collection, query, where, getDocs, doc, setDoc, deleteDoc, onSnapshot, updateDoc, serverTimestamp, limit, arrayUnion } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Check, X, RefreshCw, Mail, Key } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function SuperAdminSettings() {
    const [managerKey, setManagerKey] = useState('');
    const [superAdminKey, setSuperAdminKey] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    const [originalManagerDocId, setOriginalManagerDocId] = useState<string | null>(null);
    const [originalSuperAdminDocId, setOriginalSuperAdminDocId] = useState<string | null>(null);
    const [requests, setRequests] = useState<any[]>([]);
    const [managers, setManagers] = useState<any[]>([]);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const firestore = useFirestore();
    const { toast } = useToast();

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
                    } else if (data.role === 'superadmin') {
                        setSuperAdminKey(docSnap.id);
                        setOriginalSuperAdminDocId(docSnap.id);
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
        if (!firestore) return;
        const q = query(
            collection(firestore, 'users'), 
            where('isManager', '==', true)
        );
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const m = snapshot.docs.map(doc => ({ 
                id: doc.id, 
                ...doc.data() 
            }));
            setManagers(m);
        }, (err) => {
            console.error("Error listening to managers:", err);
        });

        return () => unsubscribe();
    }, [firestore]);

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

    const handleSaveSuperAdminKey = async () => {
        if (!firestore) return;
        if (!superAdminKey.trim()) {
            toast({ title: "Error", description: "Super Admin key cannot be empty", variant: "destructive" });
            return;
        }
        setSaving(true);
        try {
            if (originalSuperAdminDocId && originalSuperAdminDocId !== superAdminKey) {
                await deleteDoc(doc(firestore, 'authKeys', originalSuperAdminDocId));
            }
            await setDoc(doc(firestore, 'authKeys', superAdminKey), { role: 'superadmin' });
            setOriginalSuperAdminDocId(superAdminKey);
            toast({ title: "Success", description: "Super Admin Key updated successfully" });
        } catch (err) {
            console.error(err);
            toast({ title: "Error", description: "Failed to update Super Admin Key", variant: "destructive" });
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
        <div className="space-y-6 max-w-2xl">
            <Card>
                <CardHeader>
                    <CardTitle>Access Keys</CardTitle>
                    <CardDescription>
                        Manage the access keys required for new signups.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label>Manager Key</Label>
                        <div className="flex gap-2">
                            <Input 
                                value={managerKey} 
                                onChange={(e) => setManagerKey(e.target.value)} 
                                placeholder="Enter Manager Key"
                            />
                            <Button onClick={handleSaveManagerKey} disabled={saving || managerKey === originalManagerDocId}>
                                Save
                            </Button>
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                        <Label>Super Admin Key</Label>
                        <div className="flex gap-2">
                            <Input 
                                value={superAdminKey} 
                                onChange={(e) => setSuperAdminKey(e.target.value)} 
                                placeholder="Enter Super Admin Key"
                            />
                            <Button onClick={handleSaveSuperAdminKey} disabled={saving || superAdminKey === originalSuperAdminDocId}>
                                Save
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Key className="h-5 w-5 text-primary" />
                        Manager Accounts
                    </CardTitle>
                    <CardDescription>
                        Manage individual manager access keys and view key history.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {managers.length === 0 ? (
                        <div className="text-center py-8 border-2 border-dashed rounded-lg">
                            <p className="text-muted-foreground text-sm">No manager accounts found.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {managers.map((manager) => (
                                <div key={manager.id} className="flex flex-col space-y-3 p-4 border rounded-lg bg-card/50">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <p className="font-medium text-sm">{manager.email}</p>
                                            <p className="text-xs text-muted-foreground">ID: {manager.id}</p>
                                        </div>
                                        <Button 
                                            size="sm" 
                                            variant="outline"
                                            onClick={() => handleResetManagerKey(manager)}
                                            disabled={!!actionLoading}
                                        >
                                            {actionLoading === manager.id ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <RefreshCw className="h-3 w-3 mr-2" />}
                                            Reset Key
                                        </Button>
                                    </div>
                                    <div className="flex flex-wrap gap-4 items-center pt-2 border-t text-xs">
                                        <div className="space-y-1">
                                            <span className="text-muted-foreground">Active Key:</span>
                                            <div className="flex items-center gap-2">
                                                <code className="bg-muted px-1.5 py-0.5 rounded font-mono text-primary font-bold">
                                                    {manager.activeManagerKey || 'Legacy/None'}
                                                </code>
                                            </div>
                                        </div>
                                        {manager.deprecatedKeys && manager.deprecatedKeys.length > 0 && (
                                            <div className="space-y-1">
                                                <span className="text-muted-foreground">Deprecated:</span>
                                                <div className="flex flex-wrap gap-1">
                                                    {manager.deprecatedKeys.map((k: string, i: number) => (
                                                        <code key={i} className="bg-muted px-1 py-0.5 rounded font-mono opacity-50 text-[10px]">
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

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <RefreshCw className="h-5 w-5 text-primary" />
                        Key Reset Requests
                    </CardTitle>
                    <CardDescription>
                        Pending requests from managers who forgot their access key.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {requests.length === 0 ? (
                        <div className="text-center py-8 border-2 border-dashed rounded-lg">
                            <p className="text-muted-foreground text-sm">No pending requests found.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {requests.map((req) => {
                                const requester = managers.find(m => m.email === req.email);
                                return (
                                    <div key={req.id} className="flex items-center justify-between p-4 border rounded-lg bg-card/50">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <Mail className="h-4 w-4 text-muted-foreground" />
                                                <span className="font-medium">{req.email}</span>
                                                <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
                                                    {requester ? 'Registered' : 'New Account'}
                                                </Badge>
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                Requested: {req.requestedAt?.toDate().toLocaleString() || 'Just now'}
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button 
                                                size="sm" 
                                                variant="ghost" 
                                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                onClick={() => handleRejectRequest(req.id)}
                                                disabled={!!actionLoading}
                                            >
                                                {actionLoading === req.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                                                <span className="ml-2 hidden sm:inline">Reject</span>
                                            </Button>
                                            <Button 
                                                size="sm" 
                                                className="bg-green-600 hover:bg-green-700 text-white"
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
