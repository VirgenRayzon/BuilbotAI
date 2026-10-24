"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { collection, limit, orderBy, query } from "firebase/firestore";
import { useUserProfile } from "@/context/user-profile";
import { useFirestore } from "@/firebase";
import { useCollection } from "@/firebase/firestore/use-collection";
import { useToast } from "@/hooks/use-toast";
import { CONTACT_EMAIL_ENABLED } from "@/lib/contact-config";
import type { ContactInquiry } from "@/lib/contact-types";

export type ContactInboxFilter = "open" | "resolved" | "all";

export function useContactInbox() {
  const firestore = useFirestore();
  const { authUser, profile } = useUserProfile();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [filter, setFilter] = useState<ContactInboxFilter>("open");
  const [selectedId, setSelectedId] = useState(searchParams.get("inquiry") ?? "");
  const [updating, setUpdating] = useState(false);
  const [gmailBusy, setGmailBusy] = useState(false);
  const [error, setError] = useState("");

  const inquiriesQuery = useMemo(
    () => firestore ? query(collection(firestore, "contactInquiries"), orderBy("lastMessageAt", "desc"), limit(100)) : null,
    [firestore]
  );
  const { data: inquiries, loading } = useCollection<ContactInquiry>(inquiriesQuery);
  const selectedInquiry = inquiries?.find((inquiry) => inquiry.id === selectedId) ?? null;
  const visibleInquiries = (inquiries ?? []).filter((inquiry) => filter === "all" || inquiry.status === filter);

  useEffect(() => setSelectedId(searchParams.get("inquiry") ?? ""), [searchParams]);

  useEffect(() => {
    if (!CONTACT_EMAIL_ENABLED) return;
    const gmailStatus = searchParams.get("gmail");
    if (gmailStatus === "connected") toast({ title: "Gmail connected", description: "Customer email replies will sync into the inbox." });
    if (gmailStatus === "error") setError("Gmail authorization did not finish. Check the OAuth and Pub/Sub setup, then try again.");
  }, [searchParams, toast]);

  const getToken = useCallback(async () => {
    if (!authUser) throw new Error("Your staff session has expired. Please sign in again.");
    return authUser.getIdToken();
  }, [authUser]);

  const selectInquiry = async (inquiry: ContactInquiry) => {
    setSelectedId(inquiry.id);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", "contact-inbox");
    params.set("inquiry", inquiry.id);
    router.replace(`/profile?${params.toString()}`, { scroll: false });

    if (profile && !inquiry.readBy?.includes(profile.id)) {
      try {
        const token = await getToken();
        await fetch("/api/contact/read", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ inquiryId: inquiry.id }),
        });
      } catch (readError) {
        console.error("Could not mark inquiry as read:", readError);
      }
    }
  };

  const updateStatus = async () => {
    if (!selectedInquiry) return;
    setUpdating(true);
    setError("");
    try {
      const token = await getToken();
      const status = selectedInquiry.status === "open" ? "resolved" : "open";
      const response = await fetch("/api/contact/status", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ inquiryId: selectedInquiry.id, status }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error || "Status could not be updated.");
    } catch (statusError) {
      setError(statusError instanceof Error ? statusError.message : "Status could not be updated.");
    } finally {
      setUpdating(false);
    }
  };

  const runGmailAction = async (path: string) => {
    setGmailBusy(true);
    setError("");
    try {
      const token = await getToken();
      const response = await fetch(path, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
      const result = (await response.json()) as { authorizationUrl?: string; success?: boolean; error?: string };
      if (!response.ok) throw new Error(result.error || "Gmail setup could not be updated.");
      if (result.authorizationUrl) window.location.assign(result.authorizationUrl);
      else toast({ title: "Gmail watch renewed", description: "Incoming replies will continue syncing." });
    } catch (gmailError) {
      setError(gmailError instanceof Error ? gmailError.message : "Gmail setup could not be updated.");
    } finally {
      setGmailBusy(false);
    }
  };

  return { error, filter, gmailBusy, loading, profile, selectedId, selectedInquiry, updating, visibleInquiries, selectInquiry, setFilter, updateStatus, runGmailAction };
}
