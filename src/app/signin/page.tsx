'use client';

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
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
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
import { UnifiedBackground } from '@/components/landing/unified-background';
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

function SignInContent() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const redirectingRef = useRef(false);
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const router = useRouter();
  const searchParams = useSearchParams();
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const { authUser, profile, loading: authLoading } = useUserProfile();

  const reason = searchParams?.get('reason');

  // Redirect if already logged in (never redirect while actively logging in)
  useEffect(() => {
    if (loading || googleLoading || redirectingRef.current) return;
    if (!authLoading && authUser && profile) {
      redirectingRef.current = true;
      router.replace(profile.isManager || profile.isSuperAdmin ? '/admin' : '/builder');
    }
  }, [authUser, profile, authLoading, router, loading, googleLoading]);

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
    let navigating = false;

    try {
      await setPersistence(auth, browserLocalPersistence);
      const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;

      const userDocRef = doc(firestore, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();

        // Prevent Managers/Admins from using normal customer sign in
        if (userData.isManager || userData.isSuperAdmin || userData.isAdmin) {
          await signOut(auth);
          setError('Administrator and Manager accounts must sign in via the System Access portal (/system-access).');
          setLoading(false);
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
      await syncUserClaimsAction(idToken);
      await user.getIdToken(true);

      toast({
        title: 'Signed In',
        description: 'Welcome back to Buildbot AI!',
      });

      redirectingRef.current = true;
      router.replace('/builder');
      navigating = true;
    } catch (err: any) {
      redirectingRef.current = false;
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
      if (!navigating) setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!auth || !firestore) return;
    setGoogleLoading(true);
    setError(null);
    let navigating = false;

    try {
      const result = await executeCustomerGoogleAuth(auth, firestore, { isSignUp: false });

      if (!result.success) {
        if (result.error) {
          setError(result.error);
        }
        return;
      }

      toast({
        title: 'Signed In',
        description: 'Welcome back to Buildbot AI!',
      });
      redirectingRef.current = true;
      router.replace('/builder');
      navigating = true;
    } catch (err: any) {
      redirectingRef.current = false;
      setError(err.message || 'Failed to sign in with Google. Please try again.');
    } finally {
      if (!navigating) setGoogleLoading(false);
    }
  };

  // An existing session is being restored or redirected. Keep the sign-in form
  // out of view without interrupting an active submission's loading state.
  if (authUser && !loading && !googleLoading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center gap-3 bg-slate-50 text-slate-600 dark:bg-[#0c0f14] dark:text-slate-300" role="status">
        <Loader size="sm" color="cyan" />
        <Text size="sm">Opening your workspace...</Text>
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
      <UnifiedBackground />

      <div className="w-full max-w-[540px] z-10 flex flex-col gap-3">
        {/* Navigation & Brand Header */}
        <div className="flex items-center justify-start px-1">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-cyan-600 dark:text-slate-400 dark:hover:text-cyan-400 transition-all duration-200 group"
          >
            <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
            Back to Home
          </Link>
        </div>

        <Paper
          withBorder
          radius="xl"
          p={{ base: 'lg', sm: 36 }}
          className="w-full bg-white/95 dark:bg-[#111722]/95 backdrop-blur-md border-slate-200 dark:border-white/10 shadow-2xl shadow-cyan-950/10 relative transition-all"
        >
          <Stack gap="lg">
            {/* Header / Logo + Title */}
            <div className="text-center flex flex-col items-center gap-2">
              <Link href="/" className="mb-1">
                <Logo showText={false} />
              </Link>
              <Title
                order={2}
                className="text-2xl sm:text-3xl font-bold font-headline tracking-tight text-slate-900 dark:text-slate-100"
              >
                Welcome back!
              </Title>
              <Text size="sm" className="text-slate-500 dark:text-slate-400">
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
            {error && (
              <Alert
                color="red"
                variant="light"
                radius="md"
                icon={<AlertCircle size={16} />}
                title="Authentication Error"
                className="text-xs"
              >
                {error}
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
