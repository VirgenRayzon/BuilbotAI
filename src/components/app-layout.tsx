
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

  return (
    <>
      {showGlobalLoader && <FullPageLoader label="BuilbotAI" subtitle="Architecting Experience" />}
      
      {showMaintenance ? (
        <MaintenanceScreen />
      ) : (
        <div className={showGlobalLoader ? "opacity-0 invisible" : "opacity-100 visible"}>
          <Header />
          <main className={cn("flex-1 min-h-screen", isMaintenanceMode && !isSuperAdmin && "grayscale-[0.5] contrast-125")}>
            {children}
          </main>
          <Footer />
        </div>
      )}
    </>
  );
}
