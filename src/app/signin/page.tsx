'use client';

import { safeProductReturn } from '@/lib/product-identity';
import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth, useFirestore, executeCustomerGoogleAuth, GoogleIcon } from '@/firebase';
import {
  signInWithEmailAndPassword,
  signOut,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from 'firebase/auth';
import { doc, getDocFromServer, setDoc } from 'firebase/firestore';
import { syncUserClaimsAction } from '@/app/actions';
import {
  Paper,
  Title,
  Text,
  TextInput,
  PasswordInput,
  Button,
  Alert,
  ThemeIcon,
  Stack,
  Group,
  Anchor,
  Divider,
  Checkbox,
  Loader,
} from '@mantine/core';
import { LogIn, Mail, Lock, AlertCircle, ArrowLeft, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AuthBackground } from '@/components/auth/auth-background';
import { useTheme } from '@/context/theme-provider';
import { cn } from '@/lib/utils';
import { useUserProfile } from '@/context/user-profile';
import { Logo } from '@/components/logo';

const formSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
  rememberMe: z.boolean().optional(),
});

type FormValues = z.infer<typeof formSchema>;
const staffSignInError = 'This is a staff account. Sign in through System Access with your access key.';
// Survives a temporary page remount while Firebase Auth/profile state changes.
let customerSignInInProgress = false;

function SignInContent() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const redirectingRef = useRef(false);
  const rejectingStaffRef = useRef<string | null>(null);
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const router = useRouter();
  const searchParams = useSearchParams();
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const { authUser, profile, loading: authLoading, status: profileStatus } = useUserProfile();

  const returnTo = safeProductReturn(searchParams?.get('returnTo') ?? null);
  const reason = searchParams?.get('reason');
  const visibleError = error || (!loading && !googleLoading && reason === 'staff_account' ? staffSignInError : null);

  // Customer sign-in must never route a staff session into the admin portal.
  useEffect(() => {
    if (customerSignInInProgress || loading || googleLoading || redirectingRef.current) return;
    if (authUser && (profileStatus === 'missing' || profileStatus === 'error')) {
      if (!auth || rejectingStaffRef.current === authUser.uid) return;
      rejectingStaffRef.current = authUser.uid;
      void signOut(auth)
        .then(() => setError('Unable to verify this account. Please try again.'))
        .catch(() => setError('Unable to end the session. Please try again.'))
        .finally(() => { rejectingStaffRef.current = null; });
      return;
    }
    if (!authLoading && authUser && profile) {
      if (profile.isManager || profile.isSuperAdmin || ('isAdmin' in profile && profile.isAdmin)) {
        if (!auth || rejectingStaffRef.current === authUser.uid) return;
        rejectingStaffRef.current = authUser.uid;
        sessionStorage.removeItem('buildbot_admin_session_active');
        void signOut(auth)
          .then(() => {
            setError(staffSignInError);
            router.replace('/signin?reason=staff_account');
          })
          .catch(() => setError('Unable to end the staff session. Please try again.'))
          .finally(() => { rejectingStaffRef.current = null; });
        return;
      }
      redirectingRef.current = true;
      router.replace(returnTo);
    }
  }, [auth, authUser, profile, authLoading, profileStatus, router, loading, googleLoading, returnTo]);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: true,
    },
  });

  const onSubmit = async (values: FormValues) => {
    if (!auth || !firestore) {
      setError('Sign-in is unavailable right now. Please try again.');
      return;
    }
    setLoading(true);
    setError(null);
    customerSignInInProgress = true;
    let navigating = false;
    let signedInUserId: string | null = null;

    try {
      // Keep the provisional Auth session tab-scoped until the account is verified.
      sessionStorage.removeItem('buildbot_admin_session_active');
      await setPersistence(auth, browserSessionPersistence);
      const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;
      signedInUserId = user.uid;
      const tokenResult = await user.getIdTokenResult(true);
      const hasStaffClaim = tokenResult.claims.isManager === true ||
        tokenResult.claims.isSuperAdmin === true || tokenResult.claims.isAdmin === true;
      if (hasStaffClaim) {
        await signOut(auth);
        setError(staffSignInError);
        router.replace('/signin?reason=staff_account');
        return;
      }

      const userDocRef = doc(firestore, 'users', user.uid);
      const userDoc = await getDocFromServer(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();

        if (userData.isManager || userData.isSuperAdmin || userData.isAdmin) {
          await signOut(auth);
          setError(staffSignInError);
          router.replace('/signin?reason=staff_account');
          return;
        }
      } else {
        // If profile is missing in Firestore, create standard customer profile
        const newProfile = {
          email: user.email,
          name: user.displayName || user.email?.split('@')[0] || 'User',
          photoURL: user.photoURL || '',
          isManager: false,
          isSuperAdmin: false,
          createdAt: new Date().toISOString(),
        };
        await setDoc(userDocRef, newProfile);
      }

      // Synchronize claims and refresh client token
      const idToken = await user.getIdToken();
      const claimsResult = await syncUserClaimsAction(idToken);
      if ('error' in claimsResult) throw new Error('Unable to verify account permissions. Please try again.');
      if (claimsResult.isManager || claimsResult.isSuperAdmin) {
        await signOut(auth);
        setError(staffSignInError);
        router.replace('/signin?reason=staff_account');
        return;
      }
      await user.getIdToken(true);
      await setPersistence(auth, values.rememberMe ? browserLocalPersistence : browserSessionPersistence);

      toast({
        title: 'Signed In',
        description: 'Welcome back to Netcodex!',
      });

      redirectingRef.current = true;
      router.replace(returnTo);
      navigating = true;
    } catch (err: any) {
      redirectingRef.current = false;
      if (signedInUserId && auth.currentUser?.uid === signedInUserId) {
        try {
          await signOut(auth);
        } catch {
          setError('Unable to end the sign-in attempt. Please try again.');
          return;
        }
      }
      const msg = err.message || 'An error occurred during sign-in.';
      if (
        msg.includes('auth/invalid-credential') ||
        msg.includes('auth/user-not-found') ||
        msg.includes('auth/wrong-password')
      ) {
        setError('Invalid email or password. Please try again.');
      } else {
        setError(msg);
      }
    } finally {
      customerSignInInProgress = false;
      if (!navigating) setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!auth || !firestore) return;
    setGoogleLoading(true);
    setError(null);
    customerSignInInProgress = true;
    let navigating = false;

    try {
      const result = await executeCustomerGoogleAuth(auth, firestore, { isSignUp: false });

      if (!result.success) {
        const googleSignInError = result.error
          ?? 'Google sign-in was cancelled. Please try again when you are ready.';
        setError(googleSignInError);
        if (googleSignInError === staffSignInError) router.replace('/signin?reason=staff_account');
        return;
      }

      toast({
        title: 'Signed In',
        description: 'Welcome back to Netcodex!',
      });
      redirectingRef.current = true;
      router.replace(returnTo);
      navigating = true;
    } catch (err: any) {
      redirectingRef.current = false;
      setError(err.message || 'Failed to sign in with Google. Please try again.');
    } finally {
      customerSignInInProgress = false;
      if (!navigating) setGoogleLoading(false);
    }
  };

  // An existing session is being restored or redirected. Keep the sign-in form
  // out of view without interrupting an active submission's loading state.
  if ((authUser || redirectingRef.current) && !loading && !googleLoading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center gap-3 bg-slate-50 text-slate-600 dark:bg-[#0c0f14] dark:text-slate-300" role="status">
        <Loader size="sm" color="cyan" />
        <Text size="sm">Verifying your account...</Text>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'relative min-h-[calc(100vh-4rem)] flex items-center justify-center transition-colors duration-1000 overflow-hidden py-10 px-4',
        isDark ? 'text-foreground' : 'text-slate-900'
      )}
    >
      <AuthBackground />

      <div className="w-full max-w-[440px] z-10 flex flex-col gap-2.5">
        {/* Navigation & Brand Header */}
        <div className="flex items-center justify-start px-1">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-cyan-600 dark:text-slate-400 dark:hover:text-cyan-400 transition-all duration-200 group"
          >
            <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
            Back to Home
          </Link>
        </div>

        <Paper
          withBorder
          radius="lg"
          p={{ base: 'md', sm: 'lg' }}
          className="w-full bg-white/85 dark:bg-[#111722] border-slate-200/80 dark:border-white/10 shadow-sm relative transition-all"
        >
          <Stack gap="md">
            {/* Header / Logo + Title */}
            <div className="text-center flex flex-col items-center gap-1.5">
              <Link href="/" className="mb-0.5">
                <Logo showText={false} size="lg" />
              </Link>
              <Title
                order={2}
                className="text-xl sm:text-2xl font-bold font-headline tracking-tight text-slate-900 dark:text-slate-100"
              >
                Welcome back!
              </Title>
              <Text size="xs" className="text-slate-500 dark:text-slate-400">
                Sign in to customize, save, and manage your PC configurations.
              </Text>
            </div>

            {/* Social Authentication */}
            <Button
              variant="default"
              size="md"
              radius="md"
              leftSection={<GoogleIcon />}
              loading={googleLoading}
              onClick={handleGoogleSignIn}
              className="h-11 border-slate-300 dark:border-white/15 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/60 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-sm transition-all shadow-sm"
            >
              Continue with Google
            </Button>

            <Divider
              label="or continue with email"
              labelPosition="center"
              color={isDark ? 'dark.5' : 'gray.3'}
              classNames={{
                label: 'text-[11px] uppercase tracking-wider font-semibold text-slate-400 dark:text-slate-500',
              }}
            />

            {/* Session Timeout Notice */}
            {reason === 'idle_timeout' && !error && (
              <Alert
                color="yellow"
                variant="light"
                radius="md"
                icon={<Clock size={16} />}
                title="Session Expired"
                className="text-xs"
              >
                Your session expired due to inactivity. Please sign in again to continue your build.
              </Alert>
            )}

            {/* Error Message */}
            {visibleError && (
              <Alert
                color="red"
                variant="light"
                radius="md"
                icon={<AlertCircle size={16} />}
                title="Authentication Error"
                className="text-xs"
              >
                {visibleError}
              </Alert>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)}>
              <Stack gap="md">
                <Controller
                  name="email"
                  control={control}
                  render={({ field }) => (
                    <TextInput
                      label="Email Address"
                      type="email"
                      placeholder="name@example.com"
                      radius="md"
                      size="md"
                      leftSection={<Mail size={16} className="text-slate-400" />}
                      error={errors.email?.message}
                      classNames={{
                        label: 'text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5',
                        input:
                          'bg-slate-50 dark:bg-slate-900/50 border-slate-300 dark:border-white/10 text-slate-900 dark:text-slate-100 font-medium focus:border-cyan-500 transition-colors',
                      }}
                      {...field}
                    />
                  )}
                />

                <Controller
                  name="password"
                  control={control}
                  render={({ field }) => (
                    <div>
                      <Group justify="space-between" mb={4}>
                        <Text
                          size="xs"
                          fw={700}
                          className="uppercase tracking-wider text-slate-700 dark:text-slate-300"
                        >
                          Password
                        </Text>
                        <Anchor
                          component={Link}
                          href="/forgot-password"
                          className="text-xs text-cyan-600 dark:text-cyan-400 hover:underline font-semibold"
                        >
                          Forgot password?
                        </Anchor>
                      </Group>
                      <PasswordInput
                        placeholder="••••••••"
                        radius="md"
                        size="md"
                        leftSection={<Lock size={16} className="text-slate-400" />}
                        error={errors.password?.message}
                        classNames={{
                          input:
                            'bg-slate-50 dark:bg-slate-900/50 border-slate-300 dark:border-white/10 text-slate-900 dark:text-slate-100 font-medium focus:border-cyan-500 transition-colors',
                        }}
                        {...field}
                      />
                    </div>
                  )}
                />

                <Controller
                  name="rememberMe"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      checked={field.value}
                      onChange={field.onChange}
                      color="cyan"
                      size="xs"
                      label={
                        <Text size="xs" className="text-slate-600 dark:text-slate-400 select-none">
                          Remember this browser session
                        </Text>
                      }
                    />
                  )}
                />

                <Button
                  type="submit"
                  fullWidth
                  size="md"
                  radius="md"
                  color="cyan"
                  loading={loading}
                  className="h-11 font-headline font-bold uppercase tracking-[0.16em] text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 shadow-md shadow-cyan-500/20 hover:shadow-cyan-500/35 transition-all mt-2"
                >
                  Sign In
                </Button>
              </Stack>
            </form>

            {/* Footer Links */}
            <div className="text-center text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-white/10">
              Don&apos;t have an account yet?{' '}
              <Anchor
                component={Link}
                href="/signup"
                className="font-bold text-cyan-600 dark:text-cyan-400 hover:underline"
              >
                Create an account
              </Anchor>
            </div>
          </Stack>
        </Paper>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <React.Suspense fallback={null}>
      <SignInContent />
    </React.Suspense>
  );
}
