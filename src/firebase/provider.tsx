
'use client';
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';
import { FirebaseApp } from 'firebase/app';
import { Auth } from 'firebase/auth';
import { Firestore } from 'firebase/firestore';
import { FirestorePermissionError } from './errors';
import { errorEmitter } from './error-emitter';

interface FirebaseContextValue {
  firebaseApp: FirebaseApp | null;
  auth: Auth | null;
  firestore: Firestore | null;
}

const FirebaseContext = createContext<FirebaseContextValue>({
  firebaseApp: null,
  auth: null,
  firestore: null,
});

export const FirebaseProvider = ({
  children,
  firebaseApp,
  auth,
  firestore,
}: {
  children: ReactNode;
} & FirebaseContextValue) => {
  return (
    <FirebaseContext.Provider
      value={{
        firebaseApp,
        auth,
        firestore,
      }}
    >
      {children}
      <FirebaseErrorListener />
    </FirebaseContext.Provider>
  );
};

function FirebaseErrorListener() {
  const [error, setError] = useState<FirestorePermissionError | null>(null);

  useEffect(() => {
    const handlePermissionError = (err: FirestorePermissionError) => {
      console.error('Caught Firestore Permission Error:', err);
      setError(err);
    };

    errorEmitter.on('permission-error', handlePermissionError);

    return () => {
      errorEmitter.removeListener('permission-error', handlePermissionError);
    };
  }, []);

  if (!error) {
    return null;
  }

  // This is a basic error display. In a real app, you might use a toast or a modal.
  if (process.env.NODE_ENV === 'development') {
    return (
      <div
        style={{
          position: 'fixed',
          bottom: '10px',
          left: '10px',
          backgroundColor: 'red',
          color: 'white',
          padding: '10px',
          borderRadius: '5px',
          zIndex: 1000,
        }}
      >
        <h4>Firestore Permission Error (Dev Only)</h4>
        <pre style={{ whiteSpace: 'pre-wrap', fontSize: '12px' }}>{error.message}</pre>
        <button onClick={() => setError(null)} style={{ marginTop: '10px' }}>
          Dismiss
        </button>
      </div>
    );
  }

  return null;
}


export const useFirebase = () => useContext(FirebaseContext);
export const useFirebaseApp = () => useContext(FirebaseContext).firebaseApp;
export const useFirestore = () => useContext(FirebaseContext).firestore;
export const useAuth = () => useContext(FirebaseContext).auth;
