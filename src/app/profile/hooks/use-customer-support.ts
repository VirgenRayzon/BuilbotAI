"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { collection, query, Timestamp, where } from "firebase/firestore";
import { useUserProfile } from "@/context/user-profile";
import { useFirestore } from "@/firebase";
import { useCollection } from "@/firebase/firestore/use-collection";
import type { ContactInquiry } from "@/lib/contact-types";

export function useCustomerSupport() {
  const firestore = useFirestore();
  const { authUser } = useUserProfile();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedId, setSelectedId] = useState(searchParams.get("inquiry") ?? "");

  useEffect(() => setSelectedId(searchParams.get("inquiry") ?? ""), [searchParams]);

  const inquiriesQuery = useMemo(() => {
    if (!firestore || !authUser) return null;
    return query(collection(firestore, "contactInquiries"), where("userId", "==", authUser.uid));
  }, [firestore, authUser]);

  const { data, loading, error } = useCollection<ContactInquiry>(inquiriesQuery);
  const inquiries = useMemo(() => [...(data ?? [])]
    .sort((a, b) => {
      const aTime = a.lastMessageAt instanceof Timestamp ? a.lastMessageAt.toMillis() : 0;
      const bTime = b.lastMessageAt instanceof Timestamp ? b.lastMessageAt.toMillis() : 0;
      return bTime - aTime || a.id.localeCompare(b.id);
    })
    .slice(0, 50), [data]);
  const selectedInquiry = inquiries.find((inquiry) => inquiry.id === selectedId) ?? null;

  const selectInquiry = (inquiryId: string) => {
    setSelectedId(inquiryId);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", "contact-inbox");
    if (inquiryId) {
      params.set("inquiry", inquiryId);
    } else {
      params.delete("inquiry");
    }
    router.replace(`/profile?${params.toString()}`, { scroll: false });
  };

  return { error, inquiries, loading, selectedId, selectedInquiry, selectInquiry };
}
