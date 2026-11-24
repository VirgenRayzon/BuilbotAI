'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  createUserWithEmailAndPassword,
  setPersistence,
  browserSessionPersistence,
  signInWithPopup,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import { useAuth, useFirestore, getGoogleProvider, formatGoogleAuthError } from '@/firebase';
import { registerManagerAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { useUserProfile } from '@/context/user-profile';
import {
  emailFieldSchema,
  getAuthErrorMessage,
  nameFieldSchema,
  passwordFieldSchema,
} from '@/lib/auth-validation';
import { formatFullName, normalizeName, splitDisplayName } from '@/lib/user-name';

export const managerSignUpSchema = z.object({
  firstName: nameFieldSchema('First name'),
  lastName: nameFieldSchema('Last name'),
  email: emailFieldSchema,
  password: passwordFieldSchema,
  managerKey: z.string().min(1, 'Default manager access key is required.'),
});

export type ManagerSignUpFormValues = z.infer<typeof managerSignUpSchema>;

const EMAIL_IN_USE_MSG =
  'An account with this email address already exists. Please sign in via System Access.';

export function useManagerSignUpForm() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const isSubmittingRef = useRef(false);

  const [googleModalOpened, setGoogleModalOpened] = useState(false);
  const [googleUserCredential, setGoogleUserCredential] = useState<User | null>(null);
  const [googleManagerKey, setGoogleManagerKey] = useState('');
  const [googleKeyError, setGoogleKeyError] = useState<string | null>(null);

  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const { authUser, profile, loading: authLoading } = useUserProfile();

  useEffect(() => {
    if (isSubmittingRef.current || loading || googleLoading) return;

    if (!authLoading && authUser && profile) {
      const isStaff = Boolean(profile.isManager || profile.isSuperAdmin);
      const activeAdminMarker =
        typeof window !== 'undefined'
          ? sessionStorage.getItem('buildbot_admin_session_active')
          : null;

      if (isStaff && activeAdminMarker === authUser.uid) {
        router.push('/admin');
      } else if (!isStaff) {
        router.push('/builder');
      }
    }
  }, [authUser, profile, authLoading, router, loading, googleLoading]);

  const form = useForm<ManagerSignUpFormValues>({
    resolver: zodResolver(managerSignUpSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      managerKey: '',
    },
  });

  const passwordValue = form.watch('password') || '';

  const onSubmit = async (values: ManagerSignUpFormValues) => {
    isSubmittingRef.current = true;
    setLoading(true);
    setError(null);
    if (!auth || !firestore) {
      isSubmittingRef.current = false;
      setLoading(false);
      return;
    }

    let createdUser: User | null = null;

    try {
      await setPersistence(auth, browserSessionPersistence);
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        values.email.trim(),
        values.password
      );
      createdUser = userCredential.user;

      const firstName = normalizeName(values.firstName);
      const lastName = normalizeName(values.lastName);
      const fullName = formatFullName(firstName, lastName);

      await updateProfile(createdUser, { displayName: fullName });

      const idToken = await createdUser.getIdToken(true);
      const result = await registerManagerAction(idToken, values.managerKey, {
        firstName,
        lastName,
        name: fullName,
      });

      if (result.error) {
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('buildbot_admin_session_active');
        }
        try {
          await createdUser.delete();
        } catch {
          await signOut(auth);
        }
        setError(result.error);
        return;
      }

      if (typeof window !== 'undefined') {
        sessionStorage.setItem('buildbot_admin_session_active', createdUser.uid);
      }

      await createdUser.getIdToken(true);

      toast({
        title: 'Manager Account Created',
        description: 'Welcome to the Buildbot AI Management Portal.',
      });

      router.push('/admin');
    } catch (err: unknown) {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('buildbot_admin_session_active');
      }
      try {
        if (createdUser) {
          await createdUser.delete();
        } else {
          await signOut(auth);
        }
      } catch (signOutErr) {
        console.error('Error signing out after registration error:', signOutErr);
      }

      setError(
        getAuthErrorMessage(err, 'An error occurred during manager signup.', EMAIL_IN_USE_MSG)
      );
    } finally {
      isSubmittingRef.current = false;
      setLoading(false);
    }
  };

  const handleGoogleSignUpInitiate = async () => {
    if (!auth) return;
    setGoogleLoading(true);
    setError(null);

    try {
      await setPersistence(auth, browserSessionPersistence);
      const provider = getGoogleProvider();
      const result = await signInWithPopup(auth, provider);

      setGoogleUserCredential(result.user);
      setGoogleModalOpened(true);
    } catch (err: unknown) {
      const msg = formatGoogleAuthError(err);
      if (msg) {
        setError(msg);
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleCloseGoogleModal = () => {
    setGoogleModalOpened(false);
    if (auth) {
      void signOut(auth);
    }
  };

  const handleGoogleManagerKeySubmit = async () => {
    if (!googleUserCredential || !googleManagerKey.trim()) {
      setGoogleKeyError('Manager access key is required.');
      return;
    }

    setGoogleLoading(true);
    setGoogleKeyError(null);

    try {
      const user = googleUserCredential;
      const idToken = await user.getIdToken();
      const parsedName = splitDisplayName(user.displayName);

      const result = await registerManagerAction(
        idToken,
        googleManagerKey.trim(),
        parsedName.name ? parsedName : undefined
      );

      if (result.error) {
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('buildbot_admin_session_active');
        }
        if (auth) await signOut(auth);
        setGoogleKeyError(result.error);
        setGoogleLoading(false);
        return;
      }

      if (typeof window !== 'undefined') {
        sessionStorage.setItem('buildbot_admin_session_active', user.uid);
      }

      await user.getIdToken(true);

      setGoogleModalOpened(false);
      toast({
        title: 'Manager Account Activated',
        description: 'Google authentication verified for manager role.',
      });

      router.push('/admin');
    } catch (err: unknown) {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('buildbot_admin_session_active');
      }
      try {
        if (auth) await signOut(auth);
      } catch (signOutErr) {
        console.error('Sign out error:', signOutErr);
      }
      setGoogleKeyError(
        getAuthErrorMessage(
          err,
          'Failed to complete manager registration.',
          EMAIL_IN_USE_MSG
        )
      );
    } finally {
      setGoogleLoading(false);
    }
  };

  return {
    form,
    error,
    loading,
    googleLoading,
    passwordValue,
    googleModalOpened,
    googleUserEmail: googleUserCredential?.email ?? null,
    googleManagerKey,
    setGoogleManagerKey,
    googleKeyError,
    handleGoogleSignUpInitiate,
    handleCloseGoogleModal,
    handleGoogleManagerKeySubmit,
    onSubmit,
  };
}

