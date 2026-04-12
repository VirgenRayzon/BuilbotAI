'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFirestore } from '@/firebase';
import { collection, query, where, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export function SuperAdminSettings() {
    const [managerKey, setManagerKey] = useState('');
    const [superAdminKey, setSuperAdminKey] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    // We will store the original DB references so we can delete them when updating
    const [originalManagerDocId, setOriginalManagerDocId] = useState<string | null>(null);
    const [originalSuperAdminDocId, setOriginalSuperAdminDocId] = useState<string | null>(null);

    const firestore = useFirestore();
    const { toast } = useToast();

    useEffect(() => {
        async function fetchKeys() {
            if (!firestore) return;
            try {
                const keysRef = collection(firestore, 'authKeys');
                
                // Super Admins have permission to list authKeys
                const q = query(keysRef);
                const snapshot = await getDocs(q);
                
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
                    description: "You might not have the correct permissions.",
                    variant: "destructive"
                });
            } finally {
                setLoading(false);
            }
        }
        fetchKeys();
    }, [firestore, toast]);

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
                        Manage the access keys required for new signups. Changing these will only affect new users.
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
                        <p className="text-xs text-muted-foreground">This key is required to register as a new Manager.</p>
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
                        <p className="text-xs text-muted-foreground">This key is required to register as a new Super Admin.</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
