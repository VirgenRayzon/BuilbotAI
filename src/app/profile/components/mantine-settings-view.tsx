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
  Breadcrumbs,
  Anchor,
  ThemeIcon,
  Badge,
  PasswordInput,
  Divider,
} from "@mantine/core";
import {
  User as UserIcon,
  Mail,
  MapPin,
  Building,
  Upload,
  Key,
  Shield,
  CheckCircle2,
  Lock,
} from "lucide-react";
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
  address: string;
  setAddress: (val: string) => void;
  apartment: string;
  setApartment: (val: string) => void;
  city: string;
  setCity: (val: string) => void;
  state: string;
  setState: (val: string) => void;
  zip: string;
  setZip: (val: string) => void;
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoInputUrl, setPhotoInputUrl] = useState("");
  const [showPhotoUrlPrompt, setShowPhotoUrlPrompt] = useState(false);

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

  const breadcrumbItems = [
    { title: "Dashboard", href: isSuperAdmin || isManager ? "/admin" : "/builder" },
    { title: "Apps", href: "/profile" },
    { title: "Settings", href: "#" },
  ].map((item, index) => (
    <Anchor
      key={index}
      href={item.href}
      size="xs"
      className="text-slate-500 hover:text-blue-500 dark:text-slate-400 dark:hover:text-blue-400 font-medium"
    >
      {item.title}
    </Anchor>
  ));

  return (
    <div className="space-y-6">


      {/* Main 2-Column Grid */}
      <Grid gutter="md">
        {/* LEFT COLUMN: User Information */}
        <Grid.Col span={{ base: 12, lg: 6.5 }}>
          <Paper
            withBorder
            radius="lg"
            p="xl"
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
                label="User Name"
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
        <Grid.Col span={{ base: 12, lg: 5.5 }}>
          <Paper
            withBorder
            radius="lg"
            p="xl"
            className="bg-white dark:bg-[#111722] border-slate-200 dark:border-white/10 shadow-sm h-full flex flex-col justify-between"
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
                <Grid.Col span={6}>
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
                <Grid.Col span={6}>
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

              {/* Street Address */}
              <TextInput
                label="Address"
                placeholder="Street address or delivery location"
                value={address}
                onChange={(e) => setAddress(e.currentTarget.value)}
                radius="md"
                size="sm"
                leftSection={<MapPin size={16} className="text-slate-400" />}
                classNames={{
                  label: "text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1",
                  input:
                    "bg-slate-50 dark:bg-slate-900/50 border-slate-300 dark:border-white/10 text-slate-900 dark:text-slate-100 focus:border-blue-500",
                }}
              />

              {/* Apartment/Studio/Floor */}
              <TextInput
                label="Apartment/Studio/Floor"
                placeholder="apartment, studio, or floor"
                value={apartment}
                onChange={(e) => setApartment(e.currentTarget.value)}
                radius="md"
                size="sm"
                leftSection={<Building size={16} className="text-slate-400" />}
                classNames={{
                  label: "text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1",
                  input:
                    "bg-slate-50 dark:bg-slate-900/50 border-slate-300 dark:border-white/10 text-slate-900 dark:text-slate-100 focus:border-blue-500",
                }}
              />

              {/* City, State, Zip (3 Columns) */}
              <Grid gutter="xs">
                <Grid.Col span={5}>
                  <TextInput
                    label="City"
                    placeholder="city"
                    value={city}
                    onChange={(e) => setCity(e.currentTarget.value)}
                    radius="md"
                    size="sm"
                    classNames={{
                      label: "text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1",
                      input:
                        "bg-slate-50 dark:bg-slate-900/50 border-slate-300 dark:border-white/10 text-slate-900 dark:text-slate-100 focus:border-blue-500",
                    }}
                  />
                </Grid.Col>
                <Grid.Col span={4}>
                  <TextInput
                    label="State"
                    placeholder="state"
                    value={state}
                    onChange={(e) => setState(e.currentTarget.value)}
                    radius="md"
                    size="sm"
                    classNames={{
                      label: "text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1",
                      input:
                        "bg-slate-50 dark:bg-slate-900/50 border-slate-300 dark:border-white/10 text-slate-900 dark:text-slate-100 focus:border-blue-500",
                    }}
                  />
                </Grid.Col>
                <Grid.Col span={3}>
                  <TextInput
                    label="Zip"
                    placeholder="zip"
                    value={zip}
                    onChange={(e) => setZip(e.currentTarget.value)}
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

            <div className="pt-6 mt-4 border-t border-slate-200 dark:border-white/10 flex justify-start">
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
    </div>
  );
}
