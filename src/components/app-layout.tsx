
"use client";

import { useUserProfile } from "@/context/user-profile";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { NeutralPageLoader } from "@/components/neutral-page-loader";
import { usePathname } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { MaintenanceScreen } from "@/components/maintenance-screen";
import { useDoc, useFirestore } from "@/firebase";
import { doc } from "firebase/firestore";
import { cn } from "@/lib/utils";

import { Button, Paper, Text, Title } from "@mantine/core";
import { AnimatePresence } from "framer-motion";
import { SignOutLoader } from "@/components/auth/sign-out-loader";
import { SignOutTransitionContext } from "@/context/sign-out-transition";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { loading, status, authUser, profile } = useUserProfile();
  const firestore = useFirestore();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [signOutStartedAt, setSignOutStartedAt] = useState<number | null>(null);

  // Fetch Site Settings (Kill Switch)
  const settingsDocRef = useMemo(() => {
    if (firestore) return doc(firestore, 'siteSettings', 'main');
    return null;
  }, [firestore]);

  const { data: settings } = useDoc<any>(settingsDocRef);
  const isMaintenanceMode = settings?.isMaintenanceMode || false;
  const isSuperAdmin = profile?.isSuperAdmin || false;
  const isManager = profile?.isManager || false;
  const isAdmin = isSuperAdmin || isManager;

  useEffect(() => {
    setMounted(true);
  }, []);

  const isLandingRedirect = pathname === "/" && !!authUser;
  const isAuthPage = ['/signin', '/signup', '/system-access'].includes(pathname);

  // Keep the sign-out overlay mounted across the route change, then let its
  // existing 400 ms exit animation reveal the ready sign-in page once.
  useEffect(() => {
    if (signOutStartedAt === null || !isAuthPage || authUser !== null) return;
    const remaining = Math.max(0, 600 - (Date.now() - signOutStartedAt));
    const timeout = window.setTimeout(() => setSignOutStartedAt(null), remaining);
    return () => window.clearTimeout(timeout);
  }, [signOutStartedAt, isAuthPage, authUser]);

  // Routes exempt from maintenance screen (admin pages & system access login)
  const isAdminRoute = pathname.startsWith('/admin') || pathname === '/system-access';

  // Kill Switch Logic: Only block PUBLIC non-admin users on non-admin routes
  // Admins (Super Admin & Manager) and Admin routes are exempted from maintenance mode
  const showMaintenance = isMaintenanceMode && !isAdmin && !loading && !isAdminRoute;

  // Routes where the global footer SHOULD appear (Whitelist)
  const showFooterRoutes = ['/about', '/faq', '/contact', '/team'];
  const isLandingPage = pathname === '/';
  const shouldShowFooter = isLandingPage || showFooterRoutes.some(route => pathname === route);

  const isHeaderHidden = mounted && isAuthPage;

  // Loader overlay condition:
  // 1. Initial auth profile is loading (except when an unauthenticated guest lands directly on /signin)
  // 2. Landing page is redirecting an authenticated user
  // 3. User is authenticated on an auth page (/signin, /signup, /system-access) while route redirection completes
  const showLoaderOverlay = signOutStartedAt === null && (
    (loading && !(pathname === '/signin' && !authUser)) ||
    isLandingRedirect ||
    (isAuthPage && !!authUser)
  );

  if (status === 'missing' || status === 'error') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 text-slate-900 dark:bg-[#0c0f14] dark:text-slate-100">
        <Paper withBorder radius="lg" p="xl" className="w-full max-w-md border-slate-200 bg-white text-center dark:border-white/10 dark:bg-[#111722]">
          <Title order={2} size="h3" className="text-slate-900 dark:text-slate-100">Account unavailable</Title>
          <Text size="sm" c="dimmed" mt="sm">
            {status === 'missing'
              ? 'We could not find your account profile. Please try again or contact support.'
              : 'We could not verify your account right now. Check your connection and try again.'}
          </Text>
          <Button color="cyan" mt="lg" onClick={() => window.location.reload()}>Try again</Button>
        </Paper>
      </div>
    );
  }

  if (showMaintenance) return <MaintenanceScreen />;

  return (
    <SignOutTransitionContext.Provider value={{
      startSignOut: () => setSignOutStartedAt(Date.now()),
      cancelSignOut: () => setSignOutStartedAt(null),
    }}>
      <div className="flex flex-col min-h-screen overflow-x-hidden relative">
        <AnimatePresence>
          {showLoaderOverlay && (
            <NeutralPageLoader
              key="neutral-page-loader"
              isOverlay
            />
          )}
        </AnimatePresence>
        <SignOutLoader visible={signOutStartedAt !== null} />

        <Header />
        <main className={cn(
          "flex-1 min-h-[calc(100vh-4rem)]",
          !isHeaderHidden && "pt-16",
          isMaintenanceMode && !isAdmin && !isAdminRoute && "grayscale-[0.5] contrast-125"
        )}>
          {children}
        </main>
        {mounted && shouldShowFooter && <Footer />}
      </div>
    </SignOutTransitionContext.Provider>
  );
}
