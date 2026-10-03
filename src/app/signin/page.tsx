'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth, useFirestore } from '@/firebase';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
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
} from '@mantine/core';
import { LogIn, Mail, Lock, AlertCircle, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { UnifiedBackground } from '@/components/landing/unified-background';
import { useTheme } from '@/context/theme-provider';
import { cn } from '@/lib/utils';
import { useUserProfile } from '@/context/user-profile';

const formSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
});

type FormValues = z.infer<typeof formSchema>;

export default function SignInPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const { authUser, profile, loading: authLoading } = useUserProfile();

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && authUser && profile) {
      if (profile.isManager || profile.isSuperAdmin) {
        router.push('/admin');
      } else {
        router.push('/builder');
      }
    }
  }, [authUser, profile, authLoading, router]);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    setError(null);
    if (!auth || !firestore) return;

    try {
      const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;

      const userDocRef = doc(firestore, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();

        // Prevent Managers/Admins from using normal citizen sign in
        if (userData.isManager || userData.isSuperAdmin || userData.isAdmin) {
          await signOut(auth);
          setError('Administrator accounts must use the System Access portal (/system-access).');
          setLoading(false);
          return;
        }
      } else {
        // If profile is missing in Firestore, create basic citizen profile
        const newProfile = {
          email: user.email,
          isManager: false,
          isSuperAdmin: false,
          createdAt: new Date().toISOString(),
        };
        await setDoc(userDocRef, newProfile);
      }

      toast({
        title: 'Signed In',
        description: 'Welcome back!',
      });

      router.push('/builder');
    } catch (err: any) {
      setError(err.message || 'An error occurred during sign-in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={cn(
        'relative min-h-[calc(100vh-4rem)] flex items-center justify-center transition-colors duration-1000 overflow-hidden',
        isDark ? 'text-foreground' : 'text-slate-900'
      )}
    >
      <UnifiedBackground />

      <div className="w-full max-w-md mx-4 z-10 flex flex-col gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-cyan-500 transition-all duration-300 group self-start"
        >
          <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
          Back to Home
        </Link>

        <Paper
          withBorder
          radius="lg"
          p="xl"
          className="w-full bg-white dark:bg-[#111722] border-slate-200 dark:border-white/10 shadow-2xl relative transition-all"
        >
          <Stack gap="lg">
            {/* Header */}
            <Group gap="sm" align="center">
              <ThemeIcon size="lg" radius="md" color="cyan" variant="light">
                <LogIn size={20} />
              </ThemeIcon>
              <div>
                <Title
                  order={2}
                  className="text-2xl font-bold font-headline uppercase tracking-tight text-slate-900 dark:text-slate-100"
                >
                  Sign In
                </Title>
                <Text size="xs" className="text-slate-500 dark:text-slate-400">
                  Welcome back! Enter your details to access your builds.
                </Text>
              </div>
            </Group>

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
                    <div>
                      <Text
                        size="xs"
                        fw={700}
                        className="uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1"
                      >
                        Email Address
                      </Text>
                      <TextInput
                        type="email"
                        placeholder="name@example.com"
                        radius="md"
                        size="md"
                        leftSection={<Mail size={16} className="text-slate-400" />}
                        error={errors.email?.message}
                        classNames={{
                          input:
                            'bg-slate-50 dark:bg-slate-900/50 border-slate-300 dark:border-white/10 text-slate-900 dark:text-slate-100 font-medium focus:border-cyan-500',
                        }}
                        {...field}
                      />
                    </div>
                  )}
                />

                <Controller
                  name="password"
                  control={control}
                  render={({ field }) => (
                    <div>
                      <Text
                        size="xs"
                        fw={700}
                        className="uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1"
                      >
                        Password
                      </Text>
                      <PasswordInput
                        placeholder="••••••••"
                        radius="md"
                        size="md"
                        leftSection={<Lock size={16} className="text-slate-400" />}
                        error={errors.password?.message}
                        classNames={{
                          input:
                            'bg-slate-50 dark:bg-slate-900/50 border-slate-300 dark:border-white/10 text-slate-900 dark:text-slate-100 font-medium focus:border-cyan-500',
                        }}
                        {...field}
                      />
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
                  className="h-12 font-headline font-bold uppercase tracking-[0.18em] text-white shadow-md shadow-cyan-500/20 hover:shadow-cyan-500/35 transition-all mt-1"
                >
                  Sign In
                </Button>
              </Stack>
            </form>

            {/* Footer Links */}
            <div className="text-center text-xs text-slate-500 dark:text-slate-400">
              Don&apos;t have an account?{' '}
              <Anchor
                component={Link}
                href="/signup"
                className="font-bold text-cyan-600 dark:text-cyan-400 hover:underline"
              >
                Sign up
              </Anchor>
            </div>
          </Stack>
        </Paper>
      </div>
    </div>
  );
}
