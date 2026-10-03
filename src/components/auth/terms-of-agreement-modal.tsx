"use client";

import React, { useState } from "react";
import {
  Modal,
  Title,
  Text,
  Stack,
  Group,
  Button,
  ThemeIcon,
  Badge,
  ScrollArea,
  Divider,
  Checkbox,
  Paper,
} from "@mantine/core";
import {
  ShieldCheck,
  Info,
  CheckCircle2,
} from "lucide-react";

interface TermsOfAgreementModalProps {
  opened: boolean;
  onClose: () => void;
  onAccept: () => void;
  isAccepted: boolean;
}

export function TermsOfAgreementModal({
  opened,
  onClose,
  onAccept,
  isAccepted,
}: TermsOfAgreementModalProps) {
  const [agreedToRead, setAgreedToRead] = useState(isAccepted);

  const handleConfirmAccept = () => {
    onAccept();
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size="lg"
      radius="lg"
      centered
      overlayProps={{
        backgroundOpacity: 0.65,
        blur: 5,
      }}
      title={
        <Group gap="sm">
          <ThemeIcon size="lg" radius="md" color="cyan" variant="light">
            <ShieldCheck size={20} />
          </ThemeIcon>
          <div>
            <Title order={3} className="text-lg font-bold font-headline uppercase tracking-tight text-slate-900 dark:text-slate-100">
              Terms and Conditions
            </Title>
            <Text size="xs" className="text-slate-500 dark:text-slate-400">
              Last updated: October 2026 • Please read carefully before using Buildbot AI
            </Text>
          </div>
        </Group>
      }
      classNames={{
        content: "bg-white dark:bg-[#111722] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-100 shadow-2xl",
        header: "bg-white dark:bg-[#111722] border-b border-slate-200 dark:border-white/10 px-6 py-4",
        body: "px-6 pt-6 pb-6",
      }}
    >
      <Stack gap="md">
        {/* Banner Announcement with comfortable spacing from the header line */}
        <Paper
          p="sm"
          radius="md"
          withBorder
          className="mt-2 bg-cyan-500/10 border-cyan-500/20 text-cyan-900 dark:text-cyan-200"
        >
          <Group gap="xs" wrap="nowrap" align="flex-start">
            <Info size={18} className="text-cyan-600 dark:text-cyan-400 shrink-0 mt-0.5" />
            <Text size="xs" className="leading-relaxed">
              Welcome to <strong>Buildbot AI</strong>. Please review our Terms and Conditions, including our AI-assisted recommendations disclaimer, hardware pricing and reservation policies, and assembly safety guidelines.
            </Text>
          </Group>
        </Paper>

        {/* Scrollable Terms Content */}
        <ScrollArea.Autosize mah={380} offsetScrollbars scrollbarSize={6} type="hover" className="pr-2">
          <Stack gap="md" className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">

            {/* Section 1 */}
            <div className="space-y-1.5">
              <Group gap="xs">
                <Badge size="xs" color="cyan" variant="light" className="font-bold">
                  SECTION 01
                </Badge>
                <Text fw={700} className="text-slate-900 dark:text-slate-100 text-xs font-headline uppercase tracking-wider">
                  Acceptance of Terms
                </Text>
              </Group>
              <Text>
                By creating an account, browsing component inventories, or using any feature on Buildbot AI (&ldquo;the Platform&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;), you confirm that you agree to be bound by these Terms and Conditions. If you disagree with any part of these terms, please do not register or use the service.
              </Text>
            </div>

            <Divider color="gray.2" className="dark:border-white/10" />

            {/* Section 2 */}
            <div className="space-y-1.5">
              <Group gap="xs">
                <Badge size="xs" color="indigo" variant="light" className="font-bold">
                  SECTION 02
                </Badge>
                <Text fw={700} className="text-slate-900 dark:text-slate-100 text-xs font-headline uppercase tracking-wider">
                  AI Recommendations & Hardware Compatibility
                </Text>
              </Group>
              <Text>
                Buildbot AI provides automated hardware recommendations, bottleneck calculations, wattage estimates, and compatibility validation powered by AI models and component databases.
              </Text>
              <ul className="list-disc pl-5 space-y-1 text-slate-500 dark:text-slate-400">
                <li>
                  <strong>Informational Guidance Only:</strong> All compatibility checks, bottleneck ratings, and wattage estimations are provided as planning aids and guidance only. They do not constitute guaranteed manufacturer specifications.
                </li>
                <li>
                  <strong>User Verification Responsibility:</strong> You are responsible for independently verifying physical clearances (such as GPU length, CPU cooler height, case radiator brackets, RAM clearance, and power supply dimensions) and motherboard BIOS compatibility prior to purchasing or assembling components.
                </li>
              </ul>
            </div>

            <Divider color="gray.2" className="dark:border-white/10" />

            {/* Section 3 */}
            <div className="space-y-1.5">
              <Group gap="xs">
                <Badge size="xs" color="teal" variant="light" className="font-bold">
                  SECTION 03
                </Badge>
                <Text fw={700} className="text-slate-900 dark:text-slate-100 text-xs font-headline uppercase tracking-wider">
                  Component Pricing, Availability & Reservations
                </Text>
              </Group>
              <Text>
                Component prices, availability, and specifications are displayed based on current market inventory and distributor listings.
              </Text>
              <ul className="list-disc pl-5 space-y-1 text-slate-500 dark:text-slate-400">
                <li>
                  Submitting a pre-built or custom build reservation places a temporary hold on the requested configuration for fulfillment review.
                </li>
                <li>
                  Reservations do not constitute a completed commercial sale until verified and confirmed by our team. We reserve the right to cancel or adjust reservations due to inventory shortages or pricing inaccuracies.
                </li>
              </ul>
            </div>

            <Divider color="gray.2" className="dark:border-white/10" />

            {/* Section 4 */}
            <div className="space-y-1.5">
              <Group gap="xs">
                <Badge size="xs" color="red" variant="light" className="font-bold">
                  SECTION 04
                </Badge>
                <Text fw={700} className="text-slate-900 dark:text-slate-100 text-xs font-headline uppercase tracking-wider">
                  User Accounts & Security
                </Text>
              </Group>
              <Text>
                You are responsible for maintaining the confidentiality of your login credentials and for all activities conducted under your account. You agree to provide accurate information upon registration. Any attempt to gain unauthorized access to administrative portals, reverse-engineer API endpoints, or conduct automated vulnerability scanning is strictly prohibited and will lead to immediate account suspension.
              </Text>
            </div>

            <Divider color="gray.2" className="dark:border-white/10" />

            {/* Section 5 */}
            <div className="space-y-1.5">
              <Group gap="xs">
                <Badge size="xs" color="orange" variant="light" className="font-bold">
                  SECTION 05
                </Badge>
                <Text fw={700} className="text-slate-900 dark:text-slate-100 text-xs font-headline uppercase tracking-wider">
                  Hardware Assembly Safety & Limitation of Liability
                </Text>
              </Group>
              <Text>
                Computer hardware assembly involves working with delicate electronics and electrical power.
              </Text>
              <ul className="list-disc pl-5 space-y-1 text-slate-500 dark:text-slate-400">
                <li>
                  Buildbot AI and its team members are not liable for any physical injury, electrostatic discharge (ESD) damage, bent CPU or socket pins, electrical shorts, thermal paste errors, or voided manufacturer warranties that occur during handling or assembly.
                </li>
                <li>
                  Always adhere to manufacturer manuals, safety guidelines, and anti-static precautions when assembling custom hardware.
                </li>
              </ul>
            </div>

            <Divider color="gray.2" className="dark:border-white/10" />

            {/* Section 6 */}
            <div className="space-y-1.5">
              <Group gap="xs">
                <Badge size="xs" color="blue" variant="light" className="font-bold">
                  SECTION 06
                </Badge>
                <Text fw={700} className="text-slate-900 dark:text-slate-100 text-xs font-headline uppercase tracking-wider">
                  Privacy & Data Protection
                </Text>
              </Group>
              <Text>
                Your personal details, saved builds, and reservation history are protected and handled in accordance with our Privacy Policy. We do not sell or trade your personal data with third-party marketers.
              </Text>
            </div>

            <Divider color="gray.2" className="dark:border-white/10" />

            {/* Section 7 */}
            <div className="space-y-1.5">
              <Group gap="xs">
                <Badge size="xs" color="gray" variant="light" className="font-bold">
                  SECTION 07
                </Badge>
                <Text fw={700} className="text-slate-900 dark:text-slate-100 text-xs font-headline uppercase tracking-wider">
                  Modifications to Terms
                </Text>
              </Group>
              <Text>
                We may revise these Terms and Conditions periodically to reflect updates to our services or changes in applicable laws. Continued use of Buildbot AI after modifications are published signifies your agreement to the updated terms.
              </Text>
            </div>

          </Stack>
        </ScrollArea.Autosize>

        <Divider color="gray.2" className="dark:border-white/10" />

        {/* Checkbox Acknowledgment */}
        <Paper p="sm" radius="md" withBorder className="bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-white/10">
          <Checkbox
            checked={agreedToRead}
            onChange={(e) => setAgreedToRead(e.currentTarget.checked)}
            color="cyan"
            size="sm"
            label={
              <Text size="xs" fw={600} className="text-slate-800 dark:text-slate-200 cursor-pointer">
                I have read, understood, and agree to the Buildbot AI Terms and Conditions.
              </Text>
            }
          />
        </Paper>

        {/* Action Buttons */}
        <Group justify="flex-end" gap="xs">
          <Button
            variant="subtle"
            color="gray"
            size="sm"
            radius="md"
            onClick={onClose}
            className="text-xs font-semibold"
          >
            Review Later
          </Button>
          <Button
            color="cyan"
            size="sm"
            radius="md"
            disabled={!agreedToRead}
            onClick={handleConfirmAccept}
            leftSection={<CheckCircle2 size={16} />}
            className="text-xs font-bold uppercase tracking-wider text-white shadow-md shadow-cyan-500/20"
          >
            Accept & Continue
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
