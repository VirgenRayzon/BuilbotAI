
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
import { UserNotifications } from "./user-notifications";
import { NotificationCenter } from "./notification-center";
import { motion } from "framer-motion";

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { authUser, profile, loading } = useUserProfile();
  const auth = useAuth();

  const handleSignOut = async () => {
    if (auth) {
      localStorage.removeItem('pc_builder_state');
      localStorage.removeItem('admin_pc_builder_state');
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
    { 
      href: "/admin", 
      label: profile?.isSuperAdmin ? "Super Admin" : "Manager", 
      admin: true 
    },
    { 
      href: "/admin/prebuilt-builder", 
      label: "Prebuilt Builder", 
      admin: true 
    },
  ];

  const commonLinks = [
    { href: "/profile", label: "Profile" },
  ];

  const filteredLinks = !profile?.isManager
    ? [...mainLinks, ...commonLinks]
    : [...adminLinks, ...commonLinks];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/60 backdrop-blur-xl supports-[backdrop-filter]:bg-background/40">
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent z-20 opacity-50"></div>
      
      <div className="flex h-16 max-w-[1800px] w-full mx-auto items-center px-4 md:px-12">
        {/* Left: Logo */}
        <div className="flex-none">
          <Link href={authUser ? (profile?.isManager ? "/admin" : "/builder") : "/"} className="flex items-center">
            <Logo />
          </Link>
        </div>

        {/* Center: Animated Navigation */}
        <div className="flex-1 flex justify-center">
          <nav className="hidden md:flex items-center gap-2 p-1 bg-muted/30 rounded-2xl border border-border/20 backdrop-blur-md">
            {authUser && filteredLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "relative px-4 py-1.5 text-xs font-bold uppercase tracking-widest transition-colors duration-200 rounded-xl",
                    isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <span className="relative z-10 flex items-center gap-2">
                    {link.label}
                    {(link as any).admin && profile?.isSuperAdmin && <Shield className="w-3 h-3" />}
                  </span>
                  {isActive && (
                    <motion.div
                      layoutId="nav-underline"
                      className="absolute inset-0 bg-background border border-primary/20 shadow-[0_0_15px_rgba(var(--primary-rgb),0.1)] rounded-xl z-0"
                      initial={false}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 30,
                      }}
                    />
                  )}
                  {isActive && (
                    <motion.div
                      layoutId="nav-glow"
                      className="absolute -bottom-[6px] left-1/4 right-1/4 h-[2px] bg-primary rounded-full blur-[2px] z-20"
                      initial={false}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 30,
                      }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right: Actions */}
        <div className="flex-none flex items-center gap-3">
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin text-primary/50" />
          ) : authUser ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 p-1 bg-muted/40 rounded-xl border border-border/20">
                {!profile?.isManager && <UserNotifications />}
                {profile?.isManager && <NotificationCenter />}
                <ThemeToggle />
              </div>
              
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleSignOut} 
                className="rounded-xl h-9 px-4 text-[10px] font-bold uppercase tracking-widest border border-destructive/20 hover:bg-destructive/10 hover:text-destructive transition-all duration-300 group"
              >
                <LogOut className="mr-2 h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" />
                Sign Out
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {(pathname === '/signin' || pathname === '/signup') ? (
                <Button asChild variant="ghost" size="sm" className="rounded-xl text-[10px] font-bold uppercase tracking-widest px-6 h-9">
                  <Link href="/">Home</Link>
                </Button>
              ) : (
                <Button asChild size="sm" className="rounded-xl text-[10px] font-bold uppercase tracking-widest px-8 h-9 shadow-lg shadow-primary/20 hover:shadow-primary/40 active:scale-95 transition-all">
                  <Link href="/signin">Sign In</Link>
                </Button>
              )}
              <ThemeToggle />
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
