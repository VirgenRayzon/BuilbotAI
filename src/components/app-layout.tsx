
"use client";

import { useUserProfile } from "@/context/user-profile";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { FullPageLoader } from "@/components/full-page-loader";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useLoading } from "@/context/loading-context";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { loading, authUser } = useUserProfile();
  const { isPageLoading } = useLoading();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // If we are on the landing page and redirecting (loading or authUser exists)
  const isLandingRedirect = pathname === "/" && (loading || authUser);

  // Global loading state: Not mounted yet, or landing redirect, or page-specific loading
  const showGlobalLoader = !mounted || isLandingRedirect || isPageLoading;

  return (
    <>
      {showGlobalLoader && <FullPageLoader label="BuilbotAI" subtitle="Architecting Experience" />}
      <div className={showGlobalLoader ? "opacity-0 invisible" : "opacity-100 visible"}>
        <Header />
        <main className="flex-1 min-h-screen">{children}</main>
        <Footer />
      </div>
    </>
  );
}
