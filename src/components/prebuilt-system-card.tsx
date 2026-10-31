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
  ActionIcon,
  Paper,
} from "@mantine/core";
import { formatCurrency, getOptimizedStorageUrl, cn } from "@/lib/utils";
import type { PrebuiltSystem, Part, FavoriteBuild } from "@/lib/types";
import {
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Loader2,
  CheckCircle2,
  SlidersHorizontal,
  ExternalLink,
  ShoppingCart,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getMissingParts } from "@/lib/prebuilt-utils";
import { inventoryItemPath, inventoryItemsPath } from "@/lib/inventory-paths";
import { INCLUDED_INTEGRATED_GPU_ID, createIntegratedGpuPart } from '@/lib/integrated-graphics';
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
import { useEcommerce, getEcommerceFallbackImage } from "@/context/ecommerce-context";

interface PrebuiltSystemCardProps {
  system: PrebuiltSystem;
  isAdminPreview?: boolean;
  priority?: boolean;
  expanded?: boolean;
  onToggle?: () => void;
  showReserveButton?: boolean;
  showLaunchButton?: boolean;
  isClickable?: boolean;
  showBadges?: boolean;
  className?: string;
}

export function PrebuiltSystemCard({
  system,
  isAdminPreview = false,
  priority = false,
  expanded,
  onToggle,
  showReserveButton = true,
  showLaunchButton = false,
  isClickable = true,
  showBadges = false,
  className,
}: PrebuiltSystemCardProps) {
  const detailHref = `/pre-builts/${system.productId || system.id}${isAdminPreview ? "?preview=admin" : ""}`;
  const { shouldCorruptImages, isEcommerceMode } = useSiteSettings();
  const { addToCart } = useEcommerce();
  const [isExpandedLocal, setIsExpandedLocal] = useState(false);
  const isExpanded = expanded !== undefined ? expanded : isExpandedLocal;
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

          try {
            if (category === 'gpu' && partId === INCLUDED_INTEGRATED_GPU_ID && system.components.cpu) {
              const cpuSnap = await getDoc(doc(firestore, inventoryItemPath('CPU', system.components.cpu)));
              const cpu = cpuSnap.exists() ? { id: cpuSnap.id, ...cpuSnap.data() } as Part : null;
              const included = cpu && !cpu.isArchived ? createIntegratedGpuPart(cpu) : null;
              if (included) {
                stockMap[category] = included.stock;
                partsMap[category] = included;
              }
              return;
            }
            // 1. Try canonical path: inventory/{category}/items/{partId}
            const canonicalRef = doc(firestore, inventoryItemPath(collectionName, partId as string));
            const canonicalSnap = await getDoc(canonicalRef);
            if (canonicalSnap.exists()) {
              const partData = { id: canonicalSnap.id, ...canonicalSnap.data() } as Part;
              stockMap[category] = partData.stock || 0;
              partsMap[category] = partData;
              return;
            }

            // 2. Try canonical query by name in inventory/{category}/items
            const canonicalQuery = query(
              collection(firestore, inventoryItemsPath(collectionName)),
              where("name", "==", partId)
            );
            const canonicalQuerySnap = await getDocs(canonicalQuery);
            if (!canonicalQuerySnap.empty) {
              const partData = { id: canonicalQuerySnap.docs[0].id, ...canonicalQuerySnap.docs[0].data() } as Part;
              stockMap[category] = partData.stock || 0;
              partsMap[category] = partData;
              return;
            }

            // 3. Fallback to legacy root collection: {collectionName}/{partId}
            const partRef = doc(firestore, collectionName, partId as string);
            const snap = await getDoc(partRef);
            if (snap.exists()) {
              const partData = { id: snap.id, ...snap.data() } as Part;
              stockMap[category] = partData.stock || 0;
              partsMap[category] = partData;
              return;
            }

            // 4. Fallback query by name in legacy collection
            const q = query(collection(firestore, collectionName), where("name", "==", partId));
            const querySnap = await getDocs(q);
            if (!querySnap.empty) {
              const partData = { id: querySnap.docs[0].id, ...querySnap.docs[0].data() } as Part;
              stockMap[category] = partData.stock || 0;
              partsMap[category] = partData;
              return;
            }
          } catch (err) {
            console.warn(`Could not resolve stock for ${category}:`, err);
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
  const needsCustomization = !isComplete || (!loadingStock && !isInStock);

  const openCheckoutDialog = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isEcommerceMode) {
      if (!isComplete || !isInStock) return;
      const componentsList = Object.entries(resolvedParts)
        .filter(([, part]) => Boolean(part))
        .map(([cat, part]) => ({
          category: cat.toUpperCase(),
          name: part.name,
          price: part.price || 0,
          imageUrl:
            part.imageUrl ||
            part.images?.[0] ||
            getEcommerceFallbackImage(cat, "part"),
        }));
      addToCart(
        {
          id: `prebuilt-${system.id}`,
          kind: "prebuilt",
          name: system.name,
          price: system.price,
          tier: system.tier,
          imageUrl:
            system.imageUrl ||
            system.images?.[0] ||
            getEcommerceFallbackImage(undefined, "prebuilt"),
          components: componentsList,
          includeAssembly: true,
        },
        true
      );
      return;
    }

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

  const handleCustomize = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const categoryMap: Record<string, string> = {
      cpu: "CPU",
      gpu: "GPU",
      motherboard: "Motherboard",
      ram: "RAM",
      storage: "Storage",
      psu: "PSU",
      case: "Case",
      cooler: "Cooler",
    };

    const parts = Object.entries(system.components).flatMap(([category, value]) => {
      const ids = Array.isArray(value) ? value : [value];
      return ids.filter(Boolean).map((partId) => {
        const resolvedPart = resolvedParts[category];
        return {
          category: categoryMap[category] || category,
          partId: resolvedPart?.id || String(partId),
          name: resolvedPart?.name || String(partId),
          price: resolvedPart?.price || 0,
        };
      });
    });

    const unavailableParts = Array.from(new Set([
      ...missingParts,
      ...Object.entries(partsStock)
        .filter(([, stock]) => stock <= 0)
        .map(([category]) => resolvedParts[category]?.name || categoryMap[category] || category),
    ]));

    const prebuiltBuildPayload: FavoriteBuild = {
      id: system.id,
      name: `${system.name} (Customized)`,
      parts,
      totalPrice: system.price,
      source: "builder",
      createdAt: new Date().toISOString(),
      loadContext: {
        type: "prebuilt",
        systemName: system.name,
        unavailableParts,
      },
    };

    localStorage.setItem("pc_builder_load_favorite", JSON.stringify(prebuiltBuildPayload));
    router.push("/builder");
  };

  const hasRemainingSpecs = Boolean(
    system.components?.motherboard ||
    system.components?.cooler ||
    system.components?.psu ||
    system.components?.case
  );

  const mainBody = (
    <>
      <Card
        withBorder
        radius="lg"
        padding={0}
        className={cn(
          "flex flex-col justify-between min-h-[600px] sm:min-h-[640px] h-full relative group overflow-hidden transition-all duration-300 shadow-lg",
          "hover:border-cyan-500 dark:hover:border-cyan-400 hover:shadow-2xl hover:shadow-cyan-500/20 dark:hover:shadow-cyan-500/30 hover:-translate-y-1.5",
          isClickable ? "cursor-pointer" : "cursor-default",
          "bg-white/85 dark:bg-[#111722]",
          "border-slate-200/80 dark:border-white/10",
          needsCustomization && "border-yellow-500/60 dark:border-yellow-400/60 bg-yellow-50/50 dark:!bg-black/30 shadow-lg shadow-yellow-500/10 dark:shadow-black/30 hover:border-yellow-500/80 dark:hover:border-yellow-400/80",
          className
        )}
      >
        {/* Top Area: Badges (if enabled) + 60% Product Image Canvas */}
        <div className="flex flex-col shrink-0">
          {showBadges && (
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
                <Badge size="xs" variant="light" color="yellow" radius="sm">
                  Incomplete
                </Badge>
              ) : isInStock ? (
                <Badge size="xs" variant="light" color="teal" radius="sm">
                  In Stock
                </Badge>
              ) : (
                <Badge size="xs" variant="light" color="yellow" radius="sm">
                  Missing Parts
                </Badge>
              )}
            </Group>
          )}

          {/* 60% Product Image Canvas (Edge-to-edge, transparent background) */}
          <Box className="relative w-full h-[360px] sm:h-[380px] overflow-hidden bg-transparent border-b border-slate-200/70 dark:border-white/10">
            <OptimizedImage
              src={getOptimizedStorageUrl(system.imageUrl, shouldCorruptImages) || "/placeholder-system.png"}
              alt={system.name}
              fill
              priority={priority}
              sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
              className="object-contain w-full h-full"
            />
          </Box>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col justify-between p-4 sm:p-5">
          <Stack gap={3}>
            {/* Title & SKU */}
            <Text
              size="md"
              fw={700}
              lineClamp={2}
              className="leading-snug transition-colors group-hover:text-cyan-600 dark:group-hover:text-cyan-400 font-headline"
              title={system.name}
            >
              {system.name}
            </Text>
            <Text
              size="xs"
              c="dimmed"
              className="font-mono text-[11px] tracking-wider text-slate-500 dark:text-slate-400 truncate"
              title={system.sku || system.productId || system.id}
            >
              {system.sku || system.productId || system.id}
            </Text>

            {/* 4 Core Parts + Dropdown for remaining parts (No bounding box div) */}
            <div className="pt-2">
              <PrebuiltCardSpecs components={system.components} expanded={isExpanded} />

              {hasRemainingSpecs && (
                <button
                  type="button"
                  onClick={toggleExpand}
                  className="flex items-center gap-1 text-[11px] font-medium text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 transition-colors pt-1.5 focus:outline-none"
                >
                  <span>{isExpanded ? "Show fewer parts" : "+ 4 more parts"}</span>
                  {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </button>
              )}
            </div>
          </Stack>

          {/* Bottom Price & Actions */}
          <Stack gap="xs" className="pt-4">
            <Group justify="space-between" align="center">
              <Stack gap={0}>
                <Text size="xs" c="dimmed" tt="uppercase" fw={600} className="tracking-wider text-[10px]">
                  Total Price
                </Text>
                <Text size="lg" fw={700} className="text-slate-900 dark:text-slate-100 font-mono leading-none">
                  {formatCurrency(system.price)}
                </Text>
              </Stack>

              {hasRemainingSpecs && (
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  size="sm"
                  radius="md"
                  onClick={toggleExpand}
                  title={isExpanded ? "Hide Specs" : "Show Remaining Specs"}
                  aria-label={isExpanded ? "Hide Specs" : "Show Remaining Specs"}
                >
                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </ActionIcon>
              )}
            </Group>

            {showReserveButton && (
              needsCustomization ? (
                <Button
                  fullWidth
                  radius="md"
                  size="sm"
                  variant="light"
                  color="yellow"
                  onClick={handleCustomize}
                  disabled={isAdminPreview}
                  title={isAdminPreview ? "Unavailable in admin preview" : undefined}
                  leftSection={<SlidersHorizontal className="h-4 w-4" />}
                  className="font-medium transition-all duration-200 hover:bg-yellow-400 hover:text-slate-950"
                >
                  Customize Pre-built
                </Button>
              ) : (
                <Button
                  fullWidth
                  radius="md"
                  size="sm"
                  variant="light"
                  color="cyan"
                  onClick={openCheckoutDialog}
                  disabled={isAdminPreview || loadingStock || isReserving}
                  title={isAdminPreview ? "Unavailable in admin preview" : undefined}
                  leftSection={
                    isReserving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : isEcommerceMode ? (
                      <ShoppingCart className="h-4 w-4 transition-transform group-hover:-translate-y-0.5" />
                    ) : (
                      <ShieldCheck className="h-4 w-4 transition-transform group-hover:-translate-y-0.5" />
                    )
                  }
                  className="font-medium hover:bg-cyan-500 hover:text-white transition-all duration-200"
                >
                  {isReserving
                    ? "Processing..."
                    : isEcommerceMode
                      ? "Add System to Cart"
                      : "Reserve Rig"}
                </Button>
              )
            )}

            {showLaunchButton && (
              <Button
                component={Link}
                href={detailHref}
                variant="outline"
                color="gray"
                size="sm"
                radius="md"
                fullWidth
                rightSection={<ExternalLink size={14} />}
                className="font-headline font-bold text-xs uppercase tracking-wider h-9 border-slate-200 dark:border-white/10 hover:border-cyan-500/40 text-slate-700 dark:text-slate-200"
                onClick={(e) => e.stopPropagation()}
              >
                Launch Page
              </Button>
            )}
          </Stack>
        </div>
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
    </>
  );

  if (!isClickable) {
    return <div className="h-full">{mainBody}</div>;
  }

  return (
    <Link href={detailHref} className="block h-full">
      {mainBody}
    </Link>
  );
}
