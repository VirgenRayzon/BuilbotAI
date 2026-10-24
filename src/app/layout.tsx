
import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";
import { FirebaseClientProvider } from "@/firebase/client-provider";
import { UserProfileProvider } from "@/context/user-profile";
import { ThemeProvider } from "@/context/theme-provider";
import { AppLayout } from "@/components/app-layout";
import { LoadingProvider } from "@/context/loading-context";
import { SessionTimeout } from "@/components/auth/session-timeout";
import { SiteSettingsProvider } from "@/context/site-settings-context";
import { MantineAppProvider } from "@/components/providers/mantine-app-provider";
import { AdvisorJobsProvider } from "@/context/advisor-jobs-context";

const inter = Inter({
  subsets: ['latin'], weight: ['400', '500', '600', '700'],
  display: 'swap', variable: '--font-body',
});
const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'], weight: ['400', '500', '600', '700'],
  display: 'swap', variable: '--font-headline',
});

export const metadata: Metadata = {
  title: "Netcodex | Nationwide PC & Tech Store",
  description: "Netcodex is a nationwide online computer and technology store in the Philippines. Authentic PC parts, custom gaming rigs, workstations, and intelligent compatibility guided by Buildbot AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(inter.variable, spaceGrotesk.variable, "font-body antialiased", "flex flex-col min-h-screen")}>
        <ThemeProvider defaultTheme="light" storageKey="buildbot-ui-theme-v2">
          <FirebaseClientProvider>
            <UserProfileProvider>
              <LoadingProvider>
                <SiteSettingsProvider>
                  <MantineAppProvider>
                    <AdvisorJobsProvider>
                      <AppLayout>
                        {children}
                      </AppLayout>
                      <SessionTimeout />
                    </AdvisorJobsProvider>
                  </MantineAppProvider>
                </SiteSettingsProvider>
              </LoadingProvider>
              <Toaster />
            </UserProfileProvider>
          </FirebaseClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
