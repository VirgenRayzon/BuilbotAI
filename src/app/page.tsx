"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserProfile } from '@/context/user-profile';
import { useTheme } from '@/context/theme-provider';
import { useLoading } from '@/context/loading-context';
import { cn } from '@/lib/utils';
import { UnifiedBackground } from '@/components/landing/unified-background';

// Extracted Sections
import { HeroSection } from '@/components/landing/hero-section';
import { FeaturesSection } from '@/components/landing/features-section';
import { PrebuiltShowcase } from '@/components/landing/prebuilt-showcase';
import { AccessoriesSection } from '@/components/landing/accessories-section';
import { CTASection } from '@/components/landing/cta-section';

export default function StartPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { authUser, profile, loading } = useUserProfile();
  const router = useRouter();
  const { setIsPageLoading } = useLoading();

  useEffect(() => {
    // If loading is finished and we have a user, redirect them
    if (!loading && authUser && profile) {
      if (profile.isManager || profile.isSuperAdmin) {
        router.replace('/admin');
      } else {
        router.replace('/builder');
      }
    }
  }, [loading, authUser, profile, router]);

  useEffect(() => {
    setIsPageLoading(loading);
    return () => setIsPageLoading(false);
  }, [loading, setIsPageLoading]);

  // If loading, or if we have a user (meaning we are about to redirect), show nothing
  // The AppLayout will show the FullPageLoader during this time
  if (loading || authUser) {
    return null;
  }

  return (
    <div className={cn(
      "relative min-h-screen transition-colors duration-1000 selection:bg-primary/30 selection:text-primary overflow-x-hidden",
      isDark ? "text-foreground" : "text-slate-900"
    )}>
      <UnifiedBackground />

      <HeroSection isDark={isDark} />
      
      <FeaturesSection isDark={isDark} />

      <PrebuiltShowcase />

      <AccessoriesSection isDark={isDark} />

      <CTASection isDark={isDark} />
    </div>
  );
}
