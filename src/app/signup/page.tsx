'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth, useFirestore, executeCustomerGoogleAuth, GoogleIcon } from '@/firebase';
import {
  createUserWithEmailAndPassword,
  setPersistence,
  browserLocalPersistence,
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
  Checkbox,
  Divider,
  Progress,
  Loader,
} from '@mantine/core';
import { Mail, Lock, AlertCircle, ArrowLeft, Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createUserProfile } from '@/firebase/database';
import { syncUserClaimsAction } from '@/app/actions';
import { UnifiedBackground } from '@/components/landing/unified-background';
import { useTheme } from '@/context/theme-provider';
import { cn } from '@/lib/utils';
import { useUserProfile } from '@/context/user-profile';
import { TermsOfAgreementModal } from '@/components/auth/terms-of-agreement-modal';
import { Logo } from '@/components/logo';

const formSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters.')
    .regex(/[0-9]/, 'Password must include at least one number')
    .regex(/[a-z]/, 'Password must include at least one lowercase letter')
    .regex(/[A-Z]/, 'Password must include at least one uppercase letter'),
  terms: z.boolean().refine((val) => val === true, {
    message: 'You must accept the Terms and Conditions.',
  }),
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

export default function SignUpPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [toaOpened, setToaOpened] = useState(false);

  const redirectingRef = useRef(false);

  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const { authUser, profile, loading: authLoading } = useUserProfile();

  // Redirect if already logged in (never redirect while actively registering)
  useEffect(() => {
    if (loading || googleLoading || redirectingRef.current) return;
    if (!authLoading && authUser && profile) {
      redirectingRef.current = true;
      if (profile.isManager || profile.isSuperAdmin) {
        router.replace('/admin');
      } else {
        router.replace('/builder');
      }
    }
  }, [authUser, profile, authLoading, router, loading, googleLoading]);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
      terms: false,
    },
  });

  const passwordValue = watch('password') || '';
  const termsValue = watch('terms');
  const strength = getPasswordStrength(passwordValue);

  const handleAcceptToa = () => {
    setValue('terms', true, { shouldValidate: true });
    setToaOpened(false);
    toast({
      title: 'Terms Accepted',
      description: 'You can now proceed with your registration.',
    });
  };

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    setError(null);
    if (!auth || !firestore) return;

    try {
      await setPersistence(auth, browserLocalPersistence);
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;

      await createUserProfile(firestore, user.uid, {
        email: user.email!,
        isManager: false,
        isSuperAdmin: false,
      });

      const idToken = await user.getIdToken();
      await syncUserClaimsAction(idToken);
      await user.getIdToken(true);

      toast({
        title: 'Account Created',
        description: "Welcome to Buildbot AI! You've been successfully signed up.",
      });

      redirectingRef.current = true;
      router.replace('/builder');
    } catch (err: any) {
      redirectingRef.current = false;
      if (err.code === 'auth/email-already-in-use') {
        setError('An account with this email address already exists. Please sign in instead.');
      } else {
        setError(err.message || 'An error occurred during registration.');
      }
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
        description: 'Signed up with Google successfully! Welcome to Buildbot AI.',
      });
      redirectingRef.current = true;
      router.replace('/builder');
    } catch (err: any) {
      redirectingRef.current = false;
      setError(err.message || 'Failed to sign up with Google. Please try again.');
    } finally {
      if (!redirectingRef.current) setGoogleLoading(false);
    }
  };

  // If already authenticated or in process of redirecting, do not flash the registration form
  if ((authUser && !loading && !googleLoading) || redirectingRef.current) {
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

      <div className="w-full max-w-[440px] z-10 flex flex-col gap-2.5">
        {/* Top bar back link */}
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
          className="w-full bg-white/85 dark:bg-[#141a23]/90 backdrop-blur-md border-slate-200/80 dark:border-white/10 shadow-sm relative transition-all"
        >
          <Stack gap="md">
            {/* Header / Logo + Title */}
            <div className="text-center flex flex-col items-center gap-1.5">
              <Link href="/" className="mb-0.5">
                <Logo showText={false} />
              </Link>
              <Title
                order={2}
                className="text-xl sm:text-2xl font-bold font-headline tracking-tight text-slate-900 dark:text-slate-100"
              >
                Create an account
              </Title>
              <Text size="xs" className="text-slate-500 dark:text-slate-400">
                Join Buildbot AI to configure, optimize, and simulate your custom PC builds.
              </Text>
            </div>

            {/* Social Registration */}
            <Button
              variant="default"
              size="md"
              radius="md"
              leftSection={<GoogleIcon />}
              loading={googleLoading}
              onClick={handleGoogleSignUp}
              className="h-11 border-slate-300 dark:border-white/15 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/60 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-sm transition-all shadow-sm"
            >
              Sign up with Google
            </Button>

            <Divider
              label="or sign up with email"
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
                      <PasswordInput
                        label="Password"
                        placeholder="Create a strong password"
                        radius="md"
                        size="md"
                        leftSection={<Lock size={16} className="text-slate-400" />}
                        error={errors.password?.message}
                        classNames={{
                          label: 'text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5',
                          input:
                            'bg-slate-50 dark:bg-slate-900/50 border-slate-300 dark:border-white/10 text-slate-900 dark:text-slate-100 font-medium focus:border-cyan-500 transition-colors',
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
                            color={strength <= 25 ? 'red' : strength <= 50 ? 'yellow' : strength <= 75 ? 'cyan' : 'teal'}
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

                {/* Terms and Conditions Checkbox */}
                <Controller
                  name="terms"
                  control={control}
                  render={({ field }) => (
                    <div>
                      <Paper
                        p="xs"
                        radius="md"
                        withBorder
                        className={cn(
                          'transition-colors',
                          field.value
                            ? 'bg-cyan-500/10 border-cyan-500/30'
                            : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-white/10'
                        )}
                      >
                        <Checkbox
                          checked={field.value}
                          onChange={(e) => {
                            if (!e.currentTarget.checked) {
                              field.onChange(false);
                            } else {
                              setToaOpened(true);
                            }
                          }}
                          color="cyan"
                          size="xs"
                          label={
                            <Text size="xs" className="text-slate-700 dark:text-slate-300 select-none">
                              I accept the{' '}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  setToaOpened(true);
                                }}
                                className="text-cyan-600 dark:text-cyan-400 font-bold underline underline-offset-2 hover:text-cyan-500"
                              >
                                Terms and Conditions
                              </button>
                            </Text>
                          }
                        />
                      </Paper>
                      {errors.terms && (
                        <Text size="xs" c="red" mt={4}>
                          {errors.terms.message}
                        </Text>
                      )}
                    </div>
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
                  Create Account
                </Button>
              </Stack>
            </form>

            {/* Footer Links */}
            <div className="text-center text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-white/10">
              Already have an account?{' '}
              <Anchor
                component={Link}
                href="/signin"
                className="font-bold text-cyan-600 dark:text-cyan-400 hover:underline"
              >
                Sign in
              </Anchor>
            </div>
          </Stack>
        </Paper>
      </div>

      {/* Terms of Agreement Modal */}
      <TermsOfAgreementModal
        opened={toaOpened}
        onClose={() => setToaOpened(false)}
        onAccept={handleAcceptToa}
        isAccepted={termsValue}
      />
    </div>
  );
}
