'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  createUserWithEmailAndPassword,
  setPersistence,
  browserLocalPersistence,
  updateProfile,
} from 'firebase/auth';
import { useAuth, useFirestore, executeCustomerGoogleAuth } from '@/firebase';
import { createUserProfile } from '@/firebase/database';
import { syncUserClaimsAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { useUserProfile } from '@/context/user-profile';
import {
  emailFieldSchema,
  getAuthErrorMessage,
  nameFieldSchema,
  passwordFieldSchema,
} from '@/lib/auth-validation';
import { formatFullName, normalizeName } from '@/lib/user-name';

export const signUpFormSchema = z.object({
  firstName: nameFieldSchema('First name'),
  lastName: nameFieldSchema('Last name'),
  email: emailFieldSchema,
  password: passwordFieldSchema,
  terms: z.boolean().refine((val) => val === true, {
    message: 'You must accept the Terms and Conditions.',
  }),
});

export type SignUpFormValues = z.infer<typeof signUpFormSchema>;

const EMAIL_IN_USE_MSG = 'An account with this email address already exists. Please sign in instead.';

export function useSignUpForm() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [toaOpened, setToaOpened] = useState(true);

  const redirectingRef = useRef(false);

  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const { authUser, profile, loading: authLoading } = useUserProfile();

  useEffect(() => {
    if (loading || googleLoading || redirectingRef.current) return;
    if (!authLoading && authUser && profile) {
      redirectingRef.current = true;
      if (profile.isManager || profile.isSuperAdmin) {
        router.replace('/admin');
      } else {
        router.replace('/parts');
      }
    }
  }, [authUser, profile, authLoading, router, loading, googleLoading]);

  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpFormSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      terms: false,
    },
  });

  const { setValue, watch } = form;
  const passwordValue = watch('password') || '';
  const termsValue = watch('terms');

  const handleAcceptToa = () => {
    setValue('terms', true, { shouldValidate: true });
    setToaOpened(false);
    toast({
      title: 'Terms Accepted',
      description: 'You can now proceed with your registration.',
    });
  };

  const onSubmit = async (values: SignUpFormValues) => {
    setLoading(true);
    setError(null);
    if (!auth || !firestore) {
      setLoading(false);
      return;
    }

    try {
      await setPersistence(auth, browserLocalPersistence);
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        values.email.trim(),
        values.password
      );
      const user = userCredential.user;

      const firstName = normalizeName(values.firstName);
      const lastName = normalizeName(values.lastName);
      const fullName = formatFullName(firstName, lastName);

      await updateProfile(user, { displayName: fullName });

      await createUserProfile(firestore, user.uid, {
        email: user.email || values.email.trim(),
        name: fullName,
        firstName,
        lastName,
        isManager: false,
        isSuperAdmin: false,
        createdAt: new Date().toISOString(),
      });

      const idToken = await user.getIdToken();
      await syncUserClaimsAction(idToken);
      await user.getIdToken(true);

      toast({
        title: 'Account Created',
        description: "Welcome to Netcodex! You've been successfully signed up.",
      });

      redirectingRef.current = true;
      router.replace('/parts');
    } catch (err: unknown) {
      redirectingRef.current = false;
      setError(getAuthErrorMessage(err, 'An error occurred during registration.', EMAIL_IN_USE_MSG));
    } finally {
      if (!redirectingRef.current) setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    if (!auth || !firestore) return;

    if (!termsValue) {
      setError('Please review and accept the Terms and Conditions before signing up.');
      setToaOpened(true);
      return;
    }

    setGoogleLoading(true);
    setError(null);

    try {
      const result = await executeCustomerGoogleAuth(auth, firestore, { isSignUp: true });

      if (!result.success) {
        if (result.error) {
          setError(result.error);
        }
        return;
      }

      toast({
        title: 'Account Connected',
        description: 'Signed up with Google successfully! Welcome to Netcodex.',
      });
      redirectingRef.current = true;
      router.replace('/parts');
    } catch (err: unknown) {
      redirectingRef.current = false;
      setError(
        getAuthErrorMessage(
          err,
          'Failed to sign up with Google. Please try again.',
          EMAIL_IN_USE_MSG
        )
      );
    } finally {
      if (!redirectingRef.current) setGoogleLoading(false);
    }
  };

  const isRedirecting = Boolean((authUser && !loading && !googleLoading) || redirectingRef.current);

  return {
    form,
    error,
    loading,
    googleLoading,
    toaOpened,
    setToaOpened,
    passwordValue,
    termsValue,
    isRedirecting,
    handleAcceptToa,
    handleGoogleSignUp,
    onSubmit,
  };
}
