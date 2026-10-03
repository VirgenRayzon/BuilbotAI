"use client";

import React, { useState, useMemo } from "react";
import {
  Paper,
  Title,
  Text,
  Group,
  Stack,
  Badge,
  Button,
  ActionIcon,
  TextInput,
  ThemeIcon,
  Tooltip,
} from "@mantine/core";
import {
  Heart,
  Trash2,
  ChevronRight,
  CreditCard,
  Pencil,
  Check,
  X,
  Bot,
  Wrench,
  AlertTriangle,
  Play,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { FavoriteBuild } from "@/lib/types";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useCollection, useFirestore } from "@/firebase";
import { collection } from "firebase/firestore";
import Link from "next/link";

interface FavoritesListProps {
  favorites: FavoriteBuild[];
  loading: boolean;
  onDelete: (id: string) => void;
  onRename: (id: string, newName: string) => void;
}

export function FavoritesList({ favorites, loading, onDelete, onRename }: FavoritesListProps) {
  const router = useRouter();
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  // Fetch live inventory to validate stock
  const firestore = useFirestore();
  const inventoryCategories = [
    "CPU",
    "GPU",
    "Motherboard",
    "RAM",
    "Storage",
    "PSU",
    "Case",
    "Cooler",
    "Monitor",
    "Keyboard",
    "Mouse",
    "Headset",
  ];

  const collectionRefs = useMemo(() => {
    if (!firestore) return [];
    return inventoryCategories.map((cat) => collection(firestore, cat));
  }, [firestore]);

  const inventoryResults = collectionRefs.map((ref) => useCollection<any>(ref));
  const allParts = useMemo(() => {
    return inventoryResults.flatMap((result, idx) => {
      const data = result.data || [];
      return data.map((part: any) => ({
        ...part,
        category: inventoryCategories[idx],
      }));
    });
  }, [inventoryResults]);

  const getPartStatus = (partId: string) => {
    const livePart = allParts.find((p) => p.id === partId);
    if (!livePart) return "missing";
    if (livePart.stock <= 0 || livePart.isArchived) return "out_of_stock";
    return "available";
  };

  const getLivePrice = (partId: string, fallbackPrice: number) => {
    const livePart = allParts.find((p) => p.id === partId);
    return livePart?.price ?? fallbackPrice;
  };

  const handleLoadInBuilder = (favorite: FavoriteBuild) => {
    localStorage.setItem("pc_builder_load_favorite", JSON.stringify(favorite));
    router.push("/builder");
  };

  const handleStartRename = (fav: FavoriteBuild) => {
    setEditingId(fav.id);
    setEditName(fav.name);
  };

  const handleConfirmRename = () => {
    if (editingId && editName.trim()) {
      onRename(editingId, editName.trim());
    }
    setEditingId(null);
    setEditName("");
  };

  if (loading) return null;

  if (favorites.length === 0) {
    return (
      <Paper
        withBorder
        radius="lg"
        p="xl"
        className="bg-white dark:bg-[#111722] border-dashed border-slate-300 dark:border-white/10 text-center py-16"
      >
        <Stack align="center" gap="md" className="max-w-md mx-auto">
          <ThemeIcon size={64} radius="xl" color="pink" variant="light">
            <Heart size={32} />
          </ThemeIcon>
          <div className="space-y-1">
            <Title order={3} className="text-xl font-bold font-headline text-slate-900 dark:text-white">
              No Saved Rig Configurations
            </Title>
            <Text size="sm" className="text-slate-600 dark:text-slate-400">
              Save your favorite PC builds from the custom Builder or AI Advisor for instant retrieval and 1-click loading.
            </Text>
          </div>
          <Button
            component={Link}
            href="/builder"
            color="cyan"
            size="md"
            radius="md"
            rightSection={<ChevronRight size={16} />}
            className="font-bold uppercase tracking-wider text-xs shadow-lg shadow-cyan-500/20"
          >
            Start Designing Rig
          </Button>
        </Stack>
      </Paper>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-5">
        {favorites.map((favorite) => {
          const liveTotal = favorite.parts.reduce(
            (sum, p) => sum + getLivePrice(p.partId, p.price),
            0
          );
          const hasIssues = favorite.parts.some(
            (p) => getPartStatus(p.partId) !== "available"
          );

          return (
            <Paper
              key={favorite.id}
              withBorder
              radius="lg"
              p="lg"
              className="bg-white dark:bg-[#121824] border-slate-200 dark:border-white/10 shadow-sm hover:shadow-md transition-all duration-200"
            >
              <Stack gap="md">
                {/* Header: Rig title, origin badge, and actions */}
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-4 border-b border-slate-200 dark:border-white/10">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <Heart size={18} className="text-rose-500 fill-rose-500 shrink-0" />

                      {editingId === favorite.id ? (
                        <Group gap="xs">
                          <TextInput
                            value={editName}
                            onChange={(e) => setEditName(e.currentTarget.value)}
                            size="xs"
                            className="w-48"
                            onKeyDown={(e) => e.key === "Enter" && handleConfirmRename()}
                            autoFocus
                          />
                          <ActionIcon size="sm" color="teal" variant="light" onClick={handleConfirmRename}>
                            <Check size={14} />
                          </ActionIcon>
                          <ActionIcon size="sm" color="gray" variant="light" onClick={() => setEditingId(null)}>
                            <X size={14} />
                          </ActionIcon>
                        </Group>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Text className="text-lg font-bold font-headline text-slate-900 dark:text-white tracking-tight">
                            {favorite.name}
                          </Text>
                          <Tooltip label="Rename build" withArrow>
                            <ActionIcon
                              size="xs"
                              variant="subtle"
                              color="gray"
                              onClick={() => handleStartRename(favorite)}
                            >
                              <Pencil size={13} className="text-slate-500 dark:text-slate-400" />
                            </ActionIcon>
                          </Tooltip>
                        </div>
                      )}

                      <Badge
                        color={favorite.source === "advisor" ? "teal" : "cyan"}
                        variant="filled"
                        size="sm"
                        leftSection={favorite.source === "advisor" ? <Bot size={12} /> : <Wrench size={12} />}
                        className="font-bold uppercase tracking-wider text-[10px]"
                      >
                        {favorite.source === "advisor" ? "AI Advisor" : "Custom Rig"}
                      </Badge>

                      {hasIssues && (
                        <Badge
                          color="orange"
                          variant="filled"
                          size="sm"
                          leftSection={<AlertTriangle size={12} />}
                          className="font-bold uppercase tracking-wider text-[10px]"
                        >
                          Stock Notice
                        </Badge>
                      )}
                    </div>

                    <Text size="xs" className="text-slate-600 dark:text-slate-400 font-medium">
                      {favorite.parts.length} components • Saved{" "}
                      {favorite.createdAt?.toDate
                        ? favorite.createdAt.toDate().toLocaleDateString(undefined, { dateStyle: "medium" })
                        : "Recently"}
                    </Text>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4">
                    {/* Live price display */}
                    <div className="text-left sm:text-right pr-4 sm:border-r border-slate-200 dark:border-white/10">
                      <Text size="xs" fw={700} className="uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Live Rig Price
                      </Text>
                      <Text className="text-xl font-headline font-bold text-cyan-600 dark:text-cyan-400">
                        {formatCurrency(liveTotal)}
                      </Text>
                    </div>

                    <Group gap="xs">
                      <Button
                        size="xs"
                        color="cyan"
                        radius="md"
                        leftSection={<Play size={13} />}
                        onClick={() => handleLoadInBuilder(favorite)}
                        className="font-bold uppercase tracking-wider text-[11px] shadow-sm"
                      >
                        Load Build
                      </Button>

                      <Tooltip label="Delete favorite" withArrow>
                        <ActionIcon
                          size="md"
                          color="red"
                          variant="subtle"
                          radius="md"
                          onClick={() => setDeleteTarget(favorite.id)}
                          aria-label="Delete favorite build"
                        >
                          <Trash2 size={16} />
                        </ActionIcon>
                      </Tooltip>
                    </Group>
                  </div>
                </div>

                {/* Parts Breakdown List */}
                <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-black/20 overflow-hidden">
                  <div className="max-h-[190px] overflow-y-auto divide-y divide-slate-200 dark:divide-white/5">
                    {favorite.parts.map((part, idx) => {
                      const status = getPartStatus(part.partId);
                      const livePrice = getLivePrice(part.partId, part.price);

                      return (
                        <div
                          key={`${favorite.id}-part-${idx}`}
                          className={`p-3 px-4 flex justify-between items-center text-sm hover:bg-slate-100/60 dark:hover:bg-white/[0.02] transition-colors ${
                            status === "missing" ? "opacity-50 line-through" : ""
                          } ${status === "out_of_stock" ? "opacity-75" : ""}`}
                        >
                          <div className="flex items-center gap-3">
                            <ThemeIcon
                              size="sm"
                              radius="md"
                              color={status === "available" ? "gray" : status === "out_of_stock" ? "orange" : "red"}
                              variant="light"
                            >
                              {status === "missing" ? (
                                <X size={14} />
                              ) : status === "out_of_stock" ? (
                                <AlertTriangle size={14} />
                              ) : (
                                <CreditCard size={14} />
                              )}
                            </ThemeIcon>

                            <div className="flex flex-col">
                              <span className="text-[10px] font-bold text-cyan-700 dark:text-cyan-400 uppercase tracking-wider">
                                {part.category}
                              </span>
                              <span className="font-semibold text-slate-900 dark:text-slate-100 truncate max-w-[200px] sm:max-w-md">
                                {part.name}
                              </span>
                              {status === "missing" && (
                                <span className="text-[10px] text-red-600 dark:text-red-400 font-bold">
                                  Discontinued / Missing
                                </span>
                              )}
                              {status === "out_of_stock" && (
                                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">
                                  Currently Out of Stock
                                </span>
                              )}
                            </div>
                          </div>

                          <span className="font-mono font-bold text-xs text-slate-800 dark:text-slate-200">
                            {formatCurrency(livePrice)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Stack>
            </Paper>
          );
        })}
      </div>

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 rounded-2xl shadow-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold font-headline uppercase text-slate-900 dark:text-white">
              Remove Saved Rig?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600 dark:text-slate-300">
              This will permanently remove this build configuration from your saved favorites list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 font-semibold text-slate-700 dark:text-slate-300">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteTarget) onDelete(deleteTarget);
                setDeleteTarget(null);
              }}
              className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold"
            >
              Delete Build
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
