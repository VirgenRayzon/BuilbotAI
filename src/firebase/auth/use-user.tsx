
'use client';
import { type User, onIdTokenChanged } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { useAuth } from '..';

export const useUser = () => {
  const auth = useAuth();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (!auth) {
      return;
    }
    const unsubscribe = onIdTokenChanged(auth, (user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, [auth]);
  return user;
};
