
'use client';
import { ReactNode, useMemo } from 'react';
import { FirebaseProvider } from './provider';
import { initializeFirebase } from './init';

export function FirebaseClientProvider({ children }: { children: ReactNode }) {
  const { firebaseApp, firestore, auth } = useMemo(
    () => initializeFirebase(),
    []
  );

  return (
    <FirebaseProvider
      firebaseApp={firebaseApp}
      auth={auth}
      firestore={firestore}
    >
      {children}
    </FirebaseProvider>
  );
}
