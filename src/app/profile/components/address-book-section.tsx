"use client";

import React, { useState } from "react";
import {
  Paper,
  Title,
  Text,
  Badge,
  Button,
  Group,
  Stack,
  ThemeIcon,
  Modal,
  TextInput,
  Textarea,
  Select,
  Checkbox,
  ActionIcon,
  Tooltip,
  Table,
  SimpleGrid,
} from "@mantine/core";
import {
  MapPin,
  Plus,
  Home,
  Building,
  CheckCircle2,
  Trash2,
  Edit2,
  Phone,
  Mail,
  FileText,
  Sparkles,
} from "lucide-react";
import { useAddressBook } from "@/hooks/use-address-book";
import type { SavedAddress } from "@/lib/types";
import { CompactInfo } from "@/components/ui/compact-info";
import { cn } from "@/lib/utils";

export const PH_REGIONS = [
  "Metro Manila (NCR)",
  "CALABARZON (Region IV-A)",
  "Central Luzon (Region III)",
  "Ilocos Region (Region I)",
  "Central Visayas (Cebu / Region VII)",
  "Western Visayas (Region VI)",
  "Davao Region (Region XI)",
  "Northern Mindanao (Region X)",
];

const PRESET_LABELS = ["Home", "Office", "Condo", "Warehouse"];

export function AddressBookSection() {
  const {
    addresses,
    loading,
    saving,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
  } = useAddressBook();

  const [modalOpened, setModalOpened] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [label, setLabel] = useState("Home");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("+63 ");
  const [email, setEmail] = useState("");
  const [region, setRegion] = useState(PH_REGIONS[0]);
  const [city, setCity] = useState("");
  const [barangay, setBarangay] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [notes, setNotes] = useState("");
  const [isDefault, setIsDefault] = useState(false);

  const resetForm = () => {
    setEditingId(null);
    setLabel("Home");
    setFullName("");
    setPhone("+63 9");
    setEmail("");
    setRegion(PH_REGIONS[0]);
    setCity("");
    setBarangay("");
    setStreetAddress("");
    setPostalCode("");
    setNotes("");
    setIsDefault(addresses.length === 0);
  };

  const handleOpenAdd = () => {
    resetForm();
    setModalOpened(true);
  };

  const handleOpenEdit = (addr: SavedAddress) => {
    setEditingId(addr.id);
    setLabel(addr.label);
    setFullName(addr.fullName);
    setPhone(addr.phone);
    setEmail(addr.email);
    setRegion(addr.region);
    setCity(addr.city);
    setBarangay(addr.barangay);
    setStreetAddress(addr.streetAddress);
    setPostalCode(addr.postalCode);
    setNotes(addr.notes || "");
    setIsDefault(Boolean(addr.isDefault));
    setModalOpened(true);
  };

  const handleSave = async () => {
    if (!fullName.trim() || !phone.trim() || !city.trim() || !streetAddress.trim()) {
      return;
    }

    const payload = {
      label: label.trim() || "Address",
      fullName: fullName.trim(),
      phone: phone.trim(),
      email: email.trim(),
      region,
      city: city.trim(),
      barangay: barangay.trim(),
      streetAddress: streetAddress.trim(),
      postalCode: postalCode.trim(),
      notes: notes.trim(),
      isDefault,
    };

    if (editingId) {
      await updateAddress(editingId, payload);
    } else {
      await addAddress(payload);
    }

    setModalOpened(false);
    resetForm();
  };

  return (
    <div className="space-y-6">
      <Paper
        withBorder
        radius="lg"
        p={12}
        className="bg-white dark:bg-[#111722] border-slate-200 dark:border-white/10 shadow-sm"
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <Title
              order={3}
              className="text-xl font-bold font-headline text-slate-900 dark:text-white flex items-center gap-2.5"
            >
              <MapPin className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
              <span>Address Book</span>
              <CompactInfo message="Manage your verified delivery locations. These addresses are seamlessly available at checkout for instant 1-click fulfillment." />
            </Title>
            <Text size="xs" c="dimmed" mt={2}>
              Save multiple home, office, or workshop addresses. Used automatically on the Checkout page.
            </Text>
          </div>

          <Group gap="xs">
            <Badge size="md" variant="light" color="cyan" className="font-mono font-bold">
              {addresses.length} {addresses.length === 1 ? "Address" : "Addresses"}
            </Badge>
            <Button
              size="xs"
              color="cyan"
              radius="md"
              leftSection={<Plus size={14} />}
              onClick={handleOpenAdd}
              className="font-bold uppercase tracking-wider text-xs shadow-sm shadow-cyan-500/20"
            >
              Add New Address
            </Button>
          </Group>
        </div>
      </Paper>

      {addresses.length === 0 && !loading ? (
        <Paper
          withBorder
          radius="lg"
          p="xl"
          className="bg-white dark:bg-[#111722] border-dashed border-slate-300 dark:border-white/10 text-center py-16"
        >
          <Stack align="center" gap="md" className="max-w-md mx-auto">
            <ThemeIcon size={64} radius="xl" color="cyan" variant="light">
              <MapPin size={32} />
            </ThemeIcon>
            <div className="space-y-1">
              <Title order={4} className="text-lg font-bold text-slate-900 dark:text-white">
                No Addresses Saved Yet
              </Title>
              <Text size="xs" c="dimmed">
                Save your home or delivery address now so you never have to re-enter it when checking out PC parts and custom rigs.
              </Text>
            </div>
            <Button
              color="cyan"
              size="sm"
              radius="md"
              leftSection={<Plus size={14} />}
              onClick={handleOpenAdd}
              className="font-bold uppercase tracking-wider text-xs"
            >
              Add First Address
            </Button>
          </Stack>
        </Paper>
      ) : (
        <Paper
          withBorder
          radius="lg"
          className="overflow-hidden bg-white/90 dark:bg-[#111722]/90 border-slate-200 dark:border-white/10 shadow-sm"
        >
          <Table.ScrollContainer minWidth={800}>
            <Table verticalSpacing="sm" horizontalSpacing="md" highlightOnHover className="bg-transparent">
              <Table.Thead className="bg-slate-50/80 dark:bg-white/[0.025] border-b border-slate-200 dark:border-white/10">
                <Table.Tr>
                  <Table.Th className="text-slate-900 dark:text-slate-100 font-bold text-xs uppercase tracking-wider py-3.5">
                    Full Name
                  </Table.Th>
                  <Table.Th className="text-slate-900 dark:text-slate-100 font-bold text-xs uppercase tracking-wider py-3.5">
                    Type
                  </Table.Th>
                  <Table.Th className="text-slate-900 dark:text-slate-100 font-bold text-xs uppercase tracking-wider py-3.5">
                    Address
                  </Table.Th>
                  <Table.Th className="text-slate-900 dark:text-slate-100 font-bold text-xs uppercase tracking-wider py-3.5">
                    Postcode
                  </Table.Th>
                  <Table.Th className="text-slate-900 dark:text-slate-100 font-bold text-xs uppercase tracking-wider py-3.5">
                    Phone Number
                  </Table.Th>
                  <Table.Th className="text-slate-900 dark:text-slate-100 font-bold text-xs uppercase tracking-wider py-3.5 text-right">
                    Actions
                  </Table.Th>
                </Table.Tr>
              </Table.Thead>

              <Table.Tbody>
                {addresses.map((addr) => {
                  const isHome = addr.label.toLowerCase().includes("home");
                  const isOffice =
                    addr.label.toLowerCase().includes("office") ||
                    addr.label.toLowerCase().includes("work");
                  const isCondo = addr.label.toLowerCase().includes("condo");

                  return (
                    <Table.Tr
                      key={addr.id}
                      className={cn(
                        "transition-colors",
                        addr.isDefault
                          ? "bg-cyan-500/[0.04] dark:bg-cyan-950/20"
                          : "hover:bg-slate-50 dark:hover:bg-white/[0.02]"
                      )}
                    >
                      <Table.Td className="py-3.5">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <Text fw={700} size="sm" className="text-slate-900 dark:text-white font-headline">
                              {addr.fullName}
                            </Text>
                            {addr.isDefault && (
                              <Badge
                                size="xs"
                                color="cyan"
                                variant="light"
                                leftSection={<CheckCircle2 size={10} />}
                                className="font-bold uppercase tracking-wider text-[9px]"
                              >
                                Default
                              </Badge>
                            )}
                          </div>
                          {addr.email && (
                            <Group gap={4} className="text-slate-500 dark:text-slate-400 text-xs">
                              <Mail size={11} className="shrink-0 opacity-70" />
                              <span className="truncate max-w-[190px]">{addr.email}</span>
                            </Group>
                          )}
                        </div>
                      </Table.Td>

                      <Table.Td className="py-3.5 whitespace-nowrap">
                        <Badge
                          size="sm"
                          radius="md"
                          variant="light"
                          color={isHome ? "cyan" : isOffice ? "indigo" : isCondo ? "teal" : "gray"}
                          leftSection={
                            isHome ? (
                              <Home size={12} />
                            ) : isOffice ? (
                              <Building size={12} />
                            ) : (
                              <MapPin size={12} />
                            )
                          }
                          className="font-bold uppercase tracking-wider text-[11px]"
                        >
                          {addr.label}
                        </Badge>
                      </Table.Td>

                      <Table.Td className="py-3.5 min-w-[240px] max-w-[340px]">
                        <div className="space-y-0.5 text-xs">
                          <Text fw={600} className="text-slate-900 dark:text-slate-100">
                            {addr.streetAddress}
                          </Text>
                          <Text c="dimmed">
                            {[addr.barangay, addr.city, addr.region].filter(Boolean).join(", ")}
                          </Text>
                        </div>
                      </Table.Td>

                      <Table.Td className="py-3.5 whitespace-nowrap">
                        <Badge
                          variant="outline"
                          color="gray"
                          size="sm"
                          className="font-mono font-bold text-xs"
                        >
                          {addr.postalCode || "—"}
                        </Badge>
                      </Table.Td>

                      <Table.Td className="py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-xs font-mono font-medium text-slate-700 dark:text-slate-300">
                          <Phone size={12} className="text-cyan-500 shrink-0" />
                          <span>{addr.phone}</span>
                        </div>
                      </Table.Td>

                      <Table.Td className="py-3.5 text-right whitespace-nowrap">
                        <Group gap={6} justify="flex-end" wrap="nowrap">
                          {!addr.isDefault && (
                            <Button
                              size="compact-xs"
                              variant="subtle"
                              color="cyan"
                              onClick={() => setDefaultAddress(addr.id)}
                              className="text-[11px] font-semibold"
                            >
                              Set Default
                            </Button>
                          )}
                          <Button
                            size="xs"
                            variant="light"
                            color="cyan"
                            radius="md"
                            leftSection={<Edit2 size={12} />}
                            onClick={() => handleOpenEdit(addr)}
                            className="text-xs font-bold uppercase tracking-wider shadow-xs"
                          >
                            Edit
                          </Button>
                          <Tooltip label="Delete Address" withArrow position="top">
                            <ActionIcon
                              size="md"
                              variant="subtle"
                              color="red"
                              radius="md"
                              onClick={() => deleteAddress(addr.id)}
                              disabled={addresses.length === 1}
                              aria-label="Delete address"
                            >
                              <Trash2 size={14} />
                            </ActionIcon>
                          </Tooltip>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  );
                })}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        </Paper>
      )}

      <Modal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        title={
          <Group gap="xs">
            <ThemeIcon color="cyan" variant="light" radius="md" size="md">
              <MapPin size={16} />
            </ThemeIcon>
            <Title order={4} className="text-base font-bold font-headline uppercase tracking-tight">
              {editingId ? "Edit Saved Address" : "Add New Delivery Address"}
            </Title>
          </Group>
        }
        centered
        radius="lg"
        size="lg"
        classNames={{
          content:
            "bg-white/95 dark:bg-[#141a23]/95 backdrop-blur-md border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-slate-100 shadow-xl rounded-xl",
          header: "bg-white/95 dark:bg-[#141a23]/95 border-b border-slate-200/80 dark:border-white/10 p-3",
          body: "!p-4",
          close:
            "text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors",
        }}
      >
        <Stack gap="sm">
          <div>
            <Text size="xs" fw={700} c="dimmed" tt="uppercase" className="tracking-wider mb-1.5">
              Address Label
            </Text>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {PRESET_LABELS.map((p) => (
                <Button
                  key={p}
                  size="compact-xs"
                  variant={label === p ? "filled" : "light"}
                  color="cyan"
                  radius="md"
                  onClick={() => setLabel(p)}
                  className="text-xs font-semibold"
                >
                  {p}
                </Button>
              ))}
            </div>
            <TextInput
              placeholder="e.g. Home, Office, Studio, QC Apartment"
              value={label}
              onChange={(e) => setLabel(e.currentTarget.value)}
              size="xs"
              radius="md"
            />
          </div>

          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
            <TextInput
              label="Recipient Full Name"
              placeholder="Juan Dela Cruz"
              value={fullName}
              onChange={(e) => setFullName(e.currentTarget.value)}
              size="xs"
              radius="md"
              required
            />
            <TextInput
              label="Mobile Number (PH)"
              placeholder="+63 9XX XXX XXXX"
              value={phone}
              onChange={(e) => setPhone(e.currentTarget.value)}
              size="xs"
              radius="md"
              required
            />
          </SimpleGrid>

          <TextInput
            label="Email Address (for courier updates)"
            placeholder="customer@domain.ph"
            value={email}
            onChange={(e) => setEmail(e.currentTarget.value)}
            size="xs"
            radius="md"
          />

          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
            <Select
              label="Region / Province"
              data={PH_REGIONS}
              value={region}
              onChange={(val) => setRegion(val || PH_REGIONS[0])}
              size="xs"
              radius="md"
              required
            />
            <TextInput
              label="City / Municipality"
              placeholder="Quezon City, Manila, Makati, etc."
              value={city}
              onChange={(e) => setCity(e.currentTarget.value)}
              size="xs"
              radius="md"
              required
            />
          </SimpleGrid>

          <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="sm">
            <TextInput
              label="Barangay"
              placeholder="Socorro, Cubao"
              value={barangay}
              onChange={(e) => setBarangay(e.currentTarget.value)}
              size="xs"
              radius="md"
              className="sm:col-span-2"
              required
            />
            <TextInput
              label="Postal Code"
              placeholder="1109"
              value={postalCode}
              onChange={(e) => setPostalCode(e.currentTarget.value)}
              size="xs"
              radius="md"
              required
            />
          </SimpleGrid>

          <TextInput
            label="House / Unit No., Building, Street Name"
            placeholder="35G Liberty Avenue, corner 9th Ave"
            value={streetAddress}
            onChange={(e) => setStreetAddress(e.currentTarget.value)}
            size="xs"
            radius="md"
            required
          />

          <Textarea
            label="Delivery Instructions / Rider Landmark (Optional)"
            placeholder="e.g. Near 9th Ave entrance, leave with lobby security. Keep box upright."
            value={notes}
            onChange={(e) => setNotes(e.currentTarget.value)}
            size="xs"
            radius="md"
            rows={2}
          />

          <Checkbox
            label="Set as default shipping address for checkout"
            checked={isDefault}
            onChange={(e) => setIsDefault(e.currentTarget.checked)}
            color="cyan"
            size="xs"
            className="pt-1"
          />

          <Group justify="flex-end" gap="xs" pt="sm">
            <Button
              variant="default"
              size="xs"
              radius="md"
              onClick={() => setModalOpened(false)}
            >
              Cancel
            </Button>
            <Button
              color="cyan"
              size="xs"
              radius="md"
              loading={saving}
              onClick={handleSave}
              className="font-bold uppercase tracking-wider text-xs"
            >
              {editingId ? "Save Changes" : "Add Address"}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </div>
  );
}
