"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  Alert,
  Button,
  Group,
  Modal,
  Select,
  Stack,
  Text,
  TextInput,
  Textarea,
} from "@mantine/core";
import { MessageSquarePlus, Send } from "lucide-react";
import { contactSubjects, type ContactSubmissionInput } from "@/lib/contact-schemas";
import { useUserProfile } from "@/context/user-profile";
import { useToast } from "@/hooks/use-toast";

interface ComposeInquiryModalProps {
  opened: boolean;
  onClose: () => void;
  onInquiryCreated?: (inquiryId: string) => void;
}

export function ComposeInquiryModal({
  opened,
  onClose,
  onInquiryCreated,
}: ComposeInquiryModalProps) {
  const { authUser, profile } = useUserProfile();
  const { toast } = useToast();

  const [subject, setSubject] = useState<string>("Hardware Compatibility Inquiry");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Sync user info into form defaults when modal opens
  useEffect(() => {
    if (opened) {
      setFullName(profile?.name || authUser?.displayName || "");
      setEmail(profile?.email || authUser?.email || "");
      setSubject("Hardware Compatibility Inquiry");
      setMessage("");
      setError("");
    }
  }, [opened, authUser, profile]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!message.trim() || message.trim().length < 10) {
      setError("Please describe your inquiry in at least 10 characters.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const idToken = await authUser?.getIdToken();
      const payload: ContactSubmissionInput = {
        fullName: fullName.trim(),
        email: email.trim(),
        subject: subject as (typeof contactSubjects)[number],
        message: message.trim(),
        companyWebsite: "",
      };

      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const result = (await response.json()) as {
        success?: boolean;
        inquiryId?: string;
        error?: string;
      };

      if (!response.ok || !result.success) {
        throw new Error(
          result.error || "We could not submit your inquiry. Please try again."
        );
      }

      toast({
        title: "Inquiry submitted",
        description:
          "Your support request has been created. Our team will respond shortly.",
      });

      onClose();
      if (result.inquiryId && onInquiryCreated) {
        onInquiryCreated(result.inquiryId);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "An unexpected error occurred while submitting."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <MessageSquarePlus className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
          <Text fw={700} size="md" className="font-headline">
            New Support Inquiry
          </Text>
        </Group>
      }
      centered
      radius="lg"
      size="lg"
      classNames={{
        header:
          "p-4 border-b border-slate-200 dark:border-white/10 bg-white dark:bg-[#111722]",
        body: "!p-4 !pt-4 bg-white dark:bg-[#111722]",
      }}
    >
      <form onSubmit={handleSubmit}>
        <Stack gap="md" className="pt-2">
          {error && (
            <Alert color="red" variant="light" title="Submission error">
              {error}
            </Alert>
          )}

          <Select
            label="Inquiry Topic"
            description="Choose the category that best describes your request."
            data={contactSubjects.map((s) => ({ value: s, label: s }))}
            value={subject}
            onChange={(val) => setSubject(val || "Hardware Compatibility Inquiry")}
            required
            allowDeselect={false}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <TextInput
              label="Your Name"
              placeholder="e.g. John Doe"
              value={fullName}
              onChange={(e) => setFullName(e.currentTarget.value)}
              required
            />
            <TextInput
              label="Email Address"
              placeholder="e.g. you@example.com"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.currentTarget.value)}
              required
            />
          </div>

          <Textarea
            label="Your Message"
            description="Explain your request, question, or issue in detail."
            placeholder="Write your inquiry here (minimum 10 characters)..."
            value={message}
            onChange={(e) => setMessage(e.currentTarget.value)}
            minRows={4}
            maxRows={8}
            required
          />

          <Group justify="flex-end" gap="sm" mt="sm">
            <Button variant="subtle" color="gray" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              color="cyan"
              loading={submitting}
              leftSection={<Send size={15} />}
            >
              Submit Inquiry
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
