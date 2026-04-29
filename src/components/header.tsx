
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
import { Menu } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import { SparkleButton } from "@/components/ui/sparkle-button";

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { authUser, profile, loading } = useUserProfile();
  const auth = useAuth();

  const handleSignOut = async () => {
    if (auth) {
      localStorage.removeItem('pc_chat_history_v2');
      localStorage.removeItem('pc_builder_state');
      localStorage.removeItem('admin_pc_builder_state');
      await signOut(auth);
      router.push("/");
    }
  };

  interface NavLink {
    href: string;
    label: string;
    role?: string;
    admin?: boolean;
  }

  const mainLinks: NavLink[] = [
    { href: "/builder", label: "Builder" },
    { href: "/ai-build-advisor", label: "Build Advisor" },
    { href: "/pre-builts", label: "Pre-builts" },
  ];

  const adminLinks: NavLink[] = [
    { 
      href: "/admin", 
      label: "Dashboard", 
      role: profile?.isSuperAdmin ? "Super Admin" : "Manager",
      admin: true 
    },
    { 
      href: "/admin/prebuilt-builder", 
      label: "Prebuilt Builder", 
      role: profile?.isSuperAdmin ? "Super Admin" : "Manager",
      admin: true 
    },
  ];

  const commonLinks: NavLink[] = [
    { href: "/profile", label: "Profile" },
  ];

  const filteredLinks: NavLink[] = !profile?.isManager
    ? [...mainLinks, ...commonLinks]
    : [...adminLinks, ...commonLinks];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/60 backdrop-blur-2xl supports-[backdrop-filter]:bg-background/40 shadow-[0_4px_30px_rgba(0,0,0,0.1)]">
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent z-20 opacity-50"></div>
      
      <div className="flex h-16 max-w-[1800px] w-full mx-auto items-center px-4 md:px-12">
        {/* Left: Logo */}
        <div className="flex-none">
          <SparkleButton
            asChild
            pill
            className="p-1 px-4 border-none bg-transparent hover:bg-white/5 shadow-none"
            sparkleColor="#06b6d4"
          >
            <Link href={authUser ? (profile?.isManager ? "/admin" : "/builder") : "/"} className="flex items-center">
              <Logo />
            </Link>
          </SparkleButton>
        </div>

        {/* Center: Animated Navigation */}
        <div className="flex-1 flex justify-center">
          <nav className="hidden md:flex items-center gap-2 p-1 bg-muted/20 rounded-2xl border border-border/40 backdrop-blur-2xl ring-1 ring-ring/5">
            {authUser && filteredLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "relative px-4 py-1.5 text-[10px] font-headline font-bold uppercase tracking-widest transition-all duration-300 rounded-xl hover:scale-105 active:scale-95",
                    isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <span className="relative z-10 flex items-center gap-2">
                    {link.label}
                    {link.role && (
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "ml-1 px-1.5 py-0 text-[8px] uppercase tracking-tighter transition-all duration-300 whitespace-nowrap",
                          isActive 
                            ? (profile?.isSuperAdmin ? "bg-primary/20 text-primary border-primary/30" : "bg-amber-500/20 text-amber-500 border-amber-500/30")
                            : "bg-muted/50 text-muted-foreground border-border/50"
                        )}
                      >
                        {link.role}
                      </Badge>
                    )}
                    {link.admin && profile?.isSuperAdmin && !link.role && <Shield className="w-3 h-3" />}
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
              <div className="hidden lg:flex flex-col items-end mr-1">
                <span className="text-[10px] font-headline font-bold uppercase tracking-[0.15em] text-foreground">
                  {profile?.name || authUser?.displayName || authUser?.email?.split('@')[0] || "User"}
                </span>
                <span className="text-[8px] font-bold uppercase tracking-widest text-primary/80 -mt-0.5">
                  {profile?.isSuperAdmin ? "Neural Administrator" : profile?.isManager ? "System Manager" : "Citizen Architect"}
                </span>
              </div>

              <div className="hidden sm:flex items-center gap-1.5 p-1 bg-muted/40 rounded-xl border border-border/20">
                {!profile?.isManager && <UserNotifications />}
                {profile?.isManager && <NotificationCenter />}
                <ThemeToggle />
              </div>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="hidden sm:flex rounded-xl h-9 px-4 text-[10px] font-bold uppercase tracking-widest border border-destructive/20 hover:bg-destructive/10 hover:text-destructive transition-all duration-300 group"
                  >
                    <LogOut className="mr-2 h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" />
                    Sign Out
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-background/95 backdrop-blur-xl border-border/40 rounded-2xl shadow-2xl">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-xl font-bold tracking-tight">Confirm Sign Out</AlertDialogTitle>
                    <AlertDialogDescription className="text-muted-foreground">
                      Are you sure you want to sign out? You will need to sign back in to access your saved builds and settings.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="mt-4 gap-2">
                    <AlertDialogCancel className="rounded-xl border-border/40 hover:bg-muted/50 font-bold uppercase tracking-widest text-[10px]">Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleSignOut}
                      className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 font-bold uppercase tracking-widest text-[10px] shadow-lg shadow-destructive/20"
                    >
                      Sign Out
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              {/* Mobile Menu Trigger */}
              <div className="md:hidden">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl border border-border/20 bg-muted/40">
                      <Menu className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="bg-background/95 backdrop-blur-xl border-border/40 w-[280px]">
                    <SheetHeader className="sr-only">
                      <SheetTitle>Navigation Menu</SheetTitle>
                      <SheetDescription>
                        Access application pages and user settings.
                      </SheetDescription>
                    </SheetHeader>
                    <div className="flex flex-col gap-6 mt-8">
                      <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                          <Logo />
                          <ThemeToggle />
                        </div>
                        <div className="flex flex-col gap-1 px-4 py-3 bg-muted/30 rounded-2xl border border-border/20">
                          <span className="text-xs font-headline font-bold uppercase tracking-[0.1em] text-foreground">
                            {profile?.name || authUser?.displayName || authUser?.email?.split('@')[0] || "User"}
                          </span>
                          <span className="text-[9px] font-bold uppercase tracking-widest text-primary/80">
                            {profile?.isSuperAdmin ? "Neural Administrator" : profile?.isManager ? "System Manager" : "Citizen Architect"}
                          </span>
                        </div>
                      </div>
                      <nav className="flex flex-col gap-2">
                        {filteredLinks.map((link) => {
                          const isActive = pathname === link.href;
                          return (
                            <Link
                              key={link.href}
                              href={link.href}
                              className={cn(
                                "flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold uppercase tracking-widest transition-all",
                                isActive 
                                  ? "bg-primary/10 text-primary border border-primary/20" 
                                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground border border-transparent"
                              )}
                            >
                              <span className="flex items-center gap-2">
                                {link.label}
                                {link.role && (
                                  <Badge 
                                    variant="outline" 
                                    className={cn(
                                      "px-2 py-0 text-[8px] uppercase tracking-tighter whitespace-nowrap",
                                      profile?.isSuperAdmin ? "bg-primary/10 text-primary border-primary/20" : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                                    )}
                                  >
                                    {link.role}
                                  </Badge>
                                )}
                                {link.admin && profile?.isSuperAdmin && !link.role && <Shield className="w-4 h-4" />}
                              </span>
                              {isActive && <div className="h-1.5 w-1.5 rounded-full bg-primary" />}
                            </Link>
                          );
                        })}
                      </nav>
                      <div className="mt-auto space-y-4">
                        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-muted/40 border border-border/20">
                           {!profile?.isManager && <UserNotifications />}
                           {profile?.isManager && <NotificationCenter />}
                           <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Notifications</span>
                        </div>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              className="w-full justify-start rounded-xl h-12 px-4 text-xs font-bold uppercase tracking-widest border border-destructive/20 text-destructive hover:bg-destructive/10"
                            >
                              <LogOut className="mr-3 h-4 w-4" />
                              Sign Out
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-background/95 backdrop-blur-xl border-border/40 rounded-2xl w-[90vw] max-w-[350px]">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-lg font-bold tracking-tight">Sign Out?</AlertDialogTitle>
                              <AlertDialogDescription className="text-xs text-muted-foreground">
                                You will be logged out of your account.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="mt-4 flex flex-row gap-2 sm:flex-row">
                              <AlertDialogCancel className="flex-1 rounded-xl border-border/40 font-bold uppercase tracking-widest text-[10px] m-0">No</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={handleSignOut}
                                className="flex-1 rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 font-bold uppercase tracking-widest text-[10px] m-0"
                              >
                                Yes
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
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
