
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Loader2, Shield, LogOut } from "lucide-react";
import { useUserProfile } from "@/context/user-profile";
import { useAuth } from "@/firebase";
import { signOut } from "firebase/auth";
import { ThemeToggle } from "./theme-toggle";

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { authUser, profile, loading } = useUserProfile();
  const auth = useAuth();

  const handleSignOut = async () => {
    if (auth) {
      await signOut(auth);
      router.push("/");
    }
  };

  const mainLinks = [
    { href: "/builder", label: "Builder" },
    { href: "/ai-build-advisor", label: "Build Advisor" },
    { href: "/pre-builts", label: "Pre-builts" },
  ];

  const adminLinks = [
    { href: "/admin", label: "Admin", admin: true },
  ];

  const commonLinks = [
    { href: "/profile", label: "Profile" },
  ];

  // Logic to determine which links to show
  const filteredLinks = !profile?.isAdmin
    ? [...mainLinks, ...commonLinks]
    : [...adminLinks, ...commonLinks];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-primary/20 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-purple-500 to-primary animate-pulse z-20"></div>
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <Link href={authUser ? (profile?.isAdmin ? "/admin" : "/builder") : "/"} className="mr-6 flex items-center space-x-2">
          <Logo />
        </Link>

        <div className="flex flex-1 items-center justify-end space-x-6">
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium mr-2">
            {authUser && filteredLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "transition-all hover:text-primary",
                  pathname === link.href
                    ? "text-primary font-bold shadow-[0_0_15px_rgba(34,211,238,0.3)]"
                    : "text-foreground/60",
                  (link as any).admin && "flex items-center gap-2"
                )}
              >
                {link.label}
                {(link as any).admin && <Shield className="w-4 h-4" />}
              </Link>
            ))}
          </nav>

          <div className="flex items-center space-x-2">
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : authUser ? (
              <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-foreground/60 hover:text-primary">
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            ) : (
              (pathname === '/signin' || pathname === '/signup') && (
                <Button asChild variant="ghost" size="sm">
                  <Link href="/">Home</Link>
                </Button>
              )
            )}
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}
