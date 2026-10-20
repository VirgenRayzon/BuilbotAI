"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Paper,
  Title,
  Text,
  TextInput,
  Select,
  Textarea,
  Button as MantineButton,
  Badge,
  ThemeIcon,
  Stack,
  Group,
  Alert,
} from "@mantine/core";
import {
  MessageCircle,
  MapPin,
  Send,
  CheckCircle2,
  Clock,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/context/theme-provider";
import { useUserProfile } from "@/context/user-profile";

export default function ContactPage() {
  const { theme } = useTheme();
  const { authUser, profile } = useUserProfile();
  const searchParams = useSearchParams();
  const isDark = theme === "dark";

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState<string | null>("Hardware Compatibility Inquiry");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState("");
  const [inquiryId, setInquiryId] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");

  useEffect(() => {
    if (!authUser) return;
    setEmail(authUser.email ?? profile?.email ?? "");
    setFullName(current => current || authUser.displayName || profile?.name || "");
  }, [authUser, profile?.email, profile?.name]);

  useEffect(() => {
    const cancellationSubject = searchParams.get('subject');
    const orderReference = cancellationSubject?.match(/Cancellation Request for Order #(\w+)/i)?.[1];
    if (!orderReference) return;
    setSubject('Order & Reservation Status');
    setMessage(current => current || `I would like to request cancellation for order #${orderReference}.`);
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmissionError("");
    try {
      const idToken = await authUser?.getIdToken();
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        },
        body: JSON.stringify({ fullName, email, subject, message, companyWebsite }),
      });
      const result = await response.json() as { success?: boolean; inquiryId?: string; error?: string };
      if (!response.ok || !result.success) throw new Error(result.error || "We could not submit your message. Please try again.");
      setInquiryId(result.inquiryId ?? "");
      setSubmitted(true);
    } catch (error) {
      setSubmissionError(error instanceof Error ? error.message : "We could not submit your message. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-background pt-32 pb-24 px-4 overflow-hidden relative">
      {/* Ambient Lighting */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[10%] right-[10%] w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-[140px]" />
        <div className="absolute bottom-[10%] left-[10%] w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[140px]" />
      </div>

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          {/* Left Column: Contact Channels & Info */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="lg:col-span-5"
          >
            <div className="flex items-center gap-2 mb-6">
              <Badge
                variant="light"
                color="cyan"
                size="lg"
                radius="xl"
                leftSection={<Sparkles size={14} />}
                className="font-bold tracking-widest uppercase py-2 px-3.5"
              >
                Direct Support
              </Badge>
            </div>

            <h1 className="text-4xl sm:text-6xl font-black font-headline uppercase tracking-tight mb-6 text-slate-900 dark:text-slate-100">
              Get in <span className="text-cyan-600 dark:text-cyan-400">Touch</span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 mb-10 font-medium leading-relaxed">
              Have a question about component compatibility, reservation orders, or custom builds?
              Send a message to our hardware specialists and keep the conversation in BuildbotAI.
            </p>

            <Stack gap="sm" className="mb-6">
              {/* Support is handled in-app; no email notifications are sent. */}
              <Paper
                withBorder
                radius="xl"
                p={12}
                className={cn(
                  "transition-all duration-300",
                  isDark
                    ? "bg-[#111722]/80 border-white/10 hover:border-cyan-500/30"
                    : "bg-white/90 border-slate-200 hover:border-cyan-500/30 shadow-sm"
                )}
              >
                <div className="flex items-start gap-4">
                  <ThemeIcon size={48} radius="xl" variant="light" color="cyan">
                    <MessageCircle size={22} />
                  </ThemeIcon>
                  <div>
                    <Text size="xs" fw={700} className="uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">
                      In-App Support
                    </Text>
                    <Text size="lg" fw={800} className="text-slate-900 dark:text-slate-100 font-headline">
                      BuildbotAI conversations
                    </Text>
                    <Text size="xs" c="dimmed" mt={2}>
                      Sign in before submitting to view and reply to staff updates in Support Requests. Guest inquiries are submit-only.
                    </Text>
                  </div>
                </div>
              </Paper>

              {/* Channel 3: Headquarters */}
              <Paper
                withBorder
                radius="xl"
                p={12}
                className={cn(
                  "transition-all duration-300",
                  isDark
                    ? "bg-[#111722]/80 border-white/10 hover:border-cyan-500/30"
                    : "bg-white/90 border-slate-200 hover:border-cyan-500/30 shadow-sm"
                )}
              >
                <div className="flex items-start gap-4">
                  <ThemeIcon size={48} radius="xl" variant="light" color="cyan">
                    <MapPin size={22} />
                  </ThemeIcon>
                  <div>
                    <Text size="xs" fw={700} className="uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">
                      STI College Cubao
                    </Text>
                    <Text size="lg" fw={800} className="text-slate-900 dark:text-slate-100 font-headline">
                      Cubao, Quezon City
                    </Text>
                    <Text size="xs" c="dimmed" mt={2}>
                      Metro Manila, Philippines
                    </Text>
                  </div>
                </div>
              </Paper>
            </Stack>
          </motion.div>

          {/* Right Column: Mantine Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: "easeOut", delay: 0.2 }}
            className="lg:col-span-7"
          >
            <Paper
              withBorder
              radius="2xl"
              p={12}
              className={cn(
                "backdrop-blur-xl shadow-2xl relative transition-all",
                isDark
                  ? "bg-[#111722]/90 border-white/10 shadow-black/60"
                  : "bg-white/95 border-slate-200 shadow-slate-200/70"
              )}
            >
              <div className="mb-4">
                <Title order={3} className="text-2xl sm:text-3xl font-bold font-headline uppercase tracking-tight text-slate-900 dark:text-slate-100 mb-2">
                  Send a Message
                </Title>
                  <Text size="sm" className="text-slate-600 dark:text-slate-400 font-medium">
                  Submit your request here. Sign in first to continue the conversation and see staff updates in BuildbotAI.
                </Text>
              </div>

              {submitted ? (
                <Alert
                  color="teal"
                  variant="light"
                  radius="lg"
                  icon={<CheckCircle2 size={24} />}
                  title="Message Received"
                  className="py-6"
                >
                  <Text size="sm" mt="xs">
                    Thank you, <strong>{fullName || "Valued Builder"}</strong>! We have received your inquiry regarding &quot;{subject}&quot; and will review your hardware requirements shortly.
                  </Text>
                  {inquiryId && <Text size="xs" mt="xs" c="dimmed">Reference: {inquiryId.slice(0, 8).toUpperCase()}. {authUser ? 'Continue the conversation in Support Requests; updates stay in BuildbotAI.' : 'This guest inquiry is visible to staff only. Sign in before submitting if you want to view replies in BuildbotAI.'}</Text>}
                  {authUser && inquiryId && (
                    <MantineButton component={Link} href={`/support-requests?inquiry=${encodeURIComponent(inquiryId)}`} variant="light" color="teal" size="sm" className="mt-3">
                      Open Support Requests
                    </MantineButton>
                  )}
                  <MantineButton
                    variant="subtle"
                    color="teal"
                    size="sm"
                    className="mt-4"
                    onClick={() => {
                      setSubmitted(false);
                      setFullName("");
                      setEmail("");
                      setMessage("");
                      setSubmissionError("");
                      setInquiryId("");
                    }}
                  >
                    Send Another Message
                  </MantineButton>
                </Alert>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div aria-hidden="true" className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden">
                    <label htmlFor="companyWebsite">Leave this field empty</label>
                    <input id="companyWebsite" tabIndex={-1} autoComplete="off" value={companyWebsite} onChange={event => setCompanyWebsite(event.target.value)} />
                  </div>
                  <Stack gap="sm">
                    {submissionError && <Alert color="red" variant="light" title="Message not sent">{submissionError}</Alert>}
                    <div className="grid sm:grid-cols-2 gap-4">
                      <TextInput
                        label="Full Name"
                        placeholder="e.g. Alex Morgan"
                        required
                        radius="md"
                        size="md"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        classNames={{
                          label: "text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5",
                          input: "bg-slate-50 dark:bg-slate-900/50 border-slate-300 dark:border-white/10 text-slate-900 dark:text-slate-100 font-medium focus:border-cyan-500",
                        }}
                      />
                      <TextInput
                        label="Email Address"
                        type="email"
                        placeholder="alex@example.com"
                        description="For reference only. BuildbotAI does not send inquiry updates by email."
                        required
                        radius="md"
                        size="md"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        classNames={{
                          label: "text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5",
                          input: "bg-slate-50 dark:bg-slate-900/50 border-slate-300 dark:border-white/10 text-slate-900 dark:text-slate-100 font-medium focus:border-cyan-500",
                        }}
                      />
                    </div>

                    <Select
                      label="Inquiry Subject"
                      placeholder="Select a subject"
                      data={[
                        "Hardware Compatibility Inquiry",
                        "Custom Build Commission",
                        "Order & Reservation Status",
                        "Component Availability & Stock",
                        "Technical Support & Warranty",
                        "Other Inquiry",
                      ]}
                      value={subject}
                      onChange={setSubject}
                      radius="md"
                      size="md"
                      classNames={{
                        label: "text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5",
                        input: "bg-slate-50 dark:bg-slate-900/50 border-slate-300 dark:border-white/10 text-slate-900 dark:text-slate-100 font-medium focus:border-cyan-500",
                      }}
                    />

                    <Textarea
                      label="Message Details"
                      placeholder="Tell us about your build goals, target budget, or question..."
                      required
                      minRows={4}
                      radius="md"
                      size="md"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      classNames={{
                        label: "text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5",
                        input: "bg-slate-50 dark:bg-slate-900/50 border-slate-300 dark:border-white/10 text-slate-900 dark:text-slate-100 font-medium focus:border-cyan-500",
                      }}
                    />

                    <MantineButton
                      type="submit"
                      loading={submitting}
                      size="lg"
                      radius="md"
                      color="cyan"
                      rightSection={<Send size={18} />}
                      className="h-12 font-headline font-bold uppercase tracking-wider text-white shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/35 transition-all mt-2"
                    >
                      Send Message
                    </MantineButton>
                  </Stack>
                </form>
              )}
            </Paper>
          </motion.div>
        </div>
      </div>
    </main>
  );
}
