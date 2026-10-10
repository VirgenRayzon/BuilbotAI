'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth, useFirestore, executeStaffGoogleAuthInitiate, GoogleIcon } from '@/firebase';
import { signInWithEmailAndPassword, signOut, setPersistence, browserLocalPersistence } from 'firebase/auth';
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
  Divider,
  Modal,
  Loader,
} from '@mantine/core';
import { Shield, Mail, Lock, Key, AlertCircle, ArrowLeft, Clock, ShieldAlert } from 'lucide-react';
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

function SystemAccessContent() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<RoleTab>('manager');
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
  const [requestEmail, setRequestEmail] = useState('');
  const [requestLoading, setRequestLoading] = useState(false);
  const isSubmittingRef = useRef(false);

  // Google admin verification modal state
  const [googleModalOpened, setGoogleModalOpened] = useState(false);
  const [googleUserCredential, setGoogleUserCredential] = useState<any>(null);
  const [googleRoleKey, setGoogleRoleKey] = useState('');
  const [googleKeyError, setGoogleKeyError] = useState<string | null>(null);

  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const router = useRouter();
  const searchParams = useSearchParams();
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const { authUser, profile, loading: authLoading } = useUserProfile();

  const reason = searchParams?.get('reason');
  let reasonNotice: { title: string; message: string } | null = null;
  if (reason === 'idle_timeout') {
    reasonNotice = {
      title: 'Session Expired',
      message: 'Your administrator session timed out due to 15 minutes of inactivity. Please sign in again.',
    };
  } else if (reason === 'window_closed') {
    reasonNotice = {
      title: 'Session Terminated',
      message: 'Your administrator session was closed because the browser tab or window was closed.',
    };
  }

  // Redirect if already logged in with an active administrator session
  useEffect(() => {
    // Never auto-redirect while submitting or validating credentials
    if (isSubmittingRef.current || loading || googleLoading) return;

    if (!authLoading && authUser && profile) {
      const isStaff = Boolean(profile.isManager || profile.isSuperAdmin);
      const activeAdminMarker =
        typeof window !== 'undefined'
          ? sessionStorage.getItem('buildbot_admin_session_active')
          : null;

      // Only redirect to /admin if the staff user has an active, verified admin session marker in this tab
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
    setValue,
    setError: setFieldError,
    clearErrors,
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
    isSubmittingRef.current = true;
    setLoading(true);
    setError(null);
    clearErrors();

    if (!auth) {
      isSubmittingRef.current = false;
      setLoading(false);
      return;
    }

    try {
      // Use local persistence so new tabs opened from dashboard stay authenticated
      await setPersistence(auth, browserLocalPersistence);
      const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;

      const idToken = await user.getIdToken();
      const result = await authenticateSystemAccessAction(idToken, values.roleKey, activeTab);

      if (result.error) {
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('buildbot_admin_session_active');
        }
        await signOut(auth);
        setError(result.error);
        setFieldError('roleKey', { message: result.error });
        return;
      }

      // Key verification SUCCEEDED! Register active admin session in sessionStorage
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('buildbot_admin_session_active', user.uid);
      }

      await user.getIdToken(true);

      toast({
        title: 'System Access Granted',
        description: 'Welcome to the administrator dashboard.',
      });

      router.push('/admin');
    } catch (err: any) {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('buildbot_admin_session_active');
      }
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
        setError('Invalid administrator email or password.');
      } else {
        setError(errMsg);
      }
    } finally {
      isSubmittingRef.current = false;
      setLoading(false);
    }
  };

  const handleVerifyKeyAndLogin = async (user: any, key: string) => {
    setGoogleLoading(true);
    setGoogleKeyError(null);

    try {
      const idToken = await user.getIdToken();
      const result = await authenticateSystemAccessAction(idToken, key.trim(), activeTab);

      if (result.error) {
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('buildbot_admin_session_active');
        }
        await signOut(auth!);
        setGoogleKeyError(result.error);
        setError(result.error);
        setGoogleLoading(false);
        return;
      }

      if (typeof window !== 'undefined') {
        sessionStorage.setItem('buildbot_admin_session_active', user.uid);
      }

      await user.getIdToken(true);

      setGoogleModalOpened(false);
      toast({
        title: 'System Access Granted',
        description: 'Administrator session authenticated with Google.',
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
      const msg = err.message || 'Failed to authenticate administrator session.';
      setGoogleKeyError(msg);
      setError(msg);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleSignInInitiate = async () => {
    if (!auth || !firestore) return;
    isSubmittingRef.current = true;
    setGoogleLoading(true);
    setError(null);

    try {
      const result = await executeStaffGoogleAuthInitiate(auth, firestore);

      if (!result.success) {
        if (result.error) {
          setError(result.error);
        }
        isSubmittingRef.current = false;
        setGoogleLoading(false);
        return;
      }

      const user = result.user;
      const currentRoleKey = control._formValues.roleKey?.trim();

      if (currentRoleKey) {
        await handleVerifyKeyAndLogin(user, currentRoleKey);
      } else {
        setGoogleUserCredential(user);
        setGoogleRoleKey('');
        setGoogleKeyError(null);
        setGoogleModalOpened(true);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to authenticate with Google.');
    } finally {
      setGoogleLoading(false);
      isSubmittingRef.current = false;
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

  const isStaffLoggedIn = authUser && (profile?.isManager || profile?.isSuperAdmin);
  const activeAdminMarker =
    typeof window !== 'undefined'
      ? sessionStorage.getItem('buildbot_admin_session_active')
      : null;
  const isRedirectingAdmin = Boolean(isStaffLoggedIn && activeAdminMarker === authUser?.uid && !loading && !googleLoading);

  if (isRedirectingAdmin) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center gap-3 bg-slate-50 text-slate-600 dark:bg-[#0c0f14] dark:text-slate-300" role="status">
        <Loader size="sm" color="red" />
        <Text size="sm">Opening administrator dashboard...</Text>
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

      <div className="w-full max-w-[480px] z-10 flex flex-col gap-2.5">
        <div className="flex items-center justify-between px-1">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400 transition-all duration-200 group"
          >
            <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
            Back to Public Site
          </Link>
          <span className="text-[11px] font-mono tracking-widest text-red-500/80 uppercase font-semibold">
            SECURE PORTAL
          </span>
        </div>

        <Paper
          withBorder
          radius="lg"
          p={{ base: 'md', sm: 'lg' }}
          className="w-full bg-white/85 dark:bg-[#141a23]/90 backdrop-blur-md border-red-500/30 dark:border-red-500/30 shadow-sm relative transition-all"
        >
          <Stack gap="md">
            {/* Header with Red Accent */}
            <div className="text-center flex flex-col items-center gap-1.5">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-500 shadow-sm">
                <ShieldAlert size={22} />
              </div>
              <Title
                order={2}
                className="text-xl sm:text-2xl font-bold font-headline tracking-tight text-slate-900 dark:text-slate-100"
              >
                System Access
              </Title>
              <Text size="xs" className="text-slate-500 dark:text-slate-400">
                Authorized administrative and management personnel only.
              </Text>
            </div>

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
                root: 'bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 p-1',
                indicator: 'bg-red-600 text-white shadow-md',
                label:
                  'font-headline font-bold uppercase text-[11px] tracking-widest text-slate-600 dark:text-slate-400 data-[active=true]:text-white',
              }}
            />

            {/* Social Authentication */}
            <Button
              variant="default"
              size="md"
              radius="md"
              leftSection={<GoogleIcon />}
              loading={googleLoading}
              onClick={handleGoogleSignInInitiate}
              className="h-11 border-slate-300 dark:border-white/15 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/60 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-sm transition-all shadow-sm"
            >
              Continue with Google
            </Button>

            <Divider
              label="or sign in with credentials"
              labelPosition="center"
              color={isDark ? 'dark.5' : 'gray.3'}
              classNames={{
                label: 'text-[11px] uppercase tracking-wider font-semibold text-slate-400 dark:text-slate-500',
              }}
            />

            {/* Session Expiration / Timeout Notice */}
            {reasonNotice && !error && (
              <Alert
                color="yellow"
                variant="light"
                radius="md"
                icon={<Clock size={16} />}
                title={reasonNotice.title}
                className="text-xs"
              >
                {reasonNotice.message}
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
                      placeholder="admin@buildbotai.com"
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
                    <PasswordInput
                      label="Password"
                      placeholder="••••••••"
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
                          {activeTab === 'manager' ? 'Manager Secret Key' : 'Super Admin Master Key'}
                        </Text>
                        {activeTab === 'manager' && (
                          <button
                            type="button"
                            onClick={() => setIsRequestDialogOpen(true)}
                            className="text-xs text-red-600 dark:text-red-400 hover:underline font-semibold"
                          >
                            Lost key?
                          </button>
                        )}
                      </Group>
                      <PasswordInput
                        placeholder={
                          activeTab === 'manager'
                            ? 'Enter manager security key'
                            : 'Enter super admin master key'
                        }
                        radius="md"
                        size="md"
                        leftSection={<Key size={16} className="text-slate-400" />}
                        error={errors.roleKey?.message}
                        classNames={{
                          input:
                            'bg-slate-50 dark:bg-slate-900/50 border-slate-300 dark:border-white/10 text-slate-900 dark:text-slate-100 font-mono focus:border-red-500 transition-colors',
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
                  className="h-11 font-headline font-bold uppercase tracking-[0.18em] text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 shadow-md shadow-red-600/20 hover:shadow-red-600/35 transition-all mt-2"
                >
                  Authenticate Session
                </Button>
              </Stack>
            </form>

            {/* Footer Links */}
            <div className="flex flex-col items-center gap-1.5 text-center text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-white/10">
              <div className="whitespace-nowrap">
                New manager with an access key?{' '}
                <Anchor
                  component={Link}
                  href="/system-access/signup"
                  className="font-bold text-red-600 dark:text-red-400 hover:underline whitespace-nowrap"
                >
                  Register manager account
                </Anchor>
              </div>
              <div>
                Customer or Guest?{' '}
                <Anchor
                  component={Link}
                  href="/signin"
                  className="font-bold text-cyan-600 dark:text-cyan-400 hover:underline"
                >
                  Go to customer sign in
                </Anchor>
              </div>
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

      {/* Google Staff Key Verification Modal */}
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
                Verify {activeTab === 'manager' ? 'Manager Key' : 'Super Admin Master Key'}
              </Title>
              <Text size="xs" className="text-slate-500 dark:text-slate-400">
                {googleUserCredential?.email}
              </Text>
            </div>
          </div>
        }
        classNames={{
          content: "bg-white/95 dark:bg-[#141a23]/95 backdrop-blur-md border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-slate-100 shadow-xl rounded-xl overflow-hidden",
          header: "bg-white/95 dark:bg-[#141a23]/95 border-b border-slate-200/80 dark:border-white/10 p-3",
          body: "!p-3",
          close: "text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors",
        }}
      >
        <Stack gap="md">
          <Text size="xs" className="text-slate-600 dark:text-slate-300 leading-relaxed">
            Google authentication verified. Enter your {activeTab === 'manager' ? 'manager security key' : 'super admin master key'} to complete session authentication.
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
              {activeTab === 'manager' ? 'Manager Secret Key' : 'Super Admin Master Key'}
            </Text>
            <PasswordInput
              placeholder={
                activeTab === 'manager'
                  ? 'Enter manager security key'
                  : 'Enter super admin master key'
              }
              value={googleRoleKey}
              onChange={(e) => setGoogleRoleKey(e.currentTarget.value)}
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
              onClick={() => handleVerifyKeyAndLogin(googleUserCredential, googleRoleKey)}
              loading={googleLoading}
              disabled={!googleRoleKey.trim()}
              className="text-xs font-bold uppercase tracking-wider text-white bg-red-600 hover:bg-red-700 shadow-md shadow-red-600/20"
            >
              Authenticate Session
            </Button>
          </div>
        </Stack>
      </Modal>
    </div>
  );
}

export default function SystemAccessPage() {
  return (
    <React.Suspense fallback={null}>
      <SystemAccessContent />
    </React.Suspense>
  );
}
