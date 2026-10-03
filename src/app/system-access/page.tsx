'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth, useFirestore } from '@/firebase';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
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
  SegmentedControl,
  Anchor,
} from '@mantine/core';
import { Shield, Mail, Lock, Key, AlertCircle, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { UnifiedBackground } from '@/components/landing/unified-background';
import { useTheme } from '@/context/theme-provider';
import { cn } from '@/lib/utils';
import { useUserProfile } from '@/context/user-profile';
import { authenticateSystemAccessAction } from '@/app/actions';
import { RequestKeyModal } from './components/request-key-modal';

const formSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
  roleKey: z.string().min(1, 'Role key is required for system access.'),
});

type FormValues = z.infer<typeof formSchema>;
type RoleTab = 'manager' | 'superadmin';

export default function SystemAccessPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<RoleTab>('manager');
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
  const [requestEmail, setRequestEmail] = useState('');
  const [requestLoading, setRequestLoading] = useState(false);

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
    setValue,
    setError: setFieldError,
    clearErrors,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
      roleKey: '',
    },
  });

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    setError(null);
    if (!auth) return;

    try {
      const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;

      const idToken = await user.getIdToken();
      const result = await authenticateSystemAccessAction(idToken, values.roleKey, activeTab);

      if (result.error) {
        await signOut(auth);
        setFieldError('roleKey', { message: result.error });
        setLoading(false);
        return;
      }

      await user.getIdToken(true);

      toast({
        title: 'System Access Granted',
        description: 'Welcome to the administrator dashboard.',
      });

      router.push('/admin');
    } catch (err: any) {
      try {
        await signOut(auth);
      } catch (signOutErr) {
        console.error('Error signing out after authentication failure:', signOutErr);
      }

      const errMsg = err.message || 'An error occurred during system access authentication.';
      if (
        errMsg.includes('auth/invalid-credential') ||
        errMsg.includes('auth/user-not-found') ||
        errMsg.includes('auth/wrong-password')
      ) {
        setError('Invalid admin credentials.');
      } else {
        setError(errMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRequestKey = async () => {
    if (!firestore || !requestEmail) return;
    if (!requestEmail.includes('@')) {
      toast({
        title: 'Invalid Email',
        description: 'Please enter a valid email address.',
        variant: 'destructive',
      });
      return;
    }

    setRequestLoading(true);
    try {
      await addDoc(collection(firestore, 'keyRequests'), {
        email: requestEmail,
        role: 'manager',
        status: 'pending',
        requestedAt: serverTimestamp(),
      });
      toast({
        title: 'Request Sent',
        description: 'Your request for a manager key has been recorded for Super Admin review.',
      });
      setIsRequestDialogOpen(false);
      setRequestEmail('');
    } catch (err) {
      console.error(err);
      toast({
        title: 'Error',
        description: 'Failed to send request. Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setRequestLoading(false);
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value as RoleTab);
    setValue('roleKey', '');
    clearErrors('roleKey');
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
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-red-400 transition-all duration-300 group self-start"
        >
          <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
          Return to public site
        </Link>

        <Paper
          withBorder
          radius="lg"
          p="xl"
          className="w-full bg-white dark:bg-[#111722] border-red-500/30 dark:border-red-500/30 shadow-2xl shadow-red-950/20 relative transition-all"
        >
          <Stack gap="lg">
            {/* Header with Red Accent */}
            <Group gap="sm" align="center">
              <ThemeIcon size="lg" radius="md" color="red" variant="light">
                <Shield size={20} />
              </ThemeIcon>
              <div>
                <Title
                  order={2}
                  className="text-2xl font-bold font-headline uppercase tracking-tight text-red-600 dark:text-red-500"
                >
                  System Access
                </Title>
                <Text size="xs" className="text-slate-500 dark:text-slate-400">
                  Authorized personnel only.
                </Text>
              </div>
            </Group>

            {/* Role Switcher using Mantine SegmentedControl */}
            <SegmentedControl
              value={activeTab}
              onChange={handleTabChange}
              color="red"
              radius="md"
              size="sm"
              fullWidth
              data={[
                { label: 'MANAGER', value: 'manager' },
                { label: 'SUPER ADMIN', value: 'superadmin' },
              ]}
              classNames={{
                root: 'bg-slate-100 dark:bg-slate-900/70 border border-slate-200 dark:border-white/10 p-1',
                indicator: 'bg-red-600 text-white shadow-sm',
                label:
                  'font-headline font-bold uppercase text-[11px] tracking-widest text-slate-600 dark:text-slate-400 data-[active=true]:text-white',
              }}
            />

            {/* Error Message */}
            {error && (
              <Alert
                color="red"
                variant="light"
                radius="md"
                icon={<AlertCircle size={16} />}
                title="Access Denied"
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
                        Admin Email
                      </Text>
                      <TextInput
                        type="email"
                        placeholder="admin@buildbotai.com"
                        radius="md"
                        size="md"
                        leftSection={<Mail size={16} className="text-slate-400" />}
                        error={errors.email?.message}
                        classNames={{
                          input:
                            'bg-slate-50 dark:bg-slate-900/50 border-slate-300 dark:border-white/10 text-slate-900 dark:text-slate-100 font-medium focus:border-red-500',
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
                            'bg-slate-50 dark:bg-slate-900/50 border-slate-300 dark:border-white/10 text-slate-900 dark:text-slate-100 font-medium focus:border-red-500',
                        }}
                        {...field}
                      />
                    </div>
                  )}
                />

                <Controller
                  name="roleKey"
                  control={control}
                  render={({ field }) => (
                    <div>
                      <Group justify="space-between" mb={4}>
                        <Text
                          size="xs"
                          fw={700}
                          className="uppercase tracking-wider text-slate-700 dark:text-slate-300"
                        >
                          {activeTab === 'manager' ? 'Manager Key' : 'Super Admin Key'}
                        </Text>
                        {activeTab === 'manager' && (
                          <button
                            type="button"
                            onClick={() => setIsRequestDialogOpen(true)}
                            className="text-xs text-muted-foreground hover:text-red-500 transition-colors"
                          >
                            Forgot Manager Key?
                          </button>
                        )}
                      </Group>
                      <PasswordInput
                        placeholder={
                          activeTab === 'manager'
                            ? 'Required manager key'
                            : 'Required super admin master key'
                        }
                        radius="md"
                        size="md"
                        leftSection={<Key size={16} className="text-slate-400" />}
                        error={errors.roleKey?.message}
                        classNames={{
                          input:
                            'bg-slate-50 dark:bg-slate-900/50 border-slate-300 dark:border-white/10 text-slate-900 dark:text-slate-100 font-mono focus:border-red-500',
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
                  color="red"
                  loading={loading}
                  className="h-12 font-headline font-bold uppercase tracking-[0.2em] text-white bg-red-600 hover:bg-red-700 shadow-md shadow-red-600/20 hover:shadow-red-600/35 transition-all mt-1"
                >
                  Authenticate
                </Button>
              </Stack>
            </form>

            {/* Footer Links */}
            <div className="text-center text-xs text-slate-500 dark:text-slate-400">
              <Anchor
                component={Link}
                href="/"
                className="text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4"
              >
                Return to public site
              </Anchor>
            </div>
          </Stack>
        </Paper>
      </div>

      {/* Request Manager Key Modal */}
      <RequestKeyModal
        opened={isRequestDialogOpen}
        onClose={() => setIsRequestDialogOpen(false)}
        email={requestEmail}
        setEmail={setRequestEmail}
        onSubmit={handleRequestKey}
        loading={requestLoading}
      />
    </div>
  );
}
