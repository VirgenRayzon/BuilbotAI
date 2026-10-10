"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";
import {
  Loader2,
  Shield,
  ShieldCheck,
  LogOut,
  ChevronDown,
  Package,
  Heart,
  History,
  Settings,
  Cpu,
  Database,
  Sliders,
  User as UserIcon,
} from "lucide-react";
import { useUserProfile } from "@/context/user-profile";
import { useAuth } from "@/firebase";
import { signOut } from "firebase/auth";
import { ThemeToggle } from "./theme-toggle";
import { UserNotifications } from "./user-notifications";
import { NotificationCenter } from "./notification-center";
import {
  Avatar,
  Badge,
  Burger,
  Button,
  Divider,
  Drawer,
  Group,
  Menu,
  Modal,
  ScrollArea,
  Stack,
  Text,
  ThemeIcon,
  UnstyledButton,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import classes from "./header.module.css";
import { HeaderMegaMenu } from "./header-mega-menu";

interface NavTab {
  href: string;
  label: string;
  role?: string;
  admin?: boolean;
}

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { authUser, profile, loading } = useUserProfile();
  const auth = useAuth();
  const [mounted, setMounted] = useState(false);
  const [userMenuOpened, setUserMenuOpened] = useState(false);
  const [drawerOpened, { toggle: toggleDrawer, close: closeDrawer }] = useDisclosure(false);
  const [signOutModalOpen, setSignOutModalOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const logoHref = !mounted
    ? "/"
    : loading
      ? "#"
      : authUser
        ? (profile?.isManager || profile?.isSuperAdmin ? "/admin" : "/builder")
        : "/";

  const handleSignOut = async () => {
    if (auth) {
      const isStaff = Boolean(profile?.isSuperAdmin || profile?.isManager);
      const destination = isStaff ? "/system-access" : "/signin";
      localStorage.removeItem("pc_chat_history_v2");
      localStorage.removeItem("pc_builder_state");
      localStorage.removeItem("admin_pc_builder_state");
      try {
        await signOut(auth);
      } finally {
        window.location.replace(destination);
      }
    }
  };

  const mainTabs: NavTab[] = [
    { href: "/builder", label: "Builder" },
    { href: "/ai-build-advisor", label: "Build Advisor" },
    { href: "/pre-builts", label: "Pre-builts" },
  ];

  const adminTabs: NavTab[] = [
    {
      href: "/admin",
      label: "Dashboard",
      role: profile?.isSuperAdmin ? "Super Admin" : "Manager",
      admin: true,
    },
    {
      href: "/admin/prebuilt-builder",
      label: "Prebuilt Builder",
      role: profile?.isSuperAdmin ? "Super Admin" : "Manager",
      admin: true,
    },
  ];

  const isStaff = Boolean(profile?.isSuperAdmin || profile?.isManager);

  // Super Admin & Manager only see administrative portals (Dashboard, Prebuilt Builder).
  // Standard customers see Builder, Build Advisor, and Pre-builts.
  const tabs: NavTab[] = isStaff ? adminTabs : mainTabs;

  // Hide header on dedicated full-screen authentication pages
  if (
    mounted &&
    ["/signin", "/signup", "/system-access", "/system-access/signup", "/forgot-password"].includes(pathname)
  ) {
    return null;
  }

  // Render HeaderMegaMenu on onboarding/landing page, or for unauthenticated visitors on public pages
  if (pathname === "/" || (!authUser && ["/about", "/faq", "/team", "/contact"].includes(pathname))) {
    return <HeaderMegaMenu />;
  }

  const userName =
    profile?.name ||
    authUser?.displayName ||
    authUser?.email?.split("@")[0] ||
    "User";

  const userEmail = profile?.email || authUser?.email || "";

  const roleLabel = profile?.isSuperAdmin
    ? "Administrator Access"
    : profile?.isManager
      ? "Manager Access"
      : "Customer Access";

  const roleBadgeColor = profile?.isSuperAdmin
    ? "cyan"
    : profile?.isManager
      ? "amber"
      : "blue";

  return (
    <>
      <header className={classes.header}>
        <div className={classes.inner}>
          {/* Left: Brand Logo with Blue Robot Icon */}
          <div className="flex-none">
            <Link
              href={logoHref}
              className="flex items-center no-underline focus:outline-none"
            >
              <Logo />
            </Link>
          </div>

          {/* Right Section: Aligned Tabs & User Actions */}
          <div className="flex items-center gap-2 md:gap-3">
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin text-cyan-500/70" />
            ) : authUser ? (
              <>
                {/* Desktop Tabs aligned with user */}
                <nav className="hidden sm:flex items-center gap-1" aria-label="Main Navigation">
                  {tabs.map((tab) => {
                    const isActive = pathname === tab.href;
                    return (
                      <Link
                        key={tab.href}
                        href={tab.href}
                        className={classes.tabLink}
                        data-active={isActive || undefined}
                      >
                        <span>{tab.label}</span>
                        {tab.role && (
                          <Badge
                            size="xs"
                            variant="light"
                            color={tab.role === "Super Admin" ? "cyan" : "yellow"}
                            className="text-[9px] uppercase tracking-tighter ml-1"
                          >
                            {tab.role}
                          </Badge>
                        )}
                        {tab.admin && profile?.isSuperAdmin && !tab.role && (
                          <Shield className="w-3 h-3 text-cyan-500" />
                        )}
                      </Link>
                    );
                  })}
                </nav>

                <Divider
                  orientation="vertical"
                  h={24}
                  className="hidden sm:block border-slate-200 dark:border-white/10"
                />

                {/* Notification Center */}
                <div className="flex items-center gap-1">
                  {!profile?.isManager && <UserNotifications />}
                  {profile?.isManager && <NotificationCenter />}
                  <ThemeToggle />
                </div>

                {/* Mantine User Dropdown Menu */}
                <Menu
                  width={260}
                  position="bottom-end"
                  transitionProps={{ transition: "pop-top-right", duration: 150 }}
                  onClose={() => setUserMenuOpened(false)}
                  onOpen={() => setUserMenuOpened(true)}
                  withinPortal
                  shadow="md"
                >
                  <Menu.Target>
                    <UnstyledButton
                      className={cn(classes.user, {
                        [classes.userActive]: userMenuOpened,
                      })}
                      aria-label="User account menu"
                    >
                      <Group gap={8}>
                        <Avatar
                          src={authUser?.photoURL || undefined}
                          alt={userName}
                          radius="xl"
                          size={28}
                          color="cyan"
                          variant="light"
                          className="border border-cyan-500/30"
                        >
                          {userName.charAt(0).toUpperCase()}
                        </Avatar>
                        <div className="hidden lg:flex flex-col text-left">
                          <Text fw={600} size="xs" lh={1.2} className="text-slate-900 dark:text-slate-100">
                            {userName}
                          </Text>
                          <Text size="10px" c="dimmed" lh={1.1}>
                            {profile?.isSuperAdmin ? "Super Admin" : profile?.isManager ? "Manager" : "Customer"}
                          </Text>
                        </div>
                        <ChevronDown
                          size={13}
                          className={cn(
                            "text-slate-400 transition-transform duration-200 hidden sm:block",
                            userMenuOpened && "rotate-180"
                          )}
                        />
                      </Group>
                    </UnstyledButton>
                  </Menu.Target>

                  <Menu.Dropdown className="bg-white/95 dark:bg-[#111722]/95 border-slate-200 dark:border-white/10 backdrop-blur-xl shadow-2xl p-1.5 rounded-xl">
                    {/* User Identity Header */}
                    <div className="px-3 py-2.5 mb-1 border-b border-slate-100 dark:border-white/10">
                      <Text fw={600} size="sm" className="text-slate-900 dark:text-slate-100">
                        {userName}
                      </Text>
                      {userEmail && (
                        <Text size="xs" c="dimmed" truncate>
                          {userEmail}
                        </Text>
                      )}
                      <div className="mt-2">
                        <Badge
                          size="xs"
                          variant="light"
                          color={roleBadgeColor}
                          className="font-bold tracking-wider uppercase text-[9px]"
                        >
                          {roleLabel}
                        </Badge>
                      </div>
                    </div>

                    {/* Account Section */}
                    <Menu.Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      Account
                    </Menu.Label>

                    <Menu.Item
                      leftSection={<UserIcon size={16} className="text-cyan-500" />}
                      onClick={() => router.push("/profile")}
                      className="rounded-lg text-xs font-medium py-2 hover:bg-slate-100 dark:hover:bg-white/5"
                    >
                      Profile
                    </Menu.Item>

                    {/* Non-staff Customer Workspaces */}
                    {!isStaff && (
                      <>
                        <Menu.Item
                          leftSection={<Package size={16} className="text-cyan-500" />}
                          onClick={() => router.push("/profile?tab=reservations")}
                          className="rounded-lg text-xs font-medium py-2 hover:bg-slate-100 dark:hover:bg-white/5"
                        >
                          Reservations
                        </Menu.Item>

                        <Menu.Item
                          leftSection={<Heart size={16} className="text-rose-500" />}
                          onClick={() => router.push("/profile?tab=favorites")}
                          className="rounded-lg text-xs font-medium py-2 hover:bg-slate-100 dark:hover:bg-white/5"
                        >
                          Saved Favorites
                        </Menu.Item>
                      </>
                    )}

                    {/* Staff Portals: Management Portal */}
                    {isStaff && profile?.isSuperAdmin && (
                      <Menu.Item
                        leftSection={<Sliders size={16} className="text-cyan-500" />}
                        onClick={() => router.push("/admin?tab=management")}
                        className="rounded-lg text-xs font-medium py-2 hover:bg-slate-100 dark:hover:bg-white/5"
                      >
                        Management Portal
                      </Menu.Item>
                    )}

                    {isStaff ? (
                      <Menu.Item
                        leftSection={<History size={16} className="text-indigo-500" />}
                        onClick={() => router.push("/admin?tab=audit")}
                        className="rounded-lg text-xs font-medium py-2 hover:bg-slate-100 dark:hover:bg-white/5"
                      >
                        Audit Logs
                      </Menu.Item>
                    ) : (
                      <Menu.Item
                        leftSection={<History size={16} className="text-indigo-500" />}
                        onClick={() => router.push("/profile?tab=activity")}
                        className="rounded-lg text-xs font-medium py-2 hover:bg-slate-100 dark:hover:bg-white/5"
                      >
                        Activity Logs
                      </Menu.Item>
                    )}

                    <Menu.Divider className="my-1 border-slate-100 dark:border-white/10" />

                    {/* Settings Section */}
                    <Menu.Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      Settings
                    </Menu.Label>

                    <Menu.Item
                      leftSection={<Settings size={16} className="text-slate-500 dark:text-slate-400" />}
                      onClick={() => router.push("/profile?tab=settings")}
                      className="rounded-lg text-xs font-medium py-2 hover:bg-slate-100 dark:hover:bg-white/5"
                    >
                      Account Settings
                    </Menu.Item>

                    <Menu.Divider className="my-1 border-slate-100 dark:border-white/10" />

                    {/* Session / Danger Zone Section */}
                    <Menu.Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      Session
                    </Menu.Label>

                    <Menu.Item
                      color="red"
                      leftSection={<LogOut size={16} />}
                      onClick={() => setSignOutModalOpen(true)}
                      className="rounded-lg text-xs font-semibold py-2 hover:bg-red-50 dark:hover:bg-red-950/20"
                    >
                      Sign Out
                    </Menu.Item>
                  </Menu.Dropdown>
                </Menu>

                {/* Mobile Hamburger Burger */}
                <Burger
                  opened={drawerOpened}
                  onClick={toggleDrawer}
                  hiddenFrom="sm"
                  size="sm"
                  aria-label="Toggle navigation"
                  className="text-slate-700 dark:text-slate-200"
                />
              </>
            ) : (
              /* Public / Logged-out State */
              <div className="flex items-center gap-2">
                {pathname === "/signin" || pathname === "/signup" ? (
                  <Button
                    component={Link}
                    href="/"
                    variant="subtle"
                    size="sm"
                    radius="md"
                    className="text-xs font-semibold"
                  >
                    Home
                  </Button>
                ) : (
                  <Button
                    component={Link}
                    href="/signin"
                    variant="filled"
                    color="blue"
                    size="sm"
                    radius="md"
                    className="text-xs font-semibold shadow-md shadow-blue-500/20"
                  >
                    Sign In
                  </Button>
                )}
                <ThemeToggle />
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        <Drawer
          opened={drawerOpened}
          onClose={closeDrawer}
          size="280px"
          padding="md"
          position="right"
          title={
            <div className="flex items-center gap-2">
              <Logo showText={false} />
              <Text fw={700} size="sm" className="font-headline">
                Navigation
              </Text>
            </div>
          }
          hiddenFrom="sm"
          zIndex={100000}
          classNames={{
            content: "bg-white dark:bg-[#111722] text-slate-900 dark:text-slate-100",
            header: "bg-white dark:bg-[#111722] border-b border-slate-200 dark:border-white/10",
          }}
        >
          <ScrollArea h="calc(100vh - 80px)" mx="-md" px="md">
            {authUser && (
              <div className="p-3 mb-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                <Group gap="sm">
                  <Avatar
                    src={authUser?.photoURL || undefined}
                    alt={userName}
                    radius="xl"
                    size={36}
                    color="cyan"
                    variant="light"
                  >
                    {userName.charAt(0).toUpperCase()}
                  </Avatar>
                  <div className="flex flex-col">
                    <Text fw={700} size="sm" className="text-slate-900 dark:text-slate-100 leading-tight">
                      {userName}
                    </Text>
                    <Badge size="xs" variant="light" color={roleBadgeColor} className="mt-2">
                      {roleLabel}
                    </Badge>
                  </div>
                </Group>
              </div>
            )}

            <Text size="xs" fw={700} c="dimmed" className="uppercase tracking-wider px-2 mb-2">
              Navigation
            </Text>

            <Stack gap={4}>
              {tabs.map((tab) => {
                const isActive = pathname === tab.href;
                return (
                  <Link
                    key={tab.href}
                    href={tab.href}
                    className={classes.drawerLink}
                    data-active={isActive || undefined}
                    onClick={closeDrawer}
                  >
                    <span>{tab.label}</span>
                    {isActive && <div className="h-1.5 w-1.5 rounded-full bg-blue-500 dark:bg-cyan-400" />}
                  </Link>
                );
              })}
            </Stack>

            {authUser && (
              <>
                <Divider my="md" className="border-slate-200 dark:border-white/10" />

                <Text size="xs" fw={700} c="dimmed" className="uppercase tracking-wider px-2 mb-2">
                  Account
                </Text>

                <Stack gap={4}>
                  <Link
                    href="/profile"
                    className={classes.drawerLink}
                    onClick={closeDrawer}
                  >
                    <span className="flex items-center gap-2">
                      <UserIcon size={16} className="text-cyan-500" />
                      Profile
                    </span>
                  </Link>

                  {!isStaff && (
                    <>
                      <Link
                        href="/profile?tab=reservations"
                        className={classes.drawerLink}
                        onClick={closeDrawer}
                      >
                        <span className="flex items-center gap-2">
                          <Package size={16} className="text-cyan-500" />
                          Reservations
                        </span>
                      </Link>

                      <Link
                        href="/profile?tab=favorites"
                        className={classes.drawerLink}
                        onClick={closeDrawer}
                      >
                        <span className="flex items-center gap-2">
                          <Heart size={16} className="text-rose-500" />
                          Saved Favorites
                        </span>
                      </Link>
                    </>
                  )}

                  {isStaff && profile?.isSuperAdmin && (
                    <Link
                      href="/admin?tab=management"
                      className={classes.drawerLink}
                      onClick={closeDrawer}
                    >
                      <span className="flex items-center gap-2">
                        <Sliders size={16} className="text-cyan-500" />
                        Management Portal
                      </span>
                    </Link>
                  )}

                  <Link
                    href={isStaff ? "/admin?tab=audit" : "/profile?tab=activity"}
                    className={classes.drawerLink}
                    onClick={closeDrawer}
                  >
                    <span className="flex items-center gap-2">
                      <History size={16} className="text-indigo-500" />
                      {isStaff ? "Audit Logs" : "Activity Logs"}
                    </span>
                  </Link>

                  <Link
                    href="/profile?tab=settings"
                    className={classes.drawerLink}
                    onClick={closeDrawer}
                  >
                    <span className="flex items-center gap-2">
                      <Settings size={16} className="text-slate-500" />
                      Account Settings
                    </span>
                  </Link>
                </Stack>

                <Divider my="md" className="border-slate-200 dark:border-white/10" />

                <div className="pt-2">
                  <Button
                    color="red"
                    variant="light"
                    fullWidth
                    leftSection={<LogOut size={16} />}
                    onClick={() => {
                      closeDrawer();
                      setSignOutModalOpen(true);
                    }}
                    radius="md"
                    className="font-semibold text-xs"
                  >
                    Sign Out
                  </Button>
                </div>
              </>
            )}
          </ScrollArea>
        </Drawer>
      </header>

      {/* Mantine Sign Out Confirmation Modal */}
      <Modal
        opened={signOutModalOpen}
        onClose={() => setSignOutModalOpen(false)}
        centered
        radius="lg"
        size="sm"
        title={
          <Group gap="xs">
            <ThemeIcon size="md" radius="md" color="red" variant="light">
              <LogOut size={16} />
            </ThemeIcon>
            <Text fw={700} size="sm" className="font-headline text-slate-900 dark:text-slate-100">
              Confirm Sign Out
            </Text>
          </Group>
        }
        classNames={{
          content: "bg-white/95 dark:bg-[#141a23]/95 backdrop-blur-md border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-slate-100 shadow-xl rounded-xl overflow-hidden",
          header: "bg-white/95 dark:bg-[#141a23]/95 border-b border-slate-200/80 dark:border-white/10 p-3",
          body: "!p-3",
          close: "text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors",
        }}
      >
        <Text size="xs" c="dimmed" className="leading-relaxed mt-1">
          Are you sure you want to sign out? You will need to sign back in to access your saved builds and hardware configurations.
        </Text>

        <Group justify="flex-end" gap="xs" mt="md">
          <Button
            variant="default"
            size="xs"
            radius="md"
            onClick={() => setSignOutModalOpen(false)}
            className="text-xs font-semibold"
          >
            Cancel
          </Button>
          <Button
            color="red"
            size="xs"
            radius="md"
            onClick={handleSignOut}
            className="text-xs font-semibold shadow-sm shadow-red-500/20"
          >
            Sign Out
          </Button>
        </Group>
      </Modal>
    </>
  );
}
