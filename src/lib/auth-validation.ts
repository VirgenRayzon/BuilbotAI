import { z } from 'zod';

export const NAME_PATTERN = /^[\p{L}\s'-]+$/u;

export const nameFieldSchema = (label: string) =>
  z
    .string()
    .trim()
    .min(2, `${label} must be at least 2 characters.`)
    .max(50, `${label} must be 50 characters or less.`)
    .regex(
      NAME_PATTERN,
      `${label} can only contain letters, spaces, hyphens, and apostrophes.`
    );

export const emailFieldSchema = z
  .string()
  .trim()
  .email('Please enter a valid email address.');

export const passwordFieldSchema = z
  .string()
  .min(6, 'Password must be at least 6 characters.')
  .regex(/[0-9]/, 'Password must include at least one number')
  .regex(/[a-z]/, 'Password must include at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must include at least one uppercase letter');

export function getPasswordStrength(password: string): number {
  let score = 0;
  if (password.length >= 6) score += 25;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 25;
  if (/\d/.test(password)) score += 25;
  if (/[^A-Za-z0-9]/.test(password)) score += 25;
  return score;
}

export function getAuthErrorMessage(
  err: unknown,
  fallback: string,
  emailInUseMessage: string
): string {
  if (typeof err === 'object' && err !== null) {
    const maybeCode = 'code' in err ? String((err as { code?: unknown }).code) : '';
    if (maybeCode === 'auth/email-already-in-use') {
      return emailInUseMessage;
    }
    if ('message' in err && typeof (err as { message?: unknown }).message === 'string') {
      return (err as { message: string }).message || fallback;
    }
  }
  return fallback;
}

