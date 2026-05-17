
"use client";

import { useUserProfile } from "@/context/user-profile";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { FullPageLoader } from "@/components/full-page-loader";
import { usePathname } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { useLoading } from "@/context/loading-context";
import { MaintenanceScreen } from "@/components/maintenance-screen";
import { useDoc, useFirestore } from "@/firebase";
import { doc } from "firebase/firestore";
import { cn } from "@/lib/utils";

import { AnimatePresence } from "framer-motion";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { loading, authUser, profile } = useUserProfile();
  const { isPageLoading } = useLoading();
  const firestore = useFirestore();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  // Fetch Site Settings (Kill Switch)
  const settingsDocRef = useMemo(() => {
    if (firestore) return doc(firestore, 'siteSettings', 'main');
    return null;
  }, [firestore]);

  const { data: settings } = useDoc<any>(settingsDocRef);
  const isMaintenanceMode = settings?.isMaintenanceMode || false;
  const isSuperAdmin = profile?.isSuperAdmin || false;

  useEffect(() => {
    setMounted(true);
  }, []);

  // If we are on the landing page and redirecting (loading or authUser exists)
  const isLandingRedirect = pathname === "/" && (loading || authUser);

  // Global loading state: Not mounted yet, or landing redirect, or page-specific loading
  const showGlobalLoader = !mounted || isLandingRedirect || isPageLoading;

  // Kill Switch Logic: Only block PUBLIC users and MANAGERS
  // Only Super Admins can bypass to keep working
  const showMaintenance = isMaintenanceMode && !isSuperAdmin && !loading;

  // Routes where the global footer SHOULD appear (Whitelist)
  const showFooterRoutes = ['/about', '/faq', '/contact', '/team'];
  const isLandingPage = pathname === '/';
  const shouldShowFooter = isLandingPage || showFooterRoutes.some(route => pathname === route);

  const isHeaderHidden = mounted && !loading && !authUser && ['/', '/signin', '/signup', '/system-access'].includes(pathname);

  return (
    <>
      <AnimatePresence>
        {showGlobalLoader && <FullPageLoader key="global-loader" label="BuilbotAI" subtitle="Architecting Experience" />}
      </AnimatePresence>
      
      {showMaintenance ? (
        <MaintenanceScreen />
      ) : (
        <div className={cn("flex flex-col min-h-screen overflow-x-hidden transition-opacity duration-1000", showGlobalLoader ? "opacity-0" : "opacity-100")}>
          <Header />
          <main className={cn(
            "flex-1 min-h-[calc(100vh-4rem)]", 
            !isHeaderHidden && "pt-16",
            isMaintenanceMode && !isSuperAdmin && "grayscale-[0.5] contrast-125"
          )}>
            {children}
          </main>
          {mounted && shouldShowFooter && <Footer />}
        </div>
      )}
    </>
  );
}
