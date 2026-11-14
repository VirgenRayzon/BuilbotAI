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
  Checkbox,
  Divider,
  SimpleGrid,
} from '@mantine/core';
import { Mail, Lock, AlertCircle, ArrowLeft, User } from 'lucide-react';
import { GoogleIcon } from '@/firebase';
import { AuthBackground } from '@/components/auth/auth-background';
import { TermsOfAgreementModal } from '@/components/auth/terms-of-agreement-modal';
import { PasswordStrengthMeter } from '@/components/auth/password-strength-meter';
import { Logo } from '@/components/logo';
import { useTheme } from '@/context/theme-provider';
import { useSignUpForm } from '@/hooks/use-signup-form';
import { cn } from '@/lib/utils';

const inputClassNames = {
  label: 'text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5',
  input:
    'min-h-[44px] bg-slate-50 dark:bg-slate-900/50 border-slate-300 dark:border-white/10 text-slate-900 dark:text-slate-100 font-medium focus:border-cyan-500 transition-colors',
};

export default function SignUpPage() {
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
    toaOpened,
    setToaOpened,
    passwordValue,
    termsValue,
    isRedirecting,
    handleAcceptToa,
    handleGoogleSignUp,
    onSubmit,
  } = useSignUpForm();

  if (isRedirecting) {
    return null;
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
            <div className="text-center flex flex-col items-center gap-1.5">
              <Link href="/" className="mb-0.5">
                <Logo showText={false} size="lg" />
              </Link>
              <Title
                order={2}
                className="text-xl sm:text-2xl font-bold font-headline tracking-tight text-slate-900 dark:text-slate-100"
              >
                Create an account
              </Title>
              <Text size="xs" className="text-slate-500 dark:text-slate-400">
                Join Netcodex to configure, optimize, and simulate your custom PC builds.
              </Text>
            </div>

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

            <form onSubmit={handleSubmit(onSubmit)}>
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
                      placeholder="name@example.com"
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
                        placeholder="Create a strong password"
                        autoComplete="new-password"
                        radius="md"
                        size="md"
                        leftSection={<Lock size={16} className="text-slate-400" />}
                        error={errors.password?.message}
                        classNames={inputClassNames}
                        {...field}
                      />
                      <PasswordStrengthMeter password={passwordValue} />
                    </div>
                  )}
                />

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

            <div className="text-center text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-white/10">
              Already have an account?{' '}
              <Anchor
                component={Link}
                href="/signin"
                className="font-bold text-cyan-600 dark:text-cyan-400 hover:underline whitespace-nowrap"
              >
                Sign in
              </Anchor>
            </div>
          </Stack>
        </Paper>
      </div>

      <TermsOfAgreementModal
        opened={toaOpened}
        onClose={() => setToaOpened(false)}
        onAccept={handleAcceptToa}
        isAccepted={termsValue}
      />
    </div>
  );
}
