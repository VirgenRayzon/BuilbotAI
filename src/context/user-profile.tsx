/**
 * UserProfileContext — Provides authenticated user and Firestore profile data.
 * Combines Firebase Auth state with the 'users' collection document for role-based access.
 */

'use client';

import React, { createContext, useContext, useMemo, useState, useEffect, ReactNode } from 'react';
import { useUser, useFirestore, useDoc } from '@/firebase';
import type { User } from 'firebase/auth';
import type { UserProfile } from '@/lib/types';
import { doc } from 'firebase/firestore';

interface UserProfileContextValue {
    authUser: User | null | undefined;
    profile: UserProfile | null;
    loading: boolean;
}


const UserProfileContext = createContext<UserProfileContextValue>({
    authUser: null,
    profile: null,
    loading: true,
});

export function UserProfileProvider({ children }: { children: ReactNode }) {
    const authUser = useUser();
    const firestore = useFirestore();

    const userDocRef = useMemo(() => {
        if (authUser && firestore) {
            return doc(firestore, 'users', authUser.uid);
        }
        return null;
    }, [authUser, firestore]);

    const { data: profile, loading: profileLoading } = useDoc<UserProfile>(userDocRef);

    // Track when the profile is actually "ready" for the current authUser
    // This prevents the "flash" where authUser is truthy but profile is still null
    const [isProfileReady, setIsProfileReady] = useState(false);
    const [lastUid, setLastUid] = useState<string | null | undefined>(undefined);

    // Synchronous state reset during render to prevent the "one-render flash"
    if (authUser?.uid !== lastUid) {
        setLastUid(authUser?.uid);
        setIsProfileReady(false);
    }

    useEffect(() => {
        if (authUser === undefined) {
            setIsProfileReady(false);
        } else if (authUser === null) {
            setIsProfileReady(true);
        } else if (profileLoading) {
            setIsProfileReady(false);
        } else if (profile !== undefined) {
            // Wait until the profile matches the current user
            if (!profile || profile.id === authUser.uid) {
                setIsProfileReady(true);
            }
        }
    }, [authUser, profile, profileLoading]);

    const value = useMemo(() => ({
        authUser,
        profile,
        loading: !isProfileReady,
    }), [authUser, profile, isProfileReady]);

    return (
        <UserProfileContext.Provider value={value}>
            {children}
        </UserProfileContext.Provider>
    );
}

export const useUserProfile = () => {
    return useContext(UserProfileContext);
}
