"use client";

import React, { useState } from "react";
import {
  Paper,
  Title,
  Text,
  Group,
  Badge,
  ThemeIcon,
  Button,
  Modal,
  Avatar,
} from "@mantine/core";
import {
  Shield,
  Mail,
  Calendar,
  Package,
  Truck,
  Cpu,
  LogOut,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/firebase";
import { signOut } from "firebase/auth";
import { formatCurrency } from "@/lib/utils";

interface ProfileHeroProps {
  profile: any;
  authUser: any;
  stats?: {
    totalBuilds: number;
    activeBuilds: number;
    totalValue: number;
  };
}

export function ProfileHero({ profile, authUser, stats }: ProfileHeroProps) {
  const router = useRouter();
  const auth = useAuth();
  const [signOutModalOpen, setSignOutModalOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const isSuperAdmin = Boolean(profile?.isSuperAdmin);
  const isManager = Boolean(profile?.isManager && !profile?.isSuperAdmin);
  const isRegularUser = !isSuperAdmin && !isManager;

  const initial =
    profile?.name?.substring(0, 1).toUpperCase() ||
    authUser?.email?.substring(0, 1).toUpperCase() ||
    "U";

  const joinDate = authUser?.metadata?.creationTime
    ? new Date(authUser.metadata.creationTime).toLocaleDateString(undefined, {
      month: "short",
      year: "numeric",
    })
    : "Member";

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

  return (
    <>
      <div className="w-full px-4 sm:px-6 md:px-8 lg:px-10 mb-6">
        <Paper
          withBorder
          radius="lg"
          p={{ base: "lg", sm: "xl" }}
          className="relative overflow-hidden bg-white/90 dark:bg-[#111722]/95 border-slate-200 dark:border-white/10 shadow-sm backdrop-blur-xl"
        >
          {/* Subtle Accent Glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 dark:bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
          <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            {/* Left: Large Avatar & Comprehensive User Identity */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start lg:items-center gap-5 sm:gap-6 text-center sm:text-left w-full lg:w-auto">
              {/* Avatar */}
              <div className="relative shrink-0">
                <Avatar
                  src={profile?.photoURL || authUser?.photoURL}
                  alt={profile?.name || "User"}
                  size={96}
                  radius="lg"
                  className="!h-24 !w-24 sm:!h-28 sm:!w-28 rounded-2xl bg-gradient-to-br from-cyan-600 via-sky-600 to-indigo-700 text-3xl sm:text-4xl font-black font-headline text-white shadow-xl shadow-cyan-500/20 ring-4 ring-white dark:ring-slate-900 [&_.mantine-Avatar-placeholder]:bg-transparent [&_.mantine-Avatar-placeholder]:text-white shrink-0"
                >
                  {initial}
                </Avatar>
                {isSuperAdmin && (
                  <div
                    className="absolute -bottom-1.5 -right-1.5 bg-indigo-600 text-white rounded-xl p-1.5 shadow-md ring-2 ring-white dark:ring-slate-900"
                    title="Super Admin Verified"
                  >
                    <ShieldCheck size={16} />
                  </div>
                )}
                {isManager && (
                  <div
                    className="absolute -bottom-1.5 -right-1.5 bg-orange-500 text-white rounded-xl p-1.5 shadow-md ring-2 ring-white dark:ring-slate-900"
                    title="Manager Verified"
                  >
                    <Shield size={16} />
                  </div>
                )}
              </div>

              {/* Identity Details */}
              <div className="space-y-2 min-w-0">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                  <Title
                    order={1}
                    className="text-2xl sm:text-3xl font-headline font-black tracking-tight text-slate-900 dark:text-white"
                  >
                    {profile?.name || authUser?.displayName || "PC Builder"}
                  </Title>

                  {isSuperAdmin ? (
                    <Badge
                      size="md"
                      variant="filled"
                      color="indigo"
                      className="font-bold uppercase tracking-wider text-[10px]"
                    >
                      SUPER ADMIN
                    </Badge>
                  ) : isManager ? (
                    <Badge
                      size="md"
                      variant="filled"
                      color="orange"
                      className="font-bold uppercase tracking-wider text-[10px]"
                    >
                      MANAGER
                    </Badge>
                  ) : (
                    <Badge
                      size="md"
                      variant="light"
                      color="blue"
                      className="font-bold uppercase tracking-wider text-[10px]"
                    >
                      CUSTOMER ACCESS
                    </Badge>
                  )}

                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-500/20 px-2 py-0.5 rounded-full">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Account Active
                  </span>
                </div>

                {/* Email, Joined Date, Authority Pill */}
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 sm:gap-4 text-xs font-medium text-slate-600 dark:text-slate-300">
                  {authUser?.email && (
                    <span className="flex items-center gap-1.5">
                      <Mail size={14} className="text-cyan-600 dark:text-cyan-400 shrink-0" />
                      <span className="font-mono text-slate-800 dark:text-slate-200">{authUser.email}</span>
                    </span>
                  )}
                  <span className="hidden sm:inline h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                  <span className="flex items-center gap-1.5 font-mono text-slate-500 dark:text-slate-400">
                    <Calendar size={14} className="text-cyan-600 dark:text-cyan-400 shrink-0" />
                    <span>Joined {joinDate}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Hardware Metrics (for Regular Users) OR Quick Actions (for Staff) */}
            <div className="w-full lg:w-auto flex flex-col sm:flex-row items-center justify-center sm:justify-end gap-3 shrink-0">
              {isRegularUser && stats ? (
                <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-between sm:justify-end">
                  <div className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/5 text-center min-w-[90px]">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400 block">
                      Builds
                    </span>
                    <span className="text-lg font-headline font-bold text-slate-900 dark:text-white">
                      {stats.totalBuilds}
                    </span>
                  </div>

                  <div className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/5 text-center min-w-[90px]">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400 block">
                      Active
                    </span>
                    <span className="text-lg font-headline font-bold text-cyan-600 dark:text-cyan-400">
                      {stats.activeBuilds}
                    </span>
                  </div>

                  <div className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/5 text-center min-w-[110px]">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400 block">
                      Total Value
                    </span>
                    <span className="text-sm font-headline font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(stats.totalValue)}
                    </span>
                  </div>
                </div>
              ) : null}

              <div className="flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-end">


                <Button
                  size="sm"
                  variant="subtle"
                  color="red"
                  onClick={() => setSignOutModalOpen(true)}
                  leftSection={<LogOut size={15} />}
                  className="font-bold text-xs uppercase tracking-wider rounded-xl h-10 px-3 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                >
                  Sign Out
                </Button>
              </div>
            </div>
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
          content: "bg-white dark:bg-[#111722] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-100 shadow-2xl rounded-2xl overflow-hidden",
          header: "bg-white dark:bg-[#111722] border-b border-slate-200 dark:border-white/10 px-6 py-4",
          body: "!px-6 !pt-5 !pb-6",
          close: "text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors",
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
