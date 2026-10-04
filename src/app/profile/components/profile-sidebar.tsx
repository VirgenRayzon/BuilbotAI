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
  Shield,
  Settings,
  Activity,
  FileText,
  LogOut,
  ChevronRight,
  Cpu,
  Bot,
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

  // 1. Personal Workspace Items (Available to all users)
  const personalItems = [
    {
      id: "account",
      label: "Account & Security",
      icon: User,
      color: "cyan",
      badge: null,
    },
    {
      id: "reservations",
      label: "Store Reservations",
      icon: Package,
      color: "blue",
      badge: reservationsCount > 0 ? reservationsCount : null,
      badgeColor: "blue",
    },
    {
      id: "favorites",
      label: "Saved Rigs & Builds",
      icon: Heart,
      color: "pink",
      badge: favoritesCount > 0 ? favoritesCount : null,
      badgeColor: "pink",
    },
  ];

  // For regular customers only: Activity History
  if (isRegularUser) {
    personalItems.push({
      id: "activity",
      label: "Activity History",
      icon: History,
      color: "indigo",
      badge: userLogsCount > 0 ? userLogsCount : null,
      badgeColor: "indigo",
    });
  }

  // 2. Operations & Administration Items (Strictly for Manager / Super Admin)
  const adminItems: {
    id: string;
    label: string;
    icon: any;
    color: string;
    badge: any;
    badgeColor?: string;
  }[] = [];

  // Staff Audit Logs (Managers & Super Admin)
  if (isManager || isSuperAdmin) {
    adminItems.push({
      id: "audit",
      label: isSuperAdmin ? "System Audit Logs" : "Staff Audit Logs",
      icon: Shield,
      color: "indigo",
      badge: staffLogsCount > 0 ? staffLogsCount : null,
      badgeColor: "indigo",
    });
  }

  // Super Admin Exclusive Tools
  if (isSuperAdmin) {
    adminItems.push(
      {
        id: "management",
        label: "Management Portal",
        icon: Settings,
        color: "cyan",
        badge: "Admin",
        badgeColor: "cyan",
      },
      {
        id: "ai-models",
        label: "AI Intelligence",
        icon: Bot,
        color: "violet",
        badge: "Vertex",
        badgeColor: "indigo",
      },
      {
        id: "safeguards",
        label: "System Safeguards",
        icon: Activity,
        color: "amber",
        badge: "3 Controls",
        badgeColor: "yellow",
      },
      {
        id: "content",
        label: "Site Content & Story",
        icon: FileText,
        color: "teal",
        badge: null,
      }
    );
  }

  const allNavItems = [...personalItems, ...adminItems];

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
              const isActive = activeTab === item.id;
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
          radius="xl"
          p="md"
          className="flex flex-col justify-between bg-white dark:bg-[#111722] border-slate-200 dark:border-white/10 shadow-sm"
        >
          <div className="space-y-6">
            {/* SECTION 1: PERSONAL WORKSPACE */}
            <div className="space-y-1.5">
              <Text
                size="xs"
                className="text-[10px] font-bold uppercase tracking-[0.15em] font-mono text-slate-400 dark:text-slate-500 px-3 pb-1"
              >
                Workspace
              </Text>

              <div className="space-y-1">
                {personalItems.map((item) => {
                  const isActive = activeTab === item.id;
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
                })}
              </div>
            </div>

            {/* SECTION 2: OPERATIONS & MANAGEMENT (STAFF ONLY) */}
            {adminItems.length > 0 && (
              <div className="space-y-1.5 pt-3 border-t border-slate-200 dark:border-white/10">
                <Text
                  size="xs"
                  className="text-[10px] font-bold uppercase tracking-[0.15em] font-mono text-slate-400 dark:text-slate-500 px-3 pb-1"
                >
                  {isSuperAdmin ? "Administration" : "Operations"}
                </Text>

                <div className="space-y-1">
                  {adminItems.map((item) => {
                    const isActive = activeTab === item.id;
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
                  })}
                </div>
              </div>
            )}
          </div>

          {/* FOOTER ACTIONS */}
          <div className="pt-4 mt-6 border-t border-slate-200 dark:border-white/10 space-y-1">
            {/* Quick Return to PC Builder */}
            <UnstyledButton
              onClick={() => router.push("/builder")}
              className="w-full h-[42px] min-h-[42px] flex items-center justify-between px-3 rounded-xl text-xs font-headline font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-white/[0.04] hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors group"
            >
              <div className="flex items-center gap-2.5">
                <Cpu className="h-4 w-4 text-cyan-500 group-hover:scale-110 transition-transform" />
                <span>Launch PC Builder</span>
              </div>
              <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
            </UnstyledButton>

            {/* Sign Out Button */}
            <UnstyledButton
              onClick={() => setSignOutModalOpen(true)}
              className="w-full h-[42px] min-h-[42px] flex items-center justify-between px-3 rounded-xl text-xs font-headline font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors group"
            >
              <div className="flex items-center gap-2.5">
                <LogOut className="h-4 w-4 text-rose-500 group-hover:scale-110 transition-transform" />
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
          content:
            "border border-slate-200 dark:border-white/10 shadow-2xl bg-white dark:bg-[#111722]",
          header:
            "border-b border-slate-100 dark:border-white/5 pb-3 bg-white dark:bg-[#111722]",
        }}
      >
        <Text size="xs" className="text-slate-600 dark:text-slate-300 leading-relaxed mt-2">
          Are you sure you want to sign out of Buildbot AI? You will need your credentials to access your saved PC configurations and store reservations.
        </Text>

        <Group justify="flex-end" gap="xs" mt="lg">
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
