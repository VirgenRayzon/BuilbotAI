"use client";

import React, { useRef, useState } from "react";
import {
  Paper,
  Title,
  Text,
  TextInput,
  Textarea,
  Button,
  Grid,
  Group,
  Stack,
  Avatar,
  Anchor,
  ThemeIcon,
  Badge,
  PasswordInput,
  Divider,
  Modal,
} from "@mantine/core";
import {
  Upload,
  Key,
  KeyRound,
  CheckCircle2,
  Lock,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import {
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  sendPasswordResetEmail,
} from "firebase/auth";
import type { UserProfile } from "@/lib/types";

interface MantineSettingsViewProps {
  profile: UserProfile | null;
  authUser: any;
  name: string;
  setName: (val: string) => void;
  bio: string;
  setBio: (val: string) => void;
  photoURL: string;
  setPhotoURL: (val: string) => void;
  firstName: string;
  setFirstName: (val: string) => void;
  lastName: string;
  setLastName: (val: string) => void;
  email: string;
  setEmail: (val: string) => void;
  address?: string;
  setAddress?: (val: string) => void;
  apartment?: string;
  setApartment?: (val: string) => void;
  city?: string;
  setCity?: (val: string) => void;
  state?: string;
  setState?: (val: string) => void;
  zip?: string;
  setZip?: (val: string) => void;
  isSavingUser: boolean;
  handleSaveUserInfo: () => void;
  isSavingAccount: boolean;
  handleSaveAccountInfo: () => void;
  superAdminKey?: string;
  setSuperAdminKey?: (val: string) => void;
  originalSuperAdminKey?: string;
  isSavingKey?: boolean;
  handleSaveSuperAdminKey?: () => void;
}

export function MantineSettingsView({
  profile,
  authUser,
  name,
  setName,
  bio,
  setBio,
  photoURL,
  setPhotoURL,
  firstName,
  setFirstName,
  lastName,
  setLastName,
  email,
  setEmail,
  address,
  setAddress,
  apartment,
  setApartment,
  city,
  setCity,
  state,
  setState,
  zip,
  setZip,
  isSavingUser,
  handleSaveUserInfo,
  isSavingAccount,
  handleSaveAccountInfo,
  superAdminKey,
  setSuperAdminKey,
  originalSuperAdminKey,
  isSavingKey,
  handleSaveSuperAdminKey,
}: MantineSettingsViewProps) {
  const auth = useAuth();
  const { toast } = useToast();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoInputUrl, setPhotoInputUrl] = useState("");
  const [showPhotoUrlPrompt, setShowPhotoUrlPrompt] = useState(false);

  // Change Password state
  const [passwordModalOpened, setPasswordModalOpened] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [isSendingResetEmail, setIsSendingResetEmail] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const isSuperAdmin = Boolean(profile?.isSuperAdmin);
  const isManager = Boolean(profile?.isManager && !profile?.isSuperAdmin);

  // Avatar initials fallback
  const initials = (name || authUser?.displayName || "User")
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleApplyPhotoUrl = () => {
    if (photoInputUrl.trim()) {
      setPhotoURL(photoInputUrl.trim());
      setShowPhotoUrlPrompt(false);
      setPhotoInputUrl("");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setPhotoURL(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOpenPasswordModal = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordError(null);
    setPasswordModalOpened(true);
  };

  const handleChangePassword = async () => {
    setPasswordError(null);
    if (!newPassword) {
      setPasswordError("Please enter a new password.");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    if (!authUser) {
      setPasswordError("No active user session found.");
      return;
    }

    setIsUpdatingPassword(true);
    try {
      if (currentPassword && authUser.email) {
        try {
          const credential = EmailAuthProvider.credential(authUser.email, currentPassword);
          await reauthenticateWithCredential(authUser, credential);
        } catch (reauthErr: any) {
          console.error("Re-authentication error:", reauthErr);
          if (reauthErr?.code === "auth/wrong-password" || reauthErr?.code === "auth/invalid-credential") {
            setPasswordError("Current password is incorrect.");
            setIsUpdatingPassword(false);
            return;
          }
        }
      }

      await updatePassword(authUser, newPassword);
      toast({
        title: "Password Updated",
        description: "Your account password has been successfully changed.",
      });
      setPasswordModalOpened(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      console.error("Password change error:", err);
      if (err?.code === "auth/requires-recent-login") {
        setPasswordError("For security, please enter your current password or request a reset email link.");
      } else if (err?.code === "auth/weak-password") {
        setPasswordError("Password is too weak. Please use at least 6 characters.");
      } else {
        setPasswordError(err?.message || "Failed to update password. Please try again.");
      }
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleSendResetEmail = async () => {
    const targetEmail = email || authUser?.email;
    if (!auth || !targetEmail) {
      toast({
        title: "Error",
        description: "No email address found for this user account.",
        variant: "destructive",
      });
      return;
    }

    setIsSendingResetEmail(true);
    try {
      await sendPasswordResetEmail(auth, targetEmail);
      toast({
        title: "Reset Link Sent",
        description: `Password reset link dispatched to ${targetEmail}. Check your inbox.`,
      });
      setPasswordModalOpened(false);
    } catch (err: any) {
      console.error("Password reset email error:", err);
      toast({
        title: "Error",
        description: err?.message || "Failed to send password reset email.",
        variant: "destructive",
      });
    } finally {
      setIsSendingResetEmail(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Main 2-Column Grid */}
      <Grid gutter="md">
        {/* LEFT COLUMN: User Information */}
        <Grid.Col span={{ base: 12, lg: 6.5 }}>
          <Paper
            withBorder
            radius="lg"
            p={12}
            className="bg-white dark:bg-[#111722] border-slate-200 dark:border-white/10 shadow-sm h-full flex flex-col justify-between"
          >
            <Stack gap="md">
              <Title
                order={4}
                className="text-base font-bold font-headline text-slate-900 dark:text-slate-100"
              >
                User information
              </Title>

              {/* User Name */}
              <TextInput
                label="Display Name"
                value={name}
                onChange={(e) => setName(e.currentTarget.value)}
                placeholder="Enter your user name"
                radius="md"
                size="sm"
                classNames={{
                  label: "text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1",
                  input:
                    "bg-slate-50 dark:bg-slate-900/50 border-slate-300 dark:border-white/10 text-slate-900 dark:text-slate-100 focus:border-blue-500",
                }}
              />

              {/* Biography */}
              <Textarea
                label="Biography"
                value={bio}
                onChange={(e) => setBio(e.currentTarget.value)}
                placeholder="A dynamic software engineering enthusiast, passionate about custom PC builds, liquid cooling, and next-gen gaming..."
                rows={6}
                radius="md"
                size="sm"
                classNames={{
                  label: "text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1",
                  input:
                    "bg-slate-50 dark:bg-slate-900/50 border-slate-300 dark:border-white/10 text-slate-900 dark:text-slate-100 focus:border-blue-500 text-xs leading-relaxed !h-auto min-h-[140px]",
                }}
              />

              {/* Avatar and Upload Image Section */}
              <div className="pt-2">
                <Text size="xs" fw={600} className="text-slate-700 dark:text-slate-300 mb-2">
                  Profile Picture
                </Text>
                <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-white/5">
                  <Avatar
                    src={photoURL || profile?.photoURL || authUser?.photoURL}
                    size={96}
                    radius="xl"
                    color="blue"
                    className="border-2 border-white dark:border-slate-800 shadow-md ring-2 ring-blue-500/20"
                  >
                    {initials}
                  </Avatar>

                  <div className="flex-1 flex flex-col items-center sm:items-start text-center sm:text-left gap-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*"
                      className="hidden"
                    />

                    <Group gap="xs">
                      <Button
                        variant="light"
                        color="blue"
                        size="xs"
                        radius="md"
                        leftSection={<Upload size={14} />}
                        onClick={() => fileInputRef.current?.click()}
                        className="font-semibold text-xs"
                      >
                        Upload image
                      </Button>
                      <Button
                        variant="subtle"
                        color="gray"
                        size="xs"
                        radius="md"
                        onClick={() => setShowPhotoUrlPrompt(!showPhotoUrlPrompt)}
                        className="text-xs text-slate-600 dark:text-slate-400"
                      >
                        {showPhotoUrlPrompt ? "Cancel URL" : "Use Image URL"}
                      </Button>
                    </Group>

                    {showPhotoUrlPrompt && (
                      <Group gap="xs" className="w-full mt-1">
                        <TextInput
                          placeholder="Paste image URL (https://...)"
                          size="xs"
                          value={photoInputUrl}
                          onChange={(e) => setPhotoInputUrl(e.currentTarget.value)}
                          radius="md"
                          className="flex-1"
                        />
                        <Button size="xs" radius="md" color="blue" onClick={handleApplyPhotoUrl}>
                          Set
                        </Button>
                      </Group>
                    )}

                    <Text size="xs" className="text-slate-500 dark:text-slate-400 leading-normal">
                      For best results, use an image at least 128px by 128px in .jpg or .png format.
                    </Text>
                  </div>
                </div>
              </div>
            </Stack>

            <div className="pt-6 mt-4 border-t border-slate-200 dark:border-white/10 flex justify-start">
              <Button
                color="blue"
                radius="md"
                size="sm"
                loading={isSavingUser}
                onClick={handleSaveUserInfo}
                className="font-semibold text-xs px-5 shadow-sm"
              >
                Save Changes
              </Button>
            </div>
          </Paper>
        </Grid.Col>

        {/* RIGHT COLUMN: Account Information */}
        <Grid.Col span={{ base: 12, lg: 5.5 }} className="self-start">
          <Paper
            withBorder
            radius="lg"
            p={12}
            className="bg-white dark:bg-[#111722] border-slate-200 dark:border-white/10 shadow-sm flex flex-col"
          >
            <Stack gap="md">
              <Group justify="space-between" align="center">
                <Title
                  order={4}
                  className="text-base font-bold font-headline text-slate-900 dark:text-slate-100"
                >
                  Account information
                </Title>
                <Badge
                  size="sm"
                  variant="light"
                  color={isSuperAdmin ? "indigo" : isManager ? "orange" : "blue"}
                  className="font-bold text-[10px] uppercase tracking-wider"
                >
                  {isSuperAdmin ? "Super Admin" : isManager ? "Manager" : "Customer"}
                </Badge>
              </Group>

              {/* First Name & Last Name */}
              <Grid gutter="xs">
                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <TextInput
                    label="First name"
                    placeholder="first name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.currentTarget.value)}
                    radius="md"
                    size="sm"
                    classNames={{
                      label: "text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1",
                      input:
                        "bg-slate-50 dark:bg-slate-900/50 border-slate-300 dark:border-white/10 text-slate-900 dark:text-slate-100 focus:border-blue-500",
                    }}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <TextInput
                    label="Last name"
                    placeholder="last name"
                    value={lastName}
                    onChange={(e) => setLastName(e.currentTarget.value)}
                    radius="md"
                    size="sm"
                    classNames={{
                      label: "text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1",
                      input:
                        "bg-slate-50 dark:bg-slate-900/50 border-slate-300 dark:border-white/10 text-slate-900 dark:text-slate-100 focus:border-blue-500",
                    }}
                  />
                </Grid.Col>
              </Grid>

              {/* Email Address */}
              <TextInput
                label="Email"
                type="email"
                value={email}
                disabled
                placeholder="name@example.com"
                radius="md"
                size="sm"
                rightSection={
                  <CheckCircle2 size={16} className="text-emerald-500 dark:text-emerald-400" />
                }
                classNames={{
                  label: "text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1",
                  input:
                    "bg-slate-100 dark:bg-slate-900/80 border-slate-300 dark:border-white/10 text-slate-600 dark:text-slate-400 cursor-not-allowed font-medium",
                }}
              />

              {/* Change Password Section below Email */}
              <div className="pt-1">
                <div className="flex items-center justify-between mb-1.5">
                  <Text size="xs" fw={600} className="text-slate-700 dark:text-slate-300">
                    Password
                  </Text>
                  <Button
                    variant="light"
                    color="cyan"
                    size="xs"
                    radius="md"
                    leftSection={<KeyRound size={13} />}
                    onClick={handleOpenPasswordModal}
                    className="text-xs h-7 font-semibold"
                  >
                    Change Password
                  </Button>
                </div>
                <TextInput
                  value="••••••••••••••••"
                  disabled
                  readOnly
                  radius="md"
                  size="sm"
                  leftSection={<Lock size={15} className="text-slate-400" />}
                  classNames={{
                    input:
                      "bg-slate-100 dark:bg-slate-900/80 border-slate-300 dark:border-white/10 text-slate-500 font-mono tracking-widest cursor-not-allowed select-none",
                  }}
                />
                <Text size="xs" c="dimmed" mt={4}>
                  Manage your account security and password credentials.
                </Text>
              </div>

              {/* Super Admin Privileged Key Management */}
              {isSuperAdmin && superAdminKey !== undefined && setSuperAdminKey && handleSaveSuperAdminKey && (
                <div className="pt-2">
                  <Divider my="sm" />
                  <Group justify="space-between" mb={4}>
                    <Text size="xs" fw={700} className="text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Key size={14} className="text-indigo-600 dark:text-indigo-400" /> Super Admin Master Key
                    </Text>
                    <Badge size="xs" color="indigo" variant="light">
                      PRIVILEGED
                    </Badge>
                  </Group>
                  <Group gap="xs" wrap="nowrap">
                    <PasswordInput
                      value={superAdminKey}
                      onChange={(e) => setSuperAdminKey(e.currentTarget.value)}
                      placeholder="Super admin master key"
                      radius="md"
                      size="sm"
                      className="flex-1"
                      classNames={{
                        input:
                          "bg-slate-50 dark:bg-slate-900/50 border-slate-300 dark:border-white/10 text-slate-900 dark:text-slate-100 font-mono text-xs",
                      }}
                    />
                    <Button
                      size="sm"
                      radius="md"
                      color="indigo"
                      loading={isSavingKey}
                      disabled={superAdminKey === originalSuperAdminKey}
                      onClick={handleSaveSuperAdminKey}
                      className="text-xs font-semibold"
                    >
                      Save Key
                    </Button>
                  </Group>
                </div>
              )}
            </Stack>

            <div className="pt-4 mt-4 border-t border-slate-200 dark:border-white/10 flex justify-start">
              <Button
                color="blue"
                radius="md"
                size="sm"
                loading={isSavingAccount}
                onClick={handleSaveAccountInfo}
                className="font-semibold text-xs px-5 shadow-sm"
              >
                Save changes
              </Button>
            </div>
          </Paper>
        </Grid.Col>
      </Grid>

      {/* Change Password Modal */}
      <Modal
        opened={passwordModalOpened}
        onClose={() => setPasswordModalOpened(false)}
        title={
          <Group gap="xs">
            <ThemeIcon size="sm" radius="md" color="cyan" variant="light">
              <Lock size={14} />
            </ThemeIcon>
            <Text fw={700} size="sm" className="font-headline text-slate-900 dark:text-white">
              Change Account Password
            </Text>
          </Group>
        }
        centered
        radius="lg"
        overlayProps={{ backgroundOpacity: 0.55, blur: 3 }}
        styles={{
          content: {
            backgroundColor: "var(--mantine-color-body)",
          },
        }}
      >
        <Stack gap="md" className="pt-1">
          {passwordError && (
            <Paper p="xs" radius="md" className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs flex items-center gap-2">
              <AlertCircle size={14} className="shrink-0" />
              <span>{passwordError}</span>
            </Paper>
          )}

          <PasswordInput
            label="Current Password"
            placeholder="Enter current password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.currentTarget.value)}
            size="xs"
            radius="md"
            description="Required if re-authenticating your login session"
          />

          <PasswordInput
            label="New Password"
            placeholder="At least 6 characters"
            value={newPassword}
            onChange={(e) => setNewPassword(e.currentTarget.value)}
            size="xs"
            radius="md"
            required
          />

          <PasswordInput
            label="Confirm New Password"
            placeholder="Re-enter new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.currentTarget.value)}
            size="xs"
            radius="md"
            required
          />

          <Divider my={2} />

          <Group justify="space-between" align="center">
            <Button
              variant="subtle"
              color="gray"
              size="xs"
              loading={isSendingResetEmail}
              onClick={handleSendResetEmail}
              className="text-[11px] font-medium"
            >
              Send Reset Link to Email
            </Button>

            <Group gap="xs">
              <Button
                variant="default"
                size="xs"
                radius="md"
                onClick={() => setPasswordModalOpened(false)}
              >
                Cancel
              </Button>
              <Button
                color="cyan"
                size="xs"
                radius="md"
                loading={isUpdatingPassword}
                onClick={handleChangePassword}
                className="font-bold uppercase tracking-wider text-xs"
              >
                Save Password
              </Button>
            </Group>
          </Group>
        </Stack>
      </Modal>
    </div>
  );
}
