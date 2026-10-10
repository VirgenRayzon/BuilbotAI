"use client";

import React, { useState } from "react";
import {
  Paper,
  Text,
  Badge,
  Modal,
  Button,
  Group,
  UnstyledButton,
  ThemeIcon,
  Title,
} from "@mantine/core";
import {
  User,
  Package,
  Heart,
  History,
  Settings,
  Activity,
  LogOut,
  ChevronRight,
  Cpu,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/firebase";
import { signOut } from "firebase/auth";
import { cn } from "@/lib/utils";
import type { UserProfile } from "@/lib/types";

interface ProfileSidebarProps {
  profile: UserProfile | null;
  authUser: any;
  activeTab: string;
  onTabChange: (tab: string) => void;
  reservationsCount?: number;
  favoritesCount?: number;
  userLogsCount?: number;
  staffLogsCount?: number;
}

export function ProfileSidebar({
  profile,
  authUser,
  activeTab,
  onTabChange,
  reservationsCount = 0,
  favoritesCount = 0,
  userLogsCount = 0,
  staffLogsCount = 0,
}: ProfileSidebarProps) {
  const router = useRouter();
  const auth = useAuth();
  const [signOutModalOpen, setSignOutModalOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const isSuperAdmin = Boolean(profile?.isSuperAdmin);
  const isManager = Boolean(profile?.isManager && !profile?.isSuperAdmin);
  const isRegularUser = !isSuperAdmin && !isManager;

  // Handle Logout
  const handleConfirmSignOut = async () => {
    if (auth) {
      setIsSigningOut(true);
      const isStaff = isSuperAdmin || isManager;
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

  type NavItem = {
    id: string;
    label: string;
    icon: any;
    color: string;
    badge: any;
    badgeColor?: string;
  };

  // 1. Account Items
  const accountItems: NavItem[] = [
    {
      id: "profile",
      label: "Profile",
      icon: User,
      color: "cyan",
      badge: null,
    },
    {
      id: "settings",
      label: "Settings",
      icon: Settings,
      color: "blue",
      badge: null,
    },
  ];

  // For regular customers only: Store Reservations, Saved Favourites, Activity Logs
  if (isRegularUser) {
    accountItems.push(
      {
        id: "reservations",
        label: "Reservations",
        icon: Package,
        color: "blue",
        badge: reservationsCount > 0 ? reservationsCount : null,
        badgeColor: "blue",
      },
      {
        id: "favorites",
        label: "Saved Favourites",
        icon: Heart,
        color: "pink",
        badge: favoritesCount > 0 ? favoritesCount : null,
        badgeColor: "pink",
      },
      {
        id: "activity",
        label: "Activity Logs",
        icon: History,
        color: "indigo",
        badge: userLogsCount > 0 ? userLogsCount : null,
        badgeColor: "indigo",
      }
    );
  }

  // 2. Administration Items (Super Admin Tools - System Safeguards retained in Profile)
  const adminItems: NavItem[] = [];
  if (isSuperAdmin) {
    adminItems.push({
      id: "safeguards",
      label: "System Safeguards",
      icon: Activity,
      color: "amber",
      badge: "3 Controls",
      badgeColor: "yellow",
    });
  }

  const allNavItems = [...accountItems, ...adminItems];

  const renderNavButton = (item: NavItem) => {
    const isActive = activeTab === item.id || (item.id === "profile" && activeTab === "account");
    const Icon = item.icon;

    return (
      <UnstyledButton
        key={item.id}
        onClick={() => onTabChange(item.id)}
        className={cn(
          "w-full h-[46px] min-h-[46px] max-h-[46px] flex items-center justify-between px-3 rounded-xl text-xs font-headline font-bold uppercase tracking-wider transition-all group",
          isActive
            ? "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-l-4 border-cyan-500 shadow-sm font-extrabold"
            : "text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-white/[0.04] hover:text-slate-900 dark:hover:text-white"
        )}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <ThemeIcon
            size={28}
            radius="md"
            color={isActive ? "cyan" : "gray"}
            variant={isActive ? "light" : "subtle"}
            className="group-hover:scale-110 transition-transform shrink-0"
          >
            <Icon className="h-4 w-4" />
          </ThemeIcon>
          <span className="truncate">{item.label}</span>
        </div>

        {item.badge !== null && (
          <Badge
            size="xs"
            variant={isActive ? "filled" : "light"}
            color={item.badgeColor || "cyan"}
            className="font-mono font-bold shrink-0 ml-2 text-[10px] px-2 py-0.5 whitespace-nowrap"
          >
            {item.badge}
          </Badge>
        )}
      </UnstyledButton>
    );
  };

  return (
    <>
      {/* MOBILE HORIZONTAL NAVIGATION (< lg) */}
      <div className="block lg:hidden w-full mb-6">
        <Paper
          hiddenFrom="lg"
          withBorder
          radius="lg"
          p="xs"
          className="bg-white dark:bg-[#111722] border-slate-200 dark:border-white/10 shadow-sm"
        >
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none px-1">
            {allNavItems.map((item) => {
              const isActive = activeTab === item.id || (item.id === "profile" && activeTab === "account");
              const Icon = item.icon;

              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-3.5 h-9 rounded-lg text-xs font-headline font-bold uppercase tracking-wider whitespace-nowrap shrink-0 transition-all",
                    isActive
                      ? "bg-cyan-500 text-white shadow-sm shadow-cyan-500/20"
                      : "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  )}
                >
                  <Icon size={14} className={isActive ? "text-white" : "text-slate-500 dark:text-slate-400"} />
                  <span>{item.label}</span>
                  {item.badge !== null && (
                    <span
                      className={cn(
                        "text-[10px] font-mono px-1.5 py-0.5 rounded-full font-bold ml-0.5",
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300"
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </Paper>
      </div>

      {/* DESKTOP SIDEBAR (>= lg) */}
      <div className="hidden lg:block w-full">
        <Paper
          visibleFrom="lg"
          withBorder
          radius="lg"
          p="md"
          className="flex flex-col justify-between bg-white dark:bg-[#111722] border-slate-200 dark:border-white/10 shadow-sm"
        >
          <div className="space-y-5">
            {/* SECTION 1: ACCOUNT */}
            <div className="space-y-1.5">
              <Text
                size="xs"
                className="text-[10px] font-bold uppercase tracking-[0.15em] font-mono text-slate-400 dark:text-slate-500 px-3 pb-1"
              >
                Account
              </Text>

              <div className="space-y-1">
                {accountItems.map(renderNavButton)}
              </div>
            </div>

            {/* SECTION 2: ADMINISTRATION */}
            {adminItems.length > 0 && (
              <div className="space-y-1.5 pt-3 border-t border-slate-200 dark:border-white/10">
                <Text
                  size="xs"
                  className="text-[10px] font-bold uppercase tracking-[0.15em] font-mono text-slate-400 dark:text-slate-500 px-3 pb-1"
                >
                  {isSuperAdmin ? "Administration" : "Operations"}
                </Text>

                <div className="space-y-1">
                  {adminItems.map(renderNavButton)}
                </div>
              </div>
            )}

          </div>

          {/* FOOTER ACTIONS: SESSION */}
          <div className="pt-3 border-t border-slate-200 dark:border-white/10 space-y-1.5 mt-5">
            <Text
              size="xs"
              className="text-[10px] font-bold uppercase tracking-[0.15em] font-mono text-slate-400 dark:text-slate-500 px-3 pb-1"
            >
              Session
            </Text>

            {/* Sign Out Button */}
            <UnstyledButton
              onClick={() => setSignOutModalOpen(true)}
              className="w-full h-[46px] min-h-[46px] max-h-[46px] flex items-center justify-between px-3 rounded-xl text-xs font-headline font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors group"
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <ThemeIcon
                  size={28}
                  radius="md"
                  color="red"
                  variant="subtle"
                  className="group-hover:scale-110 transition-transform shrink-0"
                >
                  <LogOut className="h-4 w-4 text-rose-500" />
                </ThemeIcon>
                <span>Sign Out</span>
              </div>
            </UnstyledButton>
          </div>
        </Paper>
      </div>

      {/* Sign Out Confirmation Modal */}
      <Modal
        opened={signOutModalOpen}
        onClose={() => !isSigningOut && setSignOutModalOpen(false)}
        title={
          <Group gap="xs">
            <ThemeIcon color="red" variant="light" radius="md" size="md">
              <LogOut size={16} />
            </ThemeIcon>
            <Title
              order={4}
              className="text-base font-bold font-headline uppercase tracking-tight text-slate-900 dark:text-white"
            >
              Confirm Sign Out
            </Title>
          </Group>
        }
        centered
        radius="lg"
        overlayProps={{
          backgroundOpacity: 0.55,
          blur: 4,
        }}
        classNames={{
          content: "bg-white/95 dark:bg-[#141a23]/95 backdrop-blur-md border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-slate-100 shadow-xl rounded-xl overflow-hidden",
          header: "bg-white/95 dark:bg-[#141a23]/95 border-b border-slate-200/80 dark:border-white/10 px-4 py-3",
          body: "!px-4 !pt-3.5 !pb-4",
          close: "text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors",
        }}
      >
        <Text size="xs" className="text-slate-600 dark:text-slate-300 leading-relaxed mt-1">
          Are you sure you want to sign out of Buildbot AI? You will need your credentials to access your saved PC configurations and store reservations.
        </Text>

        <Group justify="flex-end" gap="xs" mt="md">
          <Button
            variant="default"
            size="xs"
            radius="md"
            disabled={isSigningOut}
            onClick={() => setSignOutModalOpen(false)}
            className="text-xs font-bold uppercase tracking-wider"
          >
            Cancel
          </Button>
          <Button
            color="red"
            size="xs"
            radius="md"
            loading={isSigningOut}
            onClick={handleConfirmSignOut}
            className="text-xs font-bold uppercase tracking-wider shadow-sm shadow-red-500/20"
          >
            Sign Out
          </Button>
        </Group>
      </Modal>
    </>
  );
}
