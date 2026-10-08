/** Auth identity and server-confirmed Firestore profile for role-based UI. */
'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import type { User } from 'firebase/auth';
import type { UserProfile } from '@/lib/types';
import { useFirestore, useUser } from '@/firebase';

type ProfileStatus = 'loading' | 'unauthenticated' | 'ready' | 'missing' | 'error';
type SnapshotStatus = 'loading' | 'ready' | 'missing' | 'error';

interface ProfileSnapshot {
    uid: string;
    status: SnapshotStatus;
    profile: UserProfile | null;
    error: Error | null;
}

interface UserProfileContextValue {
    authUser: User | null | undefined;
    profile: UserProfile | null;
    loading: boolean;
    status: ProfileStatus;
    error: Error | null;
}

const UserProfileContext = createContext<UserProfileContextValue>({
    authUser: undefined,
    profile: null,
    loading: true,
    status: 'loading',
    error: null,
});

export function UserProfileProvider({ children }: { children: ReactNode }) {
    const authUser = useUser();
    const firestore = useFirestore();
    const uid = authUser?.uid;
    const [snapshot, setSnapshot] = useState<ProfileSnapshot | null>(null);

    useEffect(() => {
        if (!uid || !firestore) return;

        let active = true;
        let sawMissingProfile = false;
        let missingTimer: ReturnType<typeof setTimeout> | undefined;
        setSnapshot({ uid, status: 'loading', profile: null, error: null });

        // Cached roles may be stale after an account's role changes.
        const timeout = setTimeout(() => {
            if (!active) return;
            setSnapshot(current => current?.uid === uid && current.status === 'loading'
                ? {
                    uid,
                    status: sawMissingProfile ? 'missing' : 'error',
                    profile: null,
                    error: sawMissingProfile ? null : new Error('Profile verification timed out.'),
                }
                : current);
        }, 15000);

        const unsubscribe = onSnapshot(
            doc(firestore, 'users', uid),
            { includeMetadataChanges: true },
            current => {
                if (!active || current.metadata.fromCache || current.metadata.hasPendingWrites) return;

                if (current.exists()) {
                    clearTimeout(timeout);
                    if (missingTimer) clearTimeout(missingTimer);
                    missingTimer = undefined;
                    sawMissingProfile = false;
                    setSnapshot({
                        uid,
                        status: 'ready',
                        profile: { ...current.data(), id: current.id } as UserProfile,
                        error: null,
                    });
                    return;
                }

                // Sign-in may precede the first profile write.
                sawMissingProfile = true;
                setSnapshot({ uid, status: 'loading', profile: null, error: null });
                if (!missingTimer) {
                    missingTimer = setTimeout(() => {
                        if (!active) return;
                        clearTimeout(timeout);
                        missingTimer = undefined;
                        setSnapshot({ uid, status: 'missing', profile: null, error: null });
                    }, 3000);
                }
            },
            error => {
                if (!active) return;
                clearTimeout(timeout);
                if (missingTimer) clearTimeout(missingTimer);
                setSnapshot({ uid, status: 'error', profile: null, error });
            }
        );

        return () => {
            active = false;
            clearTimeout(timeout);
            if (missingTimer) clearTimeout(missingTimer);
            unsubscribe();
        };
    }, [uid, firestore]);

    const status: ProfileStatus = authUser === undefined
        ? 'loading'
        : authUser === null
            ? 'unauthenticated'
            : !firestore || snapshot?.uid !== uid
                ? 'loading'
                : snapshot?.status ?? 'loading';

    return (
        <UserProfileContext.Provider value={{
            authUser,
            profile: status === 'ready' ? snapshot?.profile ?? null : null,
            loading: status === 'loading',
            status,
            error: status === 'error' ? snapshot?.error ?? null : null,
        }}>
            {children}
        </UserProfileContext.Provider>
    );
}

export const useUserProfile = () => useContext(UserProfileContext);
