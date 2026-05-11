"use client";

import { useState, useEffect, useCallback } from 'react';
import { useFirestore } from "@/firebase";
import { collection, query, where, getDocs, deleteDoc, doc, setDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { useUserProfile } from "@/context/user-profile";

/**
 * Hook to manage Super Admin signup keys.
 */
export function useAdminKeys() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const { profile } = useUserProfile();

    const [superAdminKey, setSuperAdminKey] = useState('');
    const [originalSuperAdminKey, setOriginalSuperAdminKey] = useState('');
    const [isSavingKey, setIsSavingKey] = useState(false);
    const [isKeyLoading, setIsKeyLoading] = useState(false);

    useEffect(() => {
        if (!firestore || !profile?.isSuperAdmin) return;

        async function fetchSuperAdminKey() {
            setIsKeyLoading(true);
            try {
                const keysRef = collection(firestore!, 'authKeys');
                const q = query(keysRef, where('role', '==', 'superadmin'));
                const snapshot = await getDocs(q);

                if (!snapshot.empty) {
                    const docSnap = snapshot.docs[0];
                    setSuperAdminKey(docSnap.id);
                    setOriginalSuperAdminKey(docSnap.id);
                }
            } catch (err) {
                console.error("Error fetching super admin key:", err);
            } finally {
                setIsKeyLoading(false);
            }
        }

        fetchSuperAdminKey();
    }, [firestore, profile?.isSuperAdmin]);

    const handleSaveSuperAdminKey = useCallback(async () => {
        if (!firestore) return;
        if (!superAdminKey.trim()) {
            toast({ title: "Error", description: "Key cannot be empty", variant: "destructive" });
            return;
        }
        setIsSavingKey(true);
        try {
            if (originalSuperAdminKey && originalSuperAdminKey !== superAdminKey) {
                await deleteDoc(doc(firestore, 'authKeys', originalSuperAdminKey));
            }
            await setDoc(doc(firestore, 'authKeys', superAdminKey), { role: 'superadmin' });
            setOriginalSuperAdminKey(superAdminKey);
            toast({ title: "Success", description: "Super Admin Key updated" });
        } catch (err) {
            console.error(err);
            toast({ title: "Error", description: "Failed to update key", variant: "destructive" });
        } finally {
            setIsSavingKey(false);
        }
    }, [firestore, superAdminKey, originalSuperAdminKey, toast]);

    return {
        superAdminKey, setSuperAdminKey,
        originalSuperAdminKey,
        isSavingKey, isKeyLoading,
        handleSaveSuperAdminKey
    };
}
