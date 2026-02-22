
'use client';

import { createContext, useContext, useMemo, ReactNode } from 'react';
import { useUser, useFirestore, useDoc } from '@/firebase';
import type { User } from 'firebase/auth';
import type { UserProfile } from '@/lib/types';
import { doc } from 'firebase/firestore';

interface UserProfileContextValue {
    authUser: User | null;
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

    const value = useMemo(() => ({
        authUser,
        profile,
        loading: authUser === undefined || (authUser && profileLoading),
    }), [authUser, profile, profileLoading]);

    return (
        <UserProfileContext.Provider value={value}>
            {children}
        </UserProfileContext.Provider>
    );
}

export const useUserProfile = () => {
    return useContext(UserProfileContext);
}
