'use client';

import React from 'react';
import {
  Auth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from 'firebase/auth';
import { Firestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { syncUserClaimsAction } from '@/app/actions';

/**
 * Modern Google 'G' official SVG icon.
 */
export function GoogleIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.97 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
      />
    </svg>
  );
}

/**
 * Returns a configured GoogleAuthProvider instance with account selector prompt and profile scopes.
 */
export function getGoogleProvider(): GoogleAuthProvider {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  provider.addScope('email');
  provider.addScope('profile');
  return provider;
}

/**
 * Maps Firebase Auth error codes to helpful, user-friendly messages.
 * Returns null if the error was a user-initiated dismissal (e.g. closing the popup).
 */
export function formatGoogleAuthError(err: any): string | null {
  if (!err) return null;
  const code = err.code || '';

  // Silent cancellations
  if (
    code === 'auth/popup-closed-by-user' ||
    code === 'auth/cancelled-popup-request'
  ) {
    return null;
  }

  if (code === 'auth/popup-blocked') {
    return 'The sign-in popup was blocked by your browser. Please allow popups for this site and try again.';
  }
  if (code === 'auth/account-exists-with-different-credential') {
    return 'An account already exists with this email address using a different sign-in method. Please sign in with your email and password.';
  }
  if (code === 'auth/unauthorized-domain') {
    return 'This domain is not authorized for Google Sign-In in Firebase Console.';
  }
  if (code === 'auth/operation-not-allowed') {
    return 'Google Sign-In is not currently enabled for this project. Please contact the administrator.';
  }
  if (code === 'auth/network-request-failed') {
    return 'Network connection error. Please check your internet connection and try again.';
  }
  if (code === 'auth/user-disabled') {
    return 'This account has been disabled. Please contact support.';
  }

  return err.message || 'An error occurred during Google authentication.';
}

export interface CustomerGoogleAuthResult {
  success: boolean;
  error?: string | null;
  user?: any;
  isNewUser?: boolean;
}

/**
 * Executes customer Google Sign-In / Sign-Up.
 * Enforces local persistence, verifies customer permissions (disallows manager/admin sign-in via public portal),
 * provisions or updates customer profile in Firestore, and syncs custom claims.
 */
export async function executeCustomerGoogleAuth(
  auth: Auth,
  firestore: Firestore,
  options?: { isSignUp?: boolean }
): Promise<CustomerGoogleAuthResult> {
  try {
    await setPersistence(auth, browserLocalPersistence);
    const provider = getGoogleProvider();
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    const userDocRef = doc(firestore, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const userData = userDoc.data();

      // Protect against staff accounts signing in via customer route
      if (userData.isManager || userData.isSuperAdmin || userData.isAdmin) {
        await signOut(auth);
        return {
          success: false,
          error: 'Administrator and Manager accounts must sign in via the System Access portal (/system-access).',
        };
      }

      // Update name/photoURL if missing from previous email sign-ups
      const updates: Record<string, any> = {};
      if (!userData.name && user.displayName) {
        updates.name = user.displayName;
      }
      if (!userData.photoURL && user.photoURL) {
        updates.photoURL = user.photoURL;
      }
      if (Object.keys(updates).length > 0) {
        await setDoc(userDocRef, updates, { merge: true });
      }
    } else {
      // First-time customer profile creation
      const newProfile = {
        email: user.email || '',
        name: user.displayName || user.email?.split('@')[0] || 'User',
        photoURL: user.photoURL || '',
        isManager: false,
        isSuperAdmin: false,
        createdAt: new Date().toISOString(),
      };
      await setDoc(userDocRef, newProfile);
    }

    // Sync claims and refresh client token
    const idToken = await user.getIdToken();
    await syncUserClaimsAction(idToken);
    await user.getIdToken(true);

    return {
      success: true,
      user,
      isNewUser: !userDoc.exists(),
    };
  } catch (err: any) {
    const errorMsg = formatGoogleAuthError(err);
    return {
      success: false,
      error: errorMsg,
    };
  }
}

export interface StaffGoogleAuthResult {
  success: boolean;
  error?: string | null;
  user?: any;
  needsKeyVerification?: boolean;
}

/**
 * Initiates Google sign-in for administrative personnel on /system-access.
 * Enforces browserSessionPersistence, verifies that the user is an authorized manager or superadmin in Firestore.
 */
export async function executeStaffGoogleAuthInitiate(
  auth: Auth,
  firestore: Firestore
): Promise<StaffGoogleAuthResult> {
  try {
    await setPersistence(auth, browserSessionPersistence);
    const provider = getGoogleProvider();
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    const userDocRef = doc(firestore, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      await signOut(auth);
      return {
        success: false,
        error: 'This account does not have administrator privileges. Please sign in via the public customer portal (/signin).',
      };
    }

    const userData = userDoc.data();
    const hasPrivileges = Boolean(userData.isManager || userData.isSuperAdmin || userData.isAdmin);

    if (!hasPrivileges) {
      await signOut(auth);
      return {
        success: false,
        error: 'This account does not have administrator privileges. Please sign in via the public customer portal (/signin).',
      };
    }

    return {
      success: true,
      user,
      needsKeyVerification: true,
    };
  } catch (err: any) {
    const errorMsg = formatGoogleAuthError(err);
    return {
      success: false,
      error: errorMsg,
    };
  }
}
