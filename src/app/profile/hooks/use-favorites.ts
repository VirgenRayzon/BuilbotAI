"use client";

import { useState, useEffect, useCallback } from 'react';
import { useUserProfile } from "@/context/user-profile";
import { useFirestore } from "@/firebase";
import { collection, query, onSnapshot, addDoc, deleteDoc, updateDoc, doc, serverTimestamp, orderBy } from "firebase/firestore";
import type { FavoriteBuild, FavoriteBuildPart } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

/**
 * Hook to manage user favorite builds (CRUD operations for the favorites subcollection).
 */
export function useFavorites() {
    const { authUser, loading: userLoading } = useUserProfile();
    const firestore = useFirestore();
    const { toast } = useToast();

    const [favorites, setFavorites] = useState<FavoriteBuild[]>([]);
    const [loading, setLoading] = useState(true);

    // Real-time listener for favorites
    useEffect(() => {
        if (!authUser || !firestore) {
            if (!userLoading) setLoading(false);
            return;
        }

        setLoading(true);
        const q = query(
            collection(firestore, "users", authUser.uid, "favorites"),
            orderBy("createdAt", "desc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetched: FavoriteBuild[] = [];
            snapshot.forEach((docSnap) => {
                fetched.push({ id: docSnap.id, ...docSnap.data() } as FavoriteBuild);
            });
            setFavorites(fetched);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching favorites:", error);
            toast({ title: "Error", description: "Failed to load favorite builds.", variant: "destructive" });
            setLoading(false);
        });

        return () => unsubscribe();
    }, [authUser, firestore, userLoading, toast]);

    /**
     * Save a new favorite build.
     */
    const saveFavorite = useCallback(async (name: string, parts: FavoriteBuildPart[], source: 'builder' | 'advisor') => {
        if (!authUser || !firestore) return;

        const totalPrice = parts.reduce((sum, p) => sum + (p.price || 0), 0);

        try {
            await addDoc(collection(firestore, "users", authUser.uid, "favorites"), {
                name,
                parts,
                totalPrice,
                source,
                createdAt: serverTimestamp(),
            });
            toast({ title: "Build Saved", description: `"${name}" has been added to your favorites.` });
        } catch (error) {
            console.error("Error saving favorite:", error);
            toast({ title: "Error", description: "Failed to save favorite build.", variant: "destructive" });
        }
    }, [authUser, firestore, toast]);

    /**
     * Delete a favorite build.
     */
    const deleteFavorite = useCallback(async (favoriteId: string) => {
        if (!authUser || !firestore) return;

        try {
            await deleteDoc(doc(firestore, "users", authUser.uid, "favorites", favoriteId));
            toast({ title: "Favorite Removed", description: "Build has been removed from your favorites." });
        } catch (error) {
            console.error("Error deleting favorite:", error);
            toast({ title: "Error", description: "Failed to remove favorite build.", variant: "destructive" });
        }
    }, [authUser, firestore, toast]);

    /**
     * Rename a favorite build.
     */
    const renameFavorite = useCallback(async (favoriteId: string, newName: string) => {
        if (!authUser || !firestore) return;

        try {
            await updateDoc(doc(firestore, "users", authUser.uid, "favorites", favoriteId), { name: newName });
            toast({ title: "Renamed", description: `Favorite renamed to "${newName}".` });
        } catch (error) {
            console.error("Error renaming favorite:", error);
            toast({ title: "Error", description: "Failed to rename favorite.", variant: "destructive" });
        }
    }, [authUser, firestore, toast]);

    return {
        favorites,
        loading,
        saveFavorite,
        deleteFavorite,
        renameFavorite,
    };
}
