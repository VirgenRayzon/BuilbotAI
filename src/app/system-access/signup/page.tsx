'use client';

import React from 'react';
import Link from 'next/link';
import { Controller } from 'react-hook-form';
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
  SimpleGrid,
} from '@mantine/core';
import { Mail, Lock, Key, AlertCircle, ArrowLeft, User } from 'lucide-react';
import { GoogleIcon } from '@/firebase';
import { UnifiedBackground } from '@/components/landing/unified-background';
import { PasswordStrengthMeter } from '@/components/auth/password-strength-meter';
import { VerifyManagerKeyModal } from '@/components/auth/verify-manager-key-modal';
import { Logo } from '@/components/logo';
import { useTheme } from '@/context/theme-provider';
import { useManagerSignUpForm } from '@/hooks/use-manager-signup-form';
import { cn } from '@/lib/utils';

const inputClassNames = {
  label: 'text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5',
  input:
    'min-h-[44px] bg-slate-50 dark:bg-slate-900/50 border-slate-300 dark:border-white/10 text-slate-900 dark:text-slate-100 font-medium focus:border-red-500 transition-colors',
};

export default function ManagerSignupPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const {
    form: {
      control,
      handleSubmit,
      formState: { errors },
    },
    error,
    loading,
    googleLoading,
    passwordValue,
    googleModalOpened,
    googleUserEmail,
    googleManagerKey,
    setGoogleManagerKey,
    googleKeyError,
    handleGoogleSignUpInitiate,
    handleCloseGoogleModal,
    handleGoogleManagerKeySubmit,
    onSubmit,
  } = useManagerSignUpForm();

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
            href="/system-access"
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400 transition-all duration-200 group"
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
          radius="lg"
          p={{ base: 'md', sm: 'lg' }}
          className="w-full bg-white/85 dark:bg-[#111722] border-red-500/30 dark:border-red-500/30 shadow-sm relative transition-all"
        >
          <Stack gap="md">
            <div className="text-center flex flex-col items-center gap-1.5">
              <Link href="/" className="mb-0.5">
                <Logo showText={false} size="lg" variant="red" />
              </Link>
              <Title
                order={2}
                className="text-xl sm:text-2xl font-bold font-headline tracking-tight text-slate-900 dark:text-slate-100"
              >
                Manager Sign Up
              </Title>
              <Text size="xs" className="text-slate-500 dark:text-slate-400">
                Register a new manager account with your default access key.
              </Text>
            </div>

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

            <form onSubmit={handleSubmit(onSubmit)} autoComplete="on">
              <Stack gap="md">
                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                  <Controller
                    name="firstName"
                    control={control}
                    render={({ field }) => (
                      <TextInput
                        label="First Name"
                        placeholder="Juan"
                        autoComplete="given-name"
                        radius="md"
                        size="md"
                        leftSection={<User size={16} className="text-slate-400" />}
                        error={errors.firstName?.message}
                        classNames={inputClassNames}
                        {...field}
                      />
                    )}
                  />

                  <Controller
                    name="lastName"
                    control={control}
                    render={({ field }) => (
                      <TextInput
                        label="Last Name"
                        placeholder="Dela Cruz"
                        autoComplete="family-name"
                        radius="md"
                        size="md"
                        leftSection={<User size={16} className="text-slate-400" />}
                        error={errors.lastName?.message}
                        classNames={inputClassNames}
                        {...field}
                      />
                    )}
                  />
                </SimpleGrid>

                <Controller
                  name="email"
                  control={control}
                  render={({ field }) => (
                    <TextInput
                      label="Email Address"
                      type="email"
                      placeholder="manager@example.com"
                      autoComplete="email"
                      radius="md"
                      size="md"
                      leftSection={<Mail size={16} className="text-slate-400" />}
                      error={errors.email?.message}
                      classNames={inputClassNames}
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
                        autoComplete="new-password"
                        radius="md"
                        size="md"
                        leftSection={<Lock size={16} className="text-slate-400" />}
                        error={errors.password?.message}
                        classNames={inputClassNames}
                        {...field}
                      />
                      <PasswordStrengthMeter password={passwordValue} highScoreColor="orange" />
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
                      autoComplete="one-time-code"
                      radius="md"
                      size="md"
                      leftSection={<Key size={16} className="text-slate-400" />}
                      error={errors.managerKey?.message}
                      classNames={{
                        label: inputClassNames.label,
                        input:
                          'min-h-[44px] bg-slate-50 dark:bg-slate-900/50 border-slate-300 dark:border-white/10 text-slate-900 dark:text-slate-100 font-mono focus:border-red-500 transition-colors',
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

            <div className="text-center text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-white/10 whitespace-nowrap">
              Already have manager credentials?{' '}
              <Anchor
                component={Link}
                href="/system-access"
                className="font-bold text-red-600 dark:text-red-400 hover:underline whitespace-nowrap"
              >
                Sign in via System Access
              </Anchor>
            </div>
          </Stack>
        </Paper>
      </div>

      <VerifyManagerKeyModal
        opened={googleModalOpened}
        onClose={handleCloseGoogleModal}
        userEmail={googleUserEmail}
        managerKey={googleManagerKey}
        onManagerKeyChange={setGoogleManagerKey}
        error={googleKeyError}
        loading={googleLoading}
        onSubmit={handleGoogleManagerKeySubmit}
      />
    </div>
  );
}
