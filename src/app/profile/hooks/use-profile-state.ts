"use client";

import { useState, useEffect, useCallback } from 'react';
import { useUserProfile } from "@/context/user-profile";
import { useFirestore } from "@/firebase";
import { updateDoc, doc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

/**
 * Hook to manage profile editing state and updates.
 */
export function useProfileState() {
    const { authUser, profile } = useUserProfile();
    const firestore = useFirestore();
    const { toast } = useToast();

    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (profile) {
            setName(profile.name || "");
            setEmail(profile.email || "");
        }
    }, [profile]);

    const handleSaveProfile = useCallback(async () => {
        if (!authUser || !firestore) return;
        setIsSaving(true);
        try {
            await updateDoc(doc(firestore, "users", authUser.uid), {
                name,
                email
            });
            toast({
                title: "Profile Updated",
                description: "Your profile information has been saved successfully.",
            });
            setIsEditing(false);
        } catch (error) {
            console.error("Error updating profile:", error);
            toast({
                title: "Update Failed",
                description: "There was an error updating your profile.",
                variant: "destructive"
            });
        } finally {
            setIsSaving(false);
        }
    }, [authUser, firestore, name, email, toast]);

    return {
        isEditing, setIsEditing,
        name, setName,
        email, setEmail,
        isSaving, handleSaveProfile
    };
}
