'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth, useFirestore, getGoogleProvider, formatGoogleAuthError, GoogleIcon } from '@/firebase';
import {
  createUserWithEmailAndPassword,
  setPersistence,
  browserSessionPersistence,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import {
  Paper,
  Title,
  Text,
  TextInput,
  PasswordInput,
  Button,
  Alert,
  Stack,
  Anchor,
  Divider,
  Progress,
  Modal,
} from '@mantine/core';
import { Mail, Lock, Key, AlertCircle, ArrowLeft, Check, X, ShieldAlert } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { registerManagerAction } from '@/app/actions';
import { UnifiedBackground } from '@/components/landing/unified-background';
import { useTheme } from '@/context/theme-provider';
import { cn } from '@/lib/utils';
import { useUserProfile } from '@/context/user-profile';

const formSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters.')
    .regex(/[0-9]/, 'Password must include at least one number')
    .regex(/[a-z]/, 'Password must include at least one lowercase letter')
    .regex(/[A-Z]/, 'Password must include at least one uppercase letter'),
  managerKey: z.string().min(1, 'Default manager access key is required.'),
});

type FormValues = z.infer<typeof formSchema>;

function getPasswordStrength(password: string) {
  let score = 0;
  if (password.length >= 6) score += 25;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 25;
  if (/\d/.test(password)) score += 25;
  if (/[^A-Za-z0-9]/.test(password)) score += 25;
  return score;
}

export default function ManagerSignupPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const isSubmittingRef = useRef(false);
  
  // Modal for Google signup key prompt
  const [googleModalOpened, setGoogleModalOpened] = useState(false);
  const [googleUserCredential, setGoogleUserCredential] = useState<any>(null);
  const [googleManagerKey, setGoogleManagerKey] = useState('');
  const [googleKeyError, setGoogleKeyError] = useState<string | null>(null);

  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const { authUser, profile, loading: authLoading } = useUserProfile();

  // Redirect if already logged in with an active administrator session
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

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
      managerKey: '',
    },
  });

  const passwordValue = watch('password') || '';
  const strength = getPasswordStrength(passwordValue);

  const onSubmit = async (values: FormValues) => {
    isSubmittingRef.current = true;
    setLoading(true);
    setError(null);
    if (!auth || !firestore) {
      isSubmittingRef.current = false;
      setLoading(false);
      return;
    }

    let createdUser: any = null;

    try {
      // Session persistence for administrative security
      await setPersistence(auth, browserSessionPersistence);
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      createdUser = userCredential.user;

      const idToken = await createdUser.getIdToken();
      const result = await registerManagerAction(idToken, values.managerKey);

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

      // Key verification SUCCEEDED! Register active admin session in sessionStorage
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('buildbot_admin_session_active', createdUser.uid);
      }

      await createdUser.getIdToken(true);

      toast({
        title: 'Manager Account Created',
        description: 'Welcome to the Buildbot AI Management Portal.',
      });

      router.push('/admin');
    } catch (err: any) {
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

      if (err.code === 'auth/email-already-in-use') {
        setError('An account with this email address already exists. Please sign in via System Access.');
      } else {
        setError(err.message || 'An error occurred during manager signup.');
      }
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
    } catch (err: any) {
      const msg = formatGoogleAuthError(err);
      if (msg) {
        setError(msg);
      }
    } finally {
      setGoogleLoading(false);
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

      const result = await registerManagerAction(idToken, googleManagerKey.trim());

      if (result.error) {
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('buildbot_admin_session_active');
        }
        await signOut(auth!);
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
    } catch (err: any) {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('buildbot_admin_session_active');
      }
      try {
        await signOut(auth!);
      } catch (signOutErr) {
        console.error('Sign out error:', signOutErr);
      }
      setGoogleKeyError(err.message || 'Failed to complete manager registration.');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div
      className={cn(
        'relative min-h-[calc(100vh-4rem)] flex items-center justify-center transition-colors duration-1000 overflow-hidden py-10 px-4',
        isDark ? 'text-foreground' : 'text-slate-900'
      )}
    >
      <UnifiedBackground />

      <div className="w-full max-w-[460px] z-10 flex flex-col gap-3">
        {/* Top bar */}
        <div className="flex items-center justify-between px-1">
          <Link
            href="/system-access"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400 transition-all duration-200 group"
          >
            <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
            Back to System Access
          </Link>
          <span className="text-[11px] font-mono tracking-widest text-red-500/80 uppercase font-semibold">
            MANAGER ONBOARDING
          </span>
        </div>

        <Paper
          withBorder
          radius="xl"
          p={{ base: 'lg', sm: 36 }}
          className="w-full bg-white/95 dark:bg-[#111722]/95 backdrop-blur-md border-red-500/30 dark:border-red-500/30 shadow-2xl shadow-red-950/20 relative transition-all"
        >
          <Stack gap="lg">
            {/* Header with Red Badge & Shield Icon */}
            <div className="text-center flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-500 shadow-md shadow-red-500/20">
                <ShieldAlert size={26} />
              </div>
              <Title
                order={2}
                className="text-2xl sm:text-3xl font-bold font-headline tracking-tight text-slate-900 dark:text-slate-100"
              >
                Manager Sign Up
              </Title>
              <Text size="sm" className="text-slate-500 dark:text-slate-400">
                Register a new manager account with your default access key.
              </Text>
            </div>

            {/* Social Registration */}
            <Button
              variant="default"
              size="md"
              radius="md"
              leftSection={<GoogleIcon />}
              loading={googleLoading}
              onClick={handleGoogleSignUpInitiate}
              className="h-11 border-slate-300 dark:border-white/15 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/60 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-sm transition-all shadow-sm"
            >
              Sign up with Google
            </Button>

            <Divider
              label="or register with email and key"
              labelPosition="center"
              color={isDark ? 'dark.5' : 'gray.3'}
              classNames={{
                label: 'text-[11px] uppercase tracking-wider font-semibold text-slate-400 dark:text-slate-500',
              }}
            />

            {/* Error Message */}
            {error && (
              <Alert
                color="red"
                variant="light"
                radius="md"
                icon={<AlertCircle size={16} />}
                title="Registration Alert"
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
                      placeholder="manager@example.com"
                      radius="md"
                      size="md"
                      leftSection={<Mail size={16} className="text-slate-400" />}
                      error={errors.email?.message}
                      classNames={{
                        label: 'text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5',
                        input:
                          'bg-slate-50 dark:bg-slate-900/50 border-slate-300 dark:border-white/10 text-slate-900 dark:text-slate-100 font-medium focus:border-red-500 transition-colors',
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
                      <PasswordInput
                        label="Password"
                        placeholder="Create your manager password"
                        radius="md"
                        size="md"
                        leftSection={<Lock size={16} className="text-slate-400" />}
                        error={errors.password?.message}
                        classNames={{
                          label: 'text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5',
                          input:
                            'bg-slate-50 dark:bg-slate-900/50 border-slate-300 dark:border-white/10 text-slate-900 dark:text-slate-100 font-medium focus:border-red-500 transition-colors',
                        }}
                        {...field}
                      />

                      {/* Password Strength Meter */}
                      {field.value && (
                        <div className="mt-2 space-y-1.5">
                          <Progress
                            value={strength}
                            size="xs"
                            radius="xl"
                            color={strength <= 25 ? 'red' : strength <= 50 ? 'yellow' : strength <= 75 ? 'orange' : 'teal'}
                          />
                          <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                            <span className={cn('flex items-center gap-1', field.value.length >= 6 ? 'text-teal-600 dark:text-teal-400 font-medium' : '')}>
                              {field.value.length >= 6 ? <Check size={12} /> : <X size={12} />} 6+ characters
                            </span>
                            <span className={cn('flex items-center gap-1', /\d/.test(field.value) ? 'text-teal-600 dark:text-teal-400 font-medium' : '')}>
                              {/\d/.test(field.value) ? <Check size={12} /> : <X size={12} />} At least 1 number
                            </span>
                            <span className={cn('flex items-center gap-1', /[a-z]/.test(field.value) && /[A-Z]/.test(field.value) ? 'text-teal-600 dark:text-teal-400 font-medium' : '')}>
                              {/[a-z]/.test(field.value) && /[A-Z]/.test(field.value) ? <Check size={12} /> : <X size={12} />} Upper & lowercase
                            </span>
                            <span className={cn('flex items-center gap-1', /[^A-Za-z0-9]/.test(field.value) ? 'text-teal-600 dark:text-teal-400 font-medium' : '')}>
                              {/[^A-Za-z0-9]/.test(field.value) ? <Check size={12} /> : <X size={12} />} Special symbol
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                />

                <Controller
                  name="managerKey"
                  control={control}
                  render={({ field }) => (
                    <PasswordInput
                      label="Default Manager Access Key"
                      placeholder="Enter assigned manager key"
                      radius="md"
                      size="md"
                      leftSection={<Key size={16} className="text-slate-400" />}
                      error={errors.managerKey?.message}
                      classNames={{
                        label: 'text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5',
                        input:
                          'bg-slate-50 dark:bg-slate-900/50 border-slate-300 dark:border-white/10 text-slate-900 dark:text-slate-100 font-mono focus:border-red-500 transition-colors',
                      }}
                      {...field}
                    />
                  )}
                />

                <Button
                  type="submit"
                  fullWidth
                  size="md"
                  radius="md"
                  color="red"
                  loading={loading}
                  className="h-11 font-headline font-bold uppercase tracking-[0.18em] text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 shadow-md shadow-red-600/20 hover:shadow-red-600/35 transition-all mt-2"
                >
                  Create Manager Account
                </Button>
              </Stack>
            </form>

            {/* Footer Links */}
            <div className="text-center text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-white/10">
              Already have manager credentials?{' '}
              <Anchor
                component={Link}
                href="/system-access"
                className="font-bold text-red-600 dark:text-red-400 hover:underline"
              >
                Sign in via System Access
              </Anchor>
            </div>
          </Stack>
        </Paper>
      </div>

      {/* Google Signup Manager Key Prompt Modal */}
      <Modal
        opened={googleModalOpened}
        onClose={() => {
          setGoogleModalOpened(false);
          signOut(auth!);
        }}
        radius="lg"
        centered
        overlayProps={{
          backgroundOpacity: 0.65,
          blur: 4,
        }}
        title={
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-500">
              <Key size={18} />
            </div>
            <div>
              <Title order={4} className="text-base font-bold font-headline uppercase tracking-tight text-slate-900 dark:text-slate-100">
                Verify Manager Key
              </Title>
              <Text size="xs" className="text-slate-500 dark:text-slate-400">
                {googleUserCredential?.email}
              </Text>
            </div>
          </div>
        }
        classNames={{
          content: 'bg-white dark:bg-[#111722] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-100 shadow-2xl',
          header: 'bg-white dark:bg-[#111722] border-b border-slate-200 dark:border-white/10 pb-3',
          body: 'pt-4',
        }}
      >
        <Stack gap="md">
          <Text size="xs" className="text-slate-600 dark:text-slate-300 leading-relaxed">
            Google authentication was successful. To complete your manager onboarding, enter your assigned default manager access key below.
          </Text>

          {googleKeyError && (
            <Alert
              color="red"
              variant="light"
              radius="md"
              icon={<AlertCircle size={16} />}
              title="Key Verification Error"
              className="text-xs"
            >
              {googleKeyError}
            </Alert>
          )}

          <div>
            <Text size="xs" fw={700} className="uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Default Manager Access Key
            </Text>
            <PasswordInput
              placeholder="Enter manager key"
              value={googleManagerKey}
              onChange={(e) => setGoogleManagerKey(e.currentTarget.value)}
              leftSection={<Key size={16} className="text-slate-400" />}
              radius="md"
              size="md"
              classNames={{
                input: 'bg-slate-50 dark:bg-slate-900/50 border-slate-300 dark:border-white/10 text-slate-900 dark:text-slate-100 font-mono focus:border-red-500',
              }}
            />
          </div>

          <div className="flex justify-end gap-2 mt-2">
            <Button
              variant="subtle"
              color="gray"
              size="sm"
              radius="md"
              onClick={() => {
                setGoogleModalOpened(false);
                signOut(auth!);
              }}
              disabled={googleLoading}
              className="text-xs font-semibold"
            >
              Cancel
            </Button>
            <Button
              color="red"
              size="sm"
              radius="md"
              onClick={handleGoogleManagerKeySubmit}
              loading={googleLoading}
              disabled={!googleManagerKey.trim()}
              className="text-xs font-bold uppercase tracking-wider text-white bg-red-600 hover:bg-red-700 shadow-md shadow-red-600/20"
            >
              Confirm & Complete
            </Button>
          </div>
        </Stack>
      </Modal>
    </div>
  );
}
