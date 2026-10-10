"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Card,
  Text,
  Badge,
  Button,
  Group,
  Stack,
  Box,
  Collapse,
  ActionIcon,
  Paper,
} from "@mantine/core";
import { formatCurrency, getOptimizedStorageUrl, cn } from "@/lib/utils";
import type { PrebuiltSystem, Part } from "@/lib/types";
import {
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getMissingParts } from "@/lib/prebuilt-utils";
import { PrebuiltCardSpecs } from "./prebuilt-card-specs";
import { OptimizedImage } from "./ui/optimized-image";
import { useFirestore } from "@/firebase";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { reservePrebuiltSystem } from "@/app/prebuilt-reservation-actions";
import { useUserProfile } from "@/context/user-profile";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useSiteSettings } from "@/context/site-settings-context";

interface PrebuiltSystemCardProps {
  system: PrebuiltSystem;
  expanded?: boolean;
  onToggle?: () => void;
}

export function PrebuiltSystemCard({
  system,
  expanded = false,
  onToggle,
}: PrebuiltSystemCardProps) {
  const { shouldCorruptImages } = useSiteSettings();
  const [isExpandedLocal, setIsExpandedLocal] = useState(false);
  const isExpanded = expanded || isExpandedLocal;
  const { toast } = useToast();

  const missingParts = getMissingParts(system);
  const isComplete = missingParts.length === 0;

  const [partsStock, setPartsStock] = useState<Record<string, number>>({});
  const [resolvedParts, setResolvedParts] = useState<Record<string, Part>>({});
  const [loadingStock, setLoadingStock] = useState(isComplete);
  const [isReserving, setIsReserving] = useState(false);
  const [isCheckoutDialogOpen, setIsCheckoutDialogOpen] = useState(false);
  const firestore = useFirestore();
  const { authUser, profile } = useUserProfile();
  const router = useRouter();

  useEffect(() => {
    if (!firestore || !isComplete) {
      setLoadingStock(false);
      return;
    }

    const fetchStock = async () => {
      const stockMap: Record<string, number> = {};
      const partsMap: Record<string, Part> = {};
      try {
        const promises = Object.entries(system.components).map(async ([category, id]) => {
          const collectionMap: Record<string, string> = {
            cpu: "CPU",
            gpu: "GPU",
            motherboard: "Motherboard",
            ram: "RAM",
            storage: "Storage",
            psu: "PSU",
            case: "Case",
            cooler: "Cooler",
          };
          const collectionName = collectionMap[category] || category;
          const partId = Array.isArray(id) ? id[0] : id;

          if (!partId) return;

          const partRef = doc(firestore, collectionName, partId as string);
          const snap = await getDoc(partRef);
          if (snap.exists()) {
            const partData = { id: snap.id, ...snap.data() } as Part;
            stockMap[category] = partData.stock || 0;
            partsMap[category] = partData;
          } else {
            const q = query(collection(firestore, collectionName), where("name", "==", partId));
            const querySnap = await getDocs(q);
            if (!querySnap.empty) {
              const partData = { id: querySnap.docs[0].id, ...querySnap.docs[0].data() } as Part;
              stockMap[category] = partData.stock || 0;
              partsMap[category] = partData;
            }
          }
        });
        await Promise.all(promises);
        setPartsStock(stockMap);
        setResolvedParts(partsMap);
      } catch (e) {
        console.error("Stock check failed:", e);
      } finally {
        setLoadingStock(false);
      }
    };

    fetchStock();
  }, [firestore, system.components, isComplete]);

  const isInStock =
    isComplete &&
    Object.keys(partsStock).length > 0 &&
    Object.values(partsStock).every((stock) => stock > 0);

  const openCheckoutDialog = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isComplete || !authUser || !profile || isReserving || !isInStock) {
      if (!authUser) {
        toast({
          title: "Sign In Required",
          description: "Please sign in to reserve a prebuilt rig.",
          variant: "destructive",
        });
      }
      return;
    }
    setIsCheckoutDialogOpen(true);
  };

  const handleReserve = async () => {
    if (!authUser || !profile) return;
    setIsReserving(true);
    try {
      const componentsMap: Record<string, { id: string; name: string; price: number; category: string }> = {};
      Object.entries(resolvedParts).forEach(([category, part]) => {
        if (part) {
          componentsMap[category] = {
            id: part.id,
            name: part.name,
            price: part.price,
            category: category,
          };
        }
      });

      const result = await reservePrebuiltSystem(
        authUser.uid,
        profile.email,
        profile.name || profile.email.split("@")[0],
        {
          id: system.id,
          name: system.name,
          price: system.price,
        },
        componentsMap
      );

      if (result.success) {
        toast({
          title: "Reservation Successful",
          description: `Your reservation for ${system.name} has been recorded.`,
        });
        router.push("/profile");
      } else {
        toast({
          title: "Reservation Failed",
          description: result.error || "An error occurred during reservation.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Reservation error:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsReserving(false);
    }
  };

  const toggleExpand = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onToggle) {
      onToggle();
    } else {
      setIsExpandedLocal(!isExpandedLocal);
    }
  };

  return (
    <Link href={`/pre-builts/${system.id}`} className="block h-full">
      <Card
        withBorder
        radius="lg"
        padding={0}
        className={cn(
          "flex flex-col justify-between h-full relative group cursor-pointer overflow-hidden transition-all duration-300",
          "bg-white/80 dark:bg-[#141a23]/90 hover:shadow-md hover:-translate-y-1",
          "border-slate-200/80 dark:border-white/10 hover:border-cyan-500/40 dark:hover:border-cyan-500/40",
          (!isComplete || (!loadingStock && !isInStock)) && "opacity-75 grayscale-[0.5]"
        )}
      >
        {/* Top Content Area */}
        <Stack gap={0}>
          {/* Tier & Stock Status Badges */}
          <Group justify="space-between" align="center" wrap="nowrap" className="px-3 pt-3 pb-2">
            <Badge
              size="xs"
              variant="light"
              color={
                system.tier === "High-End" || system.tier === "Workstation"
                  ? "cyan"
                  : system.tier === "Mid-Range"
                  ? "blue"
                  : "gray"
              }
              radius="sm"
              className="font-medium uppercase tracking-wide"
            >
              {system.tier || "System"}
            </Badge>

            {loadingStock ? (
              <Badge size="xs" variant="light" color="gray" radius="sm">
                Checking stock...
              </Badge>
            ) : !isComplete ? (
              <Badge size="xs" variant="light" color="orange" radius="sm">
                Incomplete
              </Badge>
            ) : isInStock ? (
              <Badge size="xs" variant="light" color="teal" radius="sm">
                In Stock
              </Badge>
            ) : (
              <Badge size="xs" variant="light" color="red" radius="sm">
                Out of Stock
              </Badge>
            )}
          </Group>

          {/* Clean Rounded Image Canvas */}
          <Box
            className={cn(
              "aspect-[4/3] relative w-full overflow-hidden",
              "bg-white border-y border-slate-200/70 dark:border-white/10"
            )}
          >
            <OptimizedImage
              src={getOptimizedStorageUrl(system.imageUrl, shouldCorruptImages) || "/placeholder-system.png"}
              alt={system.name}
              fill
              unoptimized
              sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
              className="object-contain p-2"
            />
          </Box>

          {/* Title & Description */}
          <Stack gap={4} className="px-3 pt-3">
            <Text
              size="md"
              fw={700}
              lineClamp={2}
              className="leading-snug transition-colors group-hover:text-cyan-600 dark:group-hover:text-cyan-400 min-h-[2.5rem]"
              title={system.name}
            >
              {system.name}
            </Text>
            <Text size="xs" c="dimmed" lineClamp={2} className="min-h-[2rem] leading-relaxed">
              {system.description}
            </Text>
          </Stack>

          {/* Collapsible Component Breakdown */}
          <div className="px-3">
            <Collapse in={isExpanded}>
              <Paper
                withBorder
                radius="md"
                p="xs"
                mt="xs"
                className="bg-slate-50/70 dark:bg-white/[0.02] border-slate-200/60 dark:border-white/5"
              >
                <Text size="xs" fw={700} c="dimmed" tt="uppercase" className="tracking-wider mb-1.5 text-[10px]">
                  Component Breakdown
                </Text>
                <PrebuiltCardSpecs components={system.components} expanded={true} />
              </Paper>
            </Collapse>
          </div>
        </Stack>

        {/* Bottom Price & Inset Action Area */}
        <Stack gap="xs" className="px-3 pt-3 pb-3">
          {/* Price & Expand Chevron */}
          <Group justify="space-between" align="center">
            <Stack gap={0}>
              <Text size="xs" c="dimmed" tt="uppercase" fw={600} className="tracking-wider text-[10px]">
                Total Price
              </Text>
              <Text size="lg" fw={700} className="text-slate-900 dark:text-slate-100 font-mono leading-none">
                {formatCurrency(system.price)}
              </Text>
            </Stack>

            <ActionIcon
              variant="subtle"
              color="gray"
              size="sm"
              radius="md"
              onClick={toggleExpand}
              title={isExpanded ? "Hide Specs" : "Show Specs"}
            >
              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </ActionIcon>
          </Group>

          {/* Inset Rounded Action Button */}
          {!isComplete ? (
            <Button
              fullWidth
              radius="md"
              size="sm"
              variant="light"
              color="orange"
              disabled
              leftSection={<AlertCircle className="h-4 w-4" />}
            >
              Incomplete System
            </Button>
          ) : !loadingStock && !isInStock ? (
            <Button
              fullWidth
              radius="md"
              size="sm"
              variant="light"
              color="red"
              disabled
              leftSection={<AlertCircle className="h-4 w-4" />}
            >
              Out of Stock
            </Button>
          ) : (
            <Button
              fullWidth
              radius="md"
              size="sm"
              variant="light"
              color="cyan"
              onClick={openCheckoutDialog}
              disabled={loadingStock || isReserving}
              leftSection={
                isReserving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ShieldCheck className="h-4 w-4 transition-transform group-hover:-translate-y-0.5" />
                )
              }
              className="font-medium hover:bg-cyan-500 hover:text-white transition-all duration-200"
            >
              {isReserving ? "Processing..." : "Reserve Rig"}
            </Button>
          )}
        </Stack>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={isCheckoutDialogOpen} onOpenChange={setIsCheckoutDialogOpen}>
        <DialogContent className="max-w-md" onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-teal-600" />
              Confirm Reservation
            </DialogTitle>
            <DialogDescription>
              Review the components for <span className="text-teal-600 dark:text-teal-400 font-semibold">{system.name}</span> before reserving this build.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <ScrollArea className="max-h-[30vh]">
              <div className="space-y-2">
                {Object.entries(resolvedParts).map(([category, part]) =>
                  part ? (
                    <div key={category} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        <span className="capitalize mr-1">
                          {category === "cpu" || category === "gpu" || category === "psu" || category === "ram"
                            ? category.toUpperCase()
                            : category}
                          :
                        </span>
                        {part.name}
                      </span>
                      <span className="font-medium">{formatCurrency(part.price || 0)}</span>
                    </div>
                  ) : null
                )}
              </div>
            </ScrollArea>
            <Separator />
            <div className="flex justify-between items-center font-bold text-lg">
              <span>Total Price</span>
              <span className="text-cyan-600 dark:text-cyan-400 font-mono">{formatCurrency(system.price)}</span>
            </div>
            <div className="bg-slate-100 dark:bg-white/5 p-3 rounded-lg text-xs text-muted-foreground flex gap-2">
              <CheckCircle2 className="h-4 w-4 text-teal-500 shrink-0" />
              By confirming, your reservation will be processed and stock will be held for you.
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={(e) => {
                e.stopPropagation();
                setIsCheckoutDialogOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-teal-600 hover:bg-teal-700 text-white"
              onClick={(e) => {
                e.stopPropagation();
                handleReserve();
              }}
              disabled={isReserving}
            >
              {isReserving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Confirm Reservation
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Link>
  );
}
