'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import {
  Paper,
  Title,
  Text,
  TextInput,
  Button,
  Alert,
  Stack,
  Anchor,
  ThemeIcon,
} from '@mantine/core';
import { Mail, AlertCircle, ArrowLeft, CheckCircle2, KeyRound } from 'lucide-react';
import { UnifiedBackground } from '@/components/landing/unified-background';
import { useTheme } from '@/context/theme-provider';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/logo';

const formSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
});

type FormValues = z.infer<typeof formSchema>;

export default function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const auth = useAuth();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    if (!auth) return;

    try {
      await sendPasswordResetEmail(auth, values.email);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send password reset email. Please try again.');
    } finally {
      setLoading(false);
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

      <div className="w-full max-w-[540px] z-10 flex flex-col gap-3">
        {/* Navigation & Brand Header */}
        <div className="flex items-center justify-start px-1">
          <Link
            href="/signin"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-cyan-600 dark:text-slate-400 dark:hover:text-cyan-400 transition-all duration-200 group"
          >
            <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
            Back to Sign In
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
                Forgot your password?
              </Title>
              <Text size="sm" className="text-slate-500 dark:text-slate-400">
                Enter your registered email address and we&apos;ll send you a recovery link to reset your credentials.
              </Text>
            </div>

            {/* Success Alert */}
            {success && (
              <Alert
                color="teal"
                variant="light"
                radius="md"
                icon={<CheckCircle2 size={18} />}
                title="Reset Link Sent"
                className="text-xs"
              >
                If an account exists with that email, a password reset link has been dispatched. Please check your inbox and spam folder.
              </Alert>
            )}

            {/* Error Message */}
            {error && (
              <Alert
                color="red"
                variant="light"
                radius="md"
                icon={<AlertCircle size={16} />}
                title="Reset Error"
                className="text-xs"
              >
                {error}
              </Alert>
            )}

            {/* Form */}
            {!success ? (
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

                  <Button
                    type="submit"
                    fullWidth
                    size="md"
                    radius="md"
                    color="cyan"
                    loading={loading}
                    className="h-11 font-headline font-bold uppercase tracking-[0.16em] text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 shadow-md shadow-cyan-500/20 hover:shadow-cyan-500/35 transition-all mt-2"
                  >
                    Reset Password
                  </Button>
                </Stack>
              </form>
            ) : (
              <Button
                component={Link}
                href="/signin"
                fullWidth
                size="md"
                radius="md"
                color="cyan"
                className="h-11 font-headline font-bold uppercase tracking-[0.16em] text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 shadow-md shadow-cyan-500/20 transition-all"
              >
                Return to Sign In
              </Button>
            )}

            {/* Footer Links */}
            <div className="text-center text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-white/10">
              Remember your password?{' '}
              <Anchor
                component={Link}
                href="/signin"
                className="font-bold text-cyan-600 dark:text-cyan-400 hover:underline"
              >
                Back to sign in
              </Anchor>
            </div>
          </Stack>
        </Paper>
      </div>
    </div>
  );
}
