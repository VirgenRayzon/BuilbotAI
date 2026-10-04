"use client";

import { useState, useEffect, useCallback } from 'react';
import { useUserProfile } from "@/context/user-profile";
import { useFirestore } from "@/firebase";
import { updateDoc, doc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { createUserAuditLog } from "@/firebase/audit";

/**
 * Hook to manage profile and settings state and updates.
 */
export function useProfileState() {
    const { authUser, profile } = useUserProfile();
    const firestore = useFirestore();
    const { toast } = useToast();

    const [isEditing, setIsEditing] = useState(false);
    
    // User Information
    const [name, setName] = useState("");
    const [bio, setBio] = useState("");
    const [photoURL, setPhotoURL] = useState("");

    // Account Information
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [address, setAddress] = useState("");
    const [apartment, setApartment] = useState("");
    const [city, setCity] = useState("");
    const [state, setState] = useState("");
    const [zip, setZip] = useState("");

    const [isSaving, setIsSaving] = useState(false);
    const [isSavingUser, setIsSavingUser] = useState(false);
    const [isSavingAccount, setIsSavingAccount] = useState(false);

    useEffect(() => {
        if (profile) {
            setName(profile.name || "");
            setBio(profile.bio || "");
            setPhotoURL(profile.photoURL || "");
            setFirstName(profile.firstName || (profile.name?.split(" ")[0] || ""));
            setLastName(profile.lastName || (profile.name?.split(" ").slice(1).join(" ") || ""));
            setEmail(profile.email || "");
            setAddress(profile.address || "");
            setApartment(profile.apartment || "");
            setCity(profile.city || "");
            setState(profile.state || "");
            setZip(profile.zip || "");
        }
    }, [profile]);

    // Save User Information (Name, Bio, Avatar)
    const handleSaveUserInfo = useCallback(async () => {
        if (!authUser || !firestore) return;
        setIsSavingUser(true);
        try {
            const updates: Record<string, any> = {
                name: name.trim(),
                bio: bio.trim(),
            };
            if (photoURL) updates.photoURL = photoURL.trim();

            await updateDoc(doc(firestore, "users", authUser.uid), updates);
            await createUserAuditLog(firestore, {
                userId: authUser.uid,
                userEmail: email || authUser.email || undefined,
                actionName: 'updated',
                scope: 'Profile',
                resourceName: 'User Information',
                details: `Updated user info: name "${name}"`
            });
            toast({
                title: "User Information Saved",
                description: "Your display profile has been successfully updated.",
            });
        } catch (error) {
            console.error("Error updating user info:", error);
            toast({
                title: "Save Failed",
                description: "There was an error saving your user information.",
                variant: "destructive"
            });
        } finally {
            setIsSavingUser(false);
        }
    }, [authUser, firestore, name, bio, photoURL, email, toast]);

    // Save Account Information (First Name, Last Name, Address, Location)
    const handleSaveAccountInfo = useCallback(async () => {
        if (!authUser || !firestore) return;
        setIsSavingAccount(true);
        try {
            const fullName = `${firstName.trim()} ${lastName.trim()}`.trim() || name;
            const updates: Record<string, any> = {
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                name: fullName,
                address: address.trim(),
                apartment: apartment.trim(),
                city: city.trim(),
                state: state.trim(),
                zip: zip.trim(),
            };

            await updateDoc(doc(firestore, "users", authUser.uid), updates);
            await createUserAuditLog(firestore, {
                userId: authUser.uid,
                userEmail: email || authUser.email || undefined,
                actionName: 'updated',
                scope: 'Profile',
                resourceName: 'Account Information',
                details: `Updated address & account details for ${fullName}`
            });
            toast({
                title: "Account Information Saved",
                description: "Your contact and billing address have been updated.",
            });
        } catch (error) {
            console.error("Error updating account info:", error);
            toast({
                title: "Save Failed",
                description: "There was an error saving your account information.",
                variant: "destructive"
            });
        } finally {
            setIsSavingAccount(false);
        }
    }, [authUser, firestore, firstName, lastName, name, address, apartment, city, state, zip, email, toast]);

    // Legacy general save
    const handleSaveProfile = useCallback(async () => {
        if (!authUser || !firestore) return;
        setIsSaving(true);
        try {
            await updateDoc(doc(firestore, "users", authUser.uid), {
                name,
                email
            });
            await createUserAuditLog(firestore, {
                userId: authUser.uid,
                userEmail: email || authUser.email || undefined,
                actionName: 'updated',
                scope: 'Profile',
                resourceName: 'Account Details',
                details: `Updated name to "${name}" and email to "${email}"`
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
        bio, setBio,
        photoURL, setPhotoURL,
        firstName, setFirstName,
        lastName, setLastName,
        email, setEmail,
        address, setAddress,
        apartment, setApartment,
        city, setCity,
        state, setState,
        zip, setZip,
        isSaving, handleSaveProfile,
        isSavingUser, handleSaveUserInfo,
        isSavingAccount, handleSaveAccountInfo,
    };
}

