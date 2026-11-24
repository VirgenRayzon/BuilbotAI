"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useUserProfile } from "@/context/user-profile";
import { useFirestore } from "@/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import type { SavedAddress } from "@/lib/types";

const LEGACY_LOCAL_STORAGE_KEY = "buildbot_address_book_v1";

function getAddressStorageKey(uid?: string | null): string | null {
  return uid ? `${LEGACY_LOCAL_STORAGE_KEY}:${uid}` : null;
}

function isLegacyDefaultSeedAddress(entry: SavedAddress): boolean {
  return (
    entry.streetAddress === "35G Liberty Avenue, corner 9th Ave" &&
    entry.barangay === "Socorro, Cubao" &&
    entry.city === "Quezon City" &&
    entry.region === "Metro Manila (NCR)" &&
    entry.postalCode === "1109" &&
    entry.phone === "+63 917 882 4910" &&
    entry.notes === "Please call mobile number upon arrival. Keep PC box upright."
  );
}

export function useAddressBook() {
  const { authUser, profile, status } = useUserProfile();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    try {
      // Purge the legacy unscoped key so cached addresses never leak across accounts.
      localStorage.removeItem(LEGACY_LOCAL_STORAGE_KEY);
    } catch {
    }

    if (status === "loading") {
      setAddresses([]);
      setLoading(true);
      return;
    }

    const storageKey = getAddressStorageKey(authUser?.uid);
    if (!authUser?.uid || !storageKey) {
      setAddresses([]);
      setLoading(false);
      return;
    }

    if (Array.isArray(profile?.addressBook)) {
      setAddresses(profile.addressBook);
      try {
        if (profile.addressBook.length > 0) {
          localStorage.setItem(storageKey, JSON.stringify(profile.addressBook));
        } else {
          localStorage.removeItem(storageKey);
        }
      } catch {
      }
      setLoading(false);
      return;
    }

    let cached: SavedAddress[] | null = null;
    try {
      const item = localStorage.getItem(storageKey);
      if (item) {
        cached = JSON.parse(item);
      }
    } catch {
    }

    const cleanedCached = Array.isArray(cached)
      ? cached.filter((entry) => !isLegacyDefaultSeedAddress(entry))
      : [];

    if (cleanedCached.length > 0) {
      setAddresses(cleanedCached);
      if (Array.isArray(cached) && cleanedCached.length !== cached.length) {
        try {
          localStorage.setItem(storageKey, JSON.stringify(cleanedCached));
        } catch {
        }
      }
      setLoading(false);
      return;
    }

    try {
      localStorage.removeItem(storageKey);
    } catch {
    }
    setAddresses([]);
    setLoading(false);
  }, [profile, authUser, status]);

  const persistAddresses = useCallback(
    async (updated: SavedAddress[], toastMessage?: string) => {
      setAddresses(updated);
      const storageKey = getAddressStorageKey(authUser?.uid);
      if (storageKey) {
        try {
          localStorage.setItem(storageKey, JSON.stringify(updated));
        } catch {
        }
      }

      if (authUser && firestore) {
        setSaving(true);
        try {
          const userRef = doc(firestore, "users", authUser.uid);
          const def = updated.find((a) => a.isDefault) || updated[0];
          const payload: Record<string, any> = {
            addressBook: updated,
          };
          if (def) {
            payload.address = def.streetAddress;
            payload.city = def.city;
            payload.state = def.region;
            payload.zip = def.postalCode;
          }
          await updateDoc(userRef, payload);
          if (toastMessage) {
            toast({
              title: "Address Book Updated",
              description: toastMessage,
            });
          }
        } catch (err: any) {
          console.error("Failed to update address book in Firestore:", err);
          toast({
            title: "Sync Notice",
            description: "Saved locally. Could not sync with cloud database.",
            variant: "destructive",
          });
        } finally {
          setSaving(false);
        }
      } else if (toastMessage) {
        toast({
          title: "Address Saved",
          description: toastMessage,
        });
      }
    },
    [authUser, firestore, toast]
  );

  const addAddress = useCallback(
    async (newAddress: Omit<SavedAddress, "id" | "createdAt">): Promise<SavedAddress> => {
      const isFirst = addresses.length === 0;
      const created: SavedAddress = {
        ...newAddress,
        id: `addr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        isDefault: newAddress.isDefault ?? isFirst,
        createdAt: new Date().toISOString(),
      };

      let updatedList: SavedAddress[];
      if (created.isDefault) {
        updatedList = [created, ...addresses.map((a) => ({ ...a, isDefault: false }))];
      } else {
        updatedList = [...addresses, created];
      }

      await persistAddresses(updatedList, `Added "${created.label}" to your address book.`);
      return created;
    },
    [addresses, persistAddresses]
  );

  const updateAddress = useCallback(
    async (id: string, updates: Partial<SavedAddress>) => {
      const updatedList = addresses.map((a) => {
        if (a.id !== id) {
          return updates.isDefault ? { ...a, isDefault: false } : a;
        }
        return { ...a, ...updates };
      });

      await persistAddresses(updatedList, "Address details updated successfully.");
    },
    [addresses, persistAddresses]
  );

  const deleteAddress = useCallback(
    async (id: string) => {
      const target = addresses.find((a) => a.id === id);
      if (!target) return;

      let remaining = addresses.filter((a) => a.id !== id);
      if (target.isDefault && remaining.length > 0) {
        remaining[0] = { ...remaining[0], isDefault: true };
      }

      await persistAddresses(remaining, `Removed "${target.label}" from address book.`);
    },
    [addresses, persistAddresses]
  );

  const setDefaultAddress = useCallback(
    async (id: string) => {
      const updatedList = addresses.map((a) => ({
        ...a,
        isDefault: a.id === id,
      }));
      const target = updatedList.find((a) => a.id === id);
      await persistAddresses(
        updatedList,
        `"${target?.label || "Selected address"}" is now your default delivery address.`
      );
    },
    [addresses, persistAddresses]
  );

  const defaultAddress = useMemo(() => {
    return addresses.find((a) => a.isDefault) || addresses[0] || null;
  }, [addresses]);

  return {
    addresses,
    defaultAddress,
    loading,
    saving,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
  };
}
