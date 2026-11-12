"use client";

import React from "react";
import Link from "next/link";
import {
  Badge,
  Button,
  Checkbox,
  Group,
  Select,
  SimpleGrid,
  Text,
  Textarea,
  TextInput,
} from "@mantine/core";
import { ArrowRight, BookMarked, CheckCircle2, MapPin, Plus } from "lucide-react";
import type { ShippingAddress } from "@/context/ecommerce-context";
import type { SavedAddress } from "@/lib/types";
import { cn } from "@/lib/utils";
import { PH_REGIONS } from "../checkout-constants";

interface CheckoutAddressSectionProps {
  isStorePickup: boolean;
  address: ShippingAddress;
  onChangeAddress: (next: ShippingAddress) => void;
  savedAddresses: SavedAddress[];
  selectedAddressId: string | "custom";
  onSelectSavedAddress: (saved: SavedAddress) => void;
  onSelectCustomAddress: () => void;
  onCancelCustomAddress: () => void;
  saveAddressToBook: boolean;
  onToggleSaveAddressToBook: (checked: boolean) => void;
}

export function CheckoutAddressSection({
  isStorePickup,
  address,
  onChangeAddress,
  savedAddresses,
  selectedAddressId,
  onSelectSavedAddress,
  onSelectCustomAddress,
  onCancelCustomAddress,
  saveAddressToBook,
  onToggleSaveAddressToBook,
}: CheckoutAddressSectionProps) {
  const updateField = <K extends keyof ShippingAddress>(
    key: K,
    value: ShippingAddress[K]
  ) => onChangeAddress({ ...address, [key]: value });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <Group gap={6}>
          <MapPin size={15} className="text-cyan-500" />
          <Text size="xs" fw={700} tt="uppercase" c="dimmed">
            {isStorePickup ? "2. Pickup Contact" : "2. Delivery Address"}
          </Text>
        </Group>

        {!isStorePickup && (
          <Link
            href="/profile?tab=address-book"
            className="text-xs text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1 font-semibold whitespace-nowrap"
          >
            <BookMarked size={13} />
            <span>Manage Address Book</span>
            <ArrowRight size={11} />
          </Link>
        )}
      </div>

      {!isStorePickup && savedAddresses.length > 0 && (
        <div className="space-y-2.5">
          {savedAddresses.map((item) => {
            const isSelected = selectedAddressId === item.id;
            return (
              <div
                key={item.id}
                role="button"
                tabIndex={0}
                onClick={() => onSelectSavedAddress(item)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelectSavedAddress(item);
                  }
                }}
                className={cn(
                  "w-full p-3.5 min-h-[44px] rounded-xl border text-left cursor-pointer transition-all",
                  isSelected
                    ? "bg-cyan-500/10 border-cyan-500 ring-1 ring-cyan-500 shadow-sm"
                    : "bg-slate-50/60 dark:bg-white/[0.03] border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20"
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Badge
                      size="xs"
                      variant={isSelected ? "filled" : "light"}
                      color={isSelected ? "cyan" : "gray"}
                      className="font-bold uppercase tracking-wider text-[10px]"
                    >
                      {item.label}
                    </Badge>
                    {item.isDefault && (
                      <Badge size="xs" variant="outline" color="cyan" className="text-[9px]">
                        Default
                      </Badge>
                    )}
                  </div>
                  {isSelected && (
                    <CheckCircle2 size={16} className="text-cyan-500 shrink-0" />
                  )}
                </div>
                <Text
                  size="xs"
                  fw={700}
                  className="line-clamp-1 text-slate-900 dark:text-slate-100"
                >
                  {item.fullName} · {item.phone}
                </Text>
                <Text size="xs" c="dimmed" className="mt-0.5 leading-snug">
                  {item.streetAddress}, {item.barangay}, {item.city}, {item.region}{" "}
                  {item.postalCode}
                </Text>
              </div>
            );
          })}

          {selectedAddressId !== "custom" && (
            <Button
              variant="light"
              color="cyan"
              size="sm"
              radius="md"
              leftSection={<Plus size={14} />}
              onClick={onSelectCustomAddress}
              className="h-11"
            >
              Use New Address
            </Button>
          )}
        </div>
      )}

      {isStorePickup ? (
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
          <TextInput
            label="Recipient Full Name"
            size="sm"
            radius="md"
            value={address.fullName}
            onChange={(e) => updateField("fullName", e.currentTarget.value)}
            required
          />
          <TextInput
            label="Mobile Number (PH)"
            size="sm"
            radius="md"
            placeholder="+63 9XX XXX XXXX"
            value={address.phone}
            onChange={(e) => updateField("phone", e.currentTarget.value)}
            required
          />
        </SimpleGrid>
      ) : (
        (savedAddresses.length === 0 || selectedAddressId === "custom") && (
          <div className="space-y-4 pt-2 border-t border-slate-200/80 dark:border-white/10">
            {savedAddresses.length > 0 && (
              <div className="flex items-center justify-between">
                <Text
                  size="xs"
                  fw={700}
                  className="text-slate-800 dark:text-slate-200 uppercase tracking-wider"
                >
                  New Delivery Address
                </Text>
                <Button
                  variant="subtle"
                  color="gray"
                  size="compact-xs"
                  onClick={onCancelCustomAddress}
                  className="text-xs"
                >
                  Use Saved Address
                </Button>
              </div>
            )}

            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
              <TextInput
                label="Recipient Full Name"
                size="sm"
                radius="md"
                placeholder="Juan Dela Cruz"
                value={address.fullName}
                onChange={(e) => updateField("fullName", e.currentTarget.value)}
                required
              />
              <TextInput
                label="Mobile Number (PH)"
                size="sm"
                radius="md"
                placeholder="+63 9XX XXX XXXX"
                value={address.phone}
                onChange={(e) => updateField("phone", e.currentTarget.value)}
                required
              />
            </SimpleGrid>

            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
              <Select
                label="Region / Province"
                size="sm"
                radius="md"
                data={PH_REGIONS}
                value={address.region}
                onChange={(val) => updateField("region", val || PH_REGIONS[0])}
              />
              <TextInput
                label="City / Municipality"
                size="sm"
                radius="md"
                placeholder="Quezon City"
                value={address.city}
                onChange={(e) => updateField("city", e.currentTarget.value)}
              />
            </SimpleGrid>

            <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="sm">
              <TextInput
                label="Barangay"
                size="sm"
                radius="md"
                className="sm:col-span-2"
                placeholder="Socorro, Cubao"
                value={address.barangay}
                onChange={(e) => updateField("barangay", e.currentTarget.value)}
              />
              <TextInput
                label="Postal Code"
                size="sm"
                radius="md"
                placeholder="1109"
                value={address.postalCode}
                onChange={(e) => updateField("postalCode", e.currentTarget.value)}
              />
            </SimpleGrid>

            <TextInput
              label="House/Unit No., Street Address"
              size="sm"
              radius="md"
              placeholder="35G Liberty Avenue, corner 9th Ave"
              value={address.streetAddress}
              onChange={(e) => updateField("streetAddress", e.currentTarget.value)}
            />

            <Textarea
              label="Delivery Rider Notes (Optional)"
              size="sm"
              radius="md"
              rows={2}
              placeholder="e.g. Near 9th Ave entrance, leave with lobby security."
              value={address.notes}
              onChange={(e) => updateField("notes", e.currentTarget.value)}
            />

            <Checkbox
              checked={saveAddressToBook}
              onChange={(e) => onToggleSaveAddressToBook(e.currentTarget.checked)}
              label={
                <Text size="xs" fw={600} className="text-slate-700 dark:text-slate-300">
                  Save this address for future checkouts
                </Text>
              }
              color="cyan"
              size="xs"
            />
          </div>
        )
      )}
    </div>
  );
}
