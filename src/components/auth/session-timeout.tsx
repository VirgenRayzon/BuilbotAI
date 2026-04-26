'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth, useUser } from '@/firebase';
import { signOut } from 'firebase/auth';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useRouter } from 'next/navigation';

// 30 minutes of inactivity for total timeout
const TIMEOUT_MS = 30 * 60 * 1000;
// Show warning 5 minutes before timeout (at 25 minutes)
const WARNING_MS = 25 * 60 * 1000;

export function SessionTimeout() {
  const user = useUser();
  const auth = useAuth();
  const router = useRouter();
  const [showWarning, setShowWarning] = useState(false);
  const [isTimedOut, setIsTimedOut] = useState(false);
  
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);
  const logoutTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleLogout = useCallback(async () => {
    if (auth && user) {
      try {
        localStorage.removeItem('pc_chat_history_v2');
        localStorage.removeItem('pc_builder_state');
        localStorage.removeItem('admin_pc_builder_state');
        await signOut(auth);
        setIsTimedOut(true);
        setShowWarning(false);
        router.push('/');
      } catch (error) {
        console.error('Logout failed:', error);
      }
    }
  }, [auth, user, router]);

  const resetTimers = useCallback(() => {
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);

    if (user) {
      warningTimerRef.current = setTimeout(() => {
        setShowWarning(true);
      }, WARNING_MS);

      logoutTimerRef.current = setTimeout(() => {
        handleLogout();
      }, TIMEOUT_MS);
    }
  }, [user, handleLogout]);

  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    const activityHandler = () => {
      // Only reset timers if we aren't already showing the warning or timed out
      if (!showWarning && !isTimedOut) {
        resetTimers();
      }
    };

    if (user) {
      resetTimers();
      events.forEach(event => window.addEventListener(event, activityHandler));
    }

    return () => {
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
      if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
      events.forEach(event => window.removeEventListener(event, activityHandler));
    };
  }, [user, resetTimers, showWarning, isTimedOut]);

  const stayLoggedIn = () => {
    setShowWarning(false);
    resetTimers();
  };

  // Only run this logic if a user is logged in
  if (!user) return null;

  return (
    <>
      <AlertDialog open={showWarning} onOpenChange={setShowWarning}>
        <AlertDialogContent className="border-cyan-500/20 bg-[#0a0a1a] text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-cyan-400">
              Session Timeout Warning
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-300">
              Your session is about to expire due to inactivity. Would you like to stay logged in?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction 
              onClick={stayLoggedIn}
              className="bg-cyan-600 hover:bg-cyan-500 text-white"
            >
              Stay Logged In
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isTimedOut} onOpenChange={setIsTimedOut}>
        <AlertDialogContent className="border-red-500/20 bg-[#0a0a1a] text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-red-400">
              Session Expired
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-300">
              Your session has timed out due to inactivity. Please log in again to continue.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction 
              onClick={() => setIsTimedOut(false)}
              className="bg-red-600 hover:bg-red-500 text-white"
            >
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
