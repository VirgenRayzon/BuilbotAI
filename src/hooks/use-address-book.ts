"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useUserProfile } from "@/context/user-profile";
import { useFirestore } from "@/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import type { SavedAddress } from "@/lib/types";

const LOCAL_STORAGE_KEY = "buildbot_address_book_v1";

const DEFAULT_INITIAL_ADDRESS: SavedAddress = {
  id: "addr_default_netcodex",
  label: "Home",
  fullName: "Juan Dela Cruz",
  phone: "+63 917 882 4910",
  email: "customer@netcodex.ph",
  region: "Metro Manila (NCR)",
  city: "Quezon City",
  barangay: "Socorro, Cubao",
  streetAddress: "35G Liberty Avenue, corner 9th Ave",
  postalCode: "1109",
  notes: "Please call mobile number upon arrival. Keep PC box upright.",
  isDefault: true,
  createdAt: new Date().toISOString(),
};

export function useAddressBook() {
  const { authUser, profile } = useUserProfile();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Synchronize from Firestore Profile or LocalStorage
  useEffect(() => {
    // 1. If profile has addressBook, use it
    if (profile?.addressBook && Array.isArray(profile.addressBook) && profile.addressBook.length > 0) {
      setAddresses(profile.addressBook);
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(profile.addressBook));
      } catch {
        // ignore storage error
      }
      setLoading(false);
      return;
    }

    // 2. Otherwise try local storage
    let cached: SavedAddress[] | null = null;
    try {
      const item = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (item) {
        cached = JSON.parse(item);
      }
    } catch {
      // ignore
    }

    if (cached && Array.isArray(cached) && cached.length > 0) {
      setAddresses(cached);
      setLoading(false);
      return;
    }

    // 3. Fallback: generate default from profile fields if present, else standard Netcodex default
    const fallbackFromProfile: SavedAddress = {
      id: `addr_${Date.now()}`,
      label: "Home",
      fullName: profile?.name || authUser?.displayName || DEFAULT_INITIAL_ADDRESS.fullName,
      phone: DEFAULT_INITIAL_ADDRESS.phone,
      email: profile?.email || authUser?.email || DEFAULT_INITIAL_ADDRESS.email,
      region: profile?.state || DEFAULT_INITIAL_ADDRESS.region,
      city: profile?.city || DEFAULT_INITIAL_ADDRESS.city,
      barangay: DEFAULT_INITIAL_ADDRESS.barangay,
      streetAddress: profile?.address || DEFAULT_INITIAL_ADDRESS.streetAddress,
      postalCode: profile?.zip || DEFAULT_INITIAL_ADDRESS.postalCode,
      notes: DEFAULT_INITIAL_ADDRESS.notes,
      isDefault: true,
      createdAt: new Date().toISOString(),
    };

    setAddresses([fallbackFromProfile]);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify([fallbackFromProfile]));
    } catch {
      // ignore
    }
    setLoading(false);
  }, [profile, authUser]);

  // Persist address book updates to Firestore & LocalStorage
  const persistAddresses = useCallback(
    async (updated: SavedAddress[], toastMessage?: string) => {
      setAddresses(updated);
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }

      if (authUser && firestore) {
        setSaving(true);
        try {
          const userRef = doc(firestore, "users", authUser.uid);
          // Also sync default address to top-level profile fields for backward compatibility
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
      // If we deleted the default, make the first remaining address the default
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
