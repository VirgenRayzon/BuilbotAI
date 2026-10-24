"use client";

import { useState } from "react";
import { ActionIcon, Badge, Button, Group, Modal, Paper, ScrollArea, Text, TextInput, ThemeIcon, Title, Tooltip } from "@mantine/core";
import { ShieldCheck, ShoppingCart, Sparkles, Zap } from "lucide-react";
import type { ComponentData } from "@/lib/types";
import { formatCurrency, cn } from "@/lib/utils";
import { useSiteSettings } from "@/context/site-settings-context";
import { useEcommerce, type EcommerceSubComponent } from "@/context/ecommerce-context";

const reviewCategories = ["Motherboard", "CPU", "GPU", "RAM", "Storage", "PSU", "Cooler", "Case", "Monitor", "Keyboard", "Mouse", "Headset"];

const UNIFIED_MODAL_CLASSNAMES = {
  content: "bg-white/95 dark:bg-[#141a23]/95 backdrop-blur-md border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-slate-100 shadow-xl rounded-xl overflow-hidden",
  header: "bg-white/95 dark:bg-[#141a23]/95 border-b border-slate-200/80 dark:border-white/10 p-3",
  body: "!p-3",
  close: "text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors",
};

interface BuildActionFooterProps {
  build: Record<string, ComponentData | ComponentData[] | null>;
  totalPrice: number;
  selectedParts: number;
  missingCategories: string[];
  isManagerMode: boolean;
  isAiPending: boolean;
  isCheckingOut: boolean;
  analysis?: unknown;
  onAnalyze: () => void;
  onReserve: (onSuccess: () => void) => void;
  onAddPrebuilt: (name: string) => void;
  onIncompleteAction: () => void;
  showMissingValidation: boolean;
}

export function BuildActionFooter({
  build, totalPrice, selectedParts, missingCategories, isManagerMode,
  isAiPending, isCheckingOut, analysis,
  onAnalyze, onReserve, onAddPrebuilt, onIncompleteAction, showMissingValidation,
}: BuildActionFooterProps) {
  const [reserveOpen, setReserveOpen] = useState(false);
  const [nameOpen, setNameOpen] = useState(false);
  const [prebuiltName, setPrebuiltName] = useState("");
  const { isEcommerceMode } = useSiteSettings();
  const { addToCart, buyNow } = useEcommerce();

  const complete = missingCategories.length === 0;
  const isReady = complete && !isAiPending;

  const startPrebuiltGeneration = () => {
    const name = prebuiltName.trim();
    if (!name) return;
    setNameOpen(false);
    setPrebuiltName("");
    onAddPrebuilt(name);
  };

  const buildEcommercePayload = () => {
    const components: EcommerceSubComponent[] = reviewCategories.flatMap((category) => {
      const value = build[category];
      const parts = Array.isArray(value) ? value : value ? [value] : [];
      return parts.map((part) => ({
        category,
        name: part.model,
        price: part.price || 0,
        imageUrl: part.image || part.images?.[0] || "/placeholder-part.png",
      }));
    });

    const cpuPart = build.CPU && !Array.isArray(build.CPU) ? build.CPU : null;
    const gpuPart = build.GPU && !Array.isArray(build.GPU) ? build.GPU : null;
    const casePart = build.Case && !Array.isArray(build.Case) ? build.Case : null;

    const cpuModel = cpuPart?.model || "Custom CPU";
    const gpuModel = gpuPart?.model || "Custom GPU";
    const rigThumbnail =
      casePart?.image ||
      casePart?.images?.[0] ||
      gpuPart?.image ||
      gpuPart?.images?.[0] ||
      cpuPart?.image ||
      "/placeholder-system.png";

    return {
      id: `custom-rig-${Date.now()}`,
      kind: "custom-build" as const,
      name: `Custom Rig (${cpuModel} + ${gpuModel})`,
      price: totalPrice,
      imageUrl: rigThumbnail,
      components,
      includeAssembly: true,
    };
  };

  const handleAddRigToCart = () => {
    if (!complete) {
      onIncompleteAction();
      return;
    }
    addToCart(buildEcommercePayload(), true);
  };

  const handleBuyRigNow = () => {
    if (!complete) {
      onIncompleteAction();
      return;
    }
    buyNow(buildEcommercePayload());
  };

  return (
    <div className="p-3 space-y-2.5">
      {showMissingValidation && !complete && (
        <Text role="alert" size="xs" className="px-1 text-red-600 dark:text-red-400 leading-relaxed">
          Select the missing parts to continue: {missingCategories.join(", ")}.
        </Text>
      )}
      {isManagerMode ? (
        <>
          <Button
            fullWidth
            size="md"
            radius="md"
            color="cyan"
            leftSection={<Sparkles size={17} />}
            disabled={isAiPending}
            aria-disabled={!complete || isAiPending}
            title={!complete ? "Select every highlighted core part before adding this prebuilt." : undefined}
            loading={isAiPending}
            onClick={() => complete ? setNameOpen(true) : onIncompleteAction()}
            className="font-headline font-bold text-xs uppercase tracking-wider shadow-sm shadow-cyan-500/20"
          >
            Add New Prebuilt
          </Button>
        </>
      ) : (
        <Group gap="xs" wrap="nowrap" align="stretch">
          <ActionIcon
            size={42}
            radius="md"
            variant="light"
            color="cyan"
            loading={isAiPending}
            aria-label={analysis ? "Refresh build analysis" : "Analyze build"}
            aria-disabled={!complete}
            title={!complete ? "Select every highlighted core part before analyzing." : analysis ? "Refresh build analysis" : "Analyze build"}
            onClick={() => complete ? onAnalyze() : onIncompleteAction()}
            className={cn(
              "h-[42px] w-[42px] shrink-0 border transition-all duration-300",
              isReady ? (
                "border-cyan-500/50 dark:border-cyan-400/40 text-cyan-600 dark:text-cyan-300 bg-cyan-500/10 dark:bg-cyan-500/15 animate-breathe hover:border-cyan-500 hover:scale-[1.06] hover:[animation-play-state:paused] active:scale-[0.96]"
              ) : (
                "border-slate-200 dark:border-white/10 opacity-50 cursor-not-allowed text-slate-400 dark:text-slate-500 hover:scale-100"
              )
            )}
          >
            <Sparkles size={16} className={cn("transition-transform duration-200", isReady && "animate-sparkle")} />
          </ActionIcon>

          {isEcommerceMode ? (
            <>
              <Button
                size="md"
                radius="md"
                color="cyan"
                leftSection={<ShoppingCart size={17} />}
                aria-disabled={!complete}
                title={!complete ? "Select every highlighted core part before adding to cart." : undefined}
                onClick={handleAddRigToCart}
                className={cn(
                  "h-[42px] flex-1 font-headline font-bold text-xs uppercase tracking-wider transition-all duration-200",
                  "shadow-md shadow-cyan-500/20 hover:scale-[1.01] active:scale-[0.99]"
                )}
              >
                Add Rig to Cart
              </Button>
              <Tooltip label="Instant Checkout (Buy Now)" withArrow>
                <ActionIcon
                  size={42}
                  radius="md"
                  variant="filled"
                  color="teal"
                  aria-label="Buy Rig Now"
                  aria-disabled={!complete}
                  onClick={handleBuyRigNow}
                  className="h-[42px] w-[42px] shrink-0 shadow-md shadow-emerald-500/20"
                >
                  <Zap size={17} />
                </ActionIcon>
              </Tooltip>
            </>
          ) : (
            <Button
              size="md"
              radius="md"
              color="teal"
              leftSection={<ShieldCheck size={18} />}
              aria-disabled={!complete}
              title={!complete ? "Select every highlighted core part before reserving." : undefined}
              onClick={() => complete ? setReserveOpen(true) : onIncompleteAction()}
              className={cn(
                "h-[42px] flex-1 font-headline font-bold text-xs uppercase tracking-wider transition-all duration-200",
                "shadow-md shadow-emerald-500/20 hover:scale-[1.01] active:scale-[0.99]"
              )}
            >
              Reserve Build
            </Button>
          )}
        </Group>
      )}

      <Modal
        opened={nameOpen}
        onClose={() => setNameOpen(false)}
        size="sm"
        radius="lg"
        centered
        overlayProps={{ backgroundOpacity: 0.65, blur: 5 }}
        title={
          <Group gap="sm">
            <ThemeIcon size="lg" color="cyan" variant="light" radius="md">
              <Sparkles size={18} />
            </ThemeIcon>
            <div>
              <Title order={4} className="font-headline text-base font-bold text-slate-900 dark:text-white">
                Name this prebuilt
              </Title>
              <Text size="xs" c="dimmed">AI will create its catalog description from the selected parts.</Text>
            </div>
          </Group>
        }
        classNames={UNIFIED_MODAL_CLASSNAMES}
      >
        <form
          onSubmit={(event) => {
            event.preventDefault();
            startPrebuiltGeneration();
          }}
          className="space-y-4"
        >
          <TextInput
            label="Prebuilt name"
            placeholder="e.g., Velocity Core"
            value={prebuiltName}
            onChange={(event) => setPrebuiltName(event.currentTarget.value)}
            autoFocus
            required
            radius="md"
            size="md"
          />
          <Group justify="flex-end" gap="sm">
            <Button type="button" variant="default" radius="md" onClick={() => setNameOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" color="cyan" radius="md" disabled={!prebuiltName.trim()} leftSection={<Sparkles size={16} />}>
              Generate Prebuilt
            </Button>
          </Group>
        </form>
      </Modal>

      {/* Confirm Reservation Modal */}
      <Modal
        opened={reserveOpen}
        onClose={() => setReserveOpen(false)}
        size="lg"
        radius="lg"
        centered
        overlayProps={{ backgroundOpacity: 0.65, blur: 5 }}
        title={
          <Group gap="sm">
            <ThemeIcon size="lg" color="teal" variant="light" radius="md" className="shadow-xs">
              <ShieldCheck size={20} />
            </ThemeIcon>
            <div>
              <Title order={4} className="font-headline text-base font-bold text-slate-900 dark:text-white uppercase tracking-tight">
                Confirm Reservation
              </Title>
              <Text size="xs" c="dimmed">
                Review your hardware setup before locking in your reservation.
              </Text>
            </div>
          </Group>
        }
        classNames={UNIFIED_MODAL_CLASSNAMES}
      >
        <div className="space-y-4">
          {/* Scrollable Parts List with Mantine themed scrollbar */}
          <Paper withBorder radius="md" className="overflow-hidden border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.01]">
            <div className="px-4 pr-5 py-2.5 bg-slate-100/70 dark:bg-white/[0.03] border-b border-slate-200 dark:border-white/10 flex justify-between items-center text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <span>Component</span>
              <span>Price</span>
            </div>
            <ScrollArea.Autosize
              mah={260}
              scrollbars="y"
              type="auto"
              offsetScrollbars
              scrollbarSize={6}
              classNames={{
                content: "!min-w-0 !w-full !max-w-full",
              }}
              styles={{
                viewport: {
                  overflowX: "hidden",
                },
                content: {
                  minWidth: "0 !important",
                  width: "100% !important",
                  maxWidth: "100% !important",
                },
              }}
            >
              <div className="divide-y divide-slate-100 dark:divide-white/5">
                {reviewCategories.flatMap((category) => {
                  const value = build[category];
                  const parts = Array.isArray(value) ? value : value ? [value] : [];
                  return parts.map((part, index) => (
                    <div
                      key={`${category}-${index}`}
                      className="flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-slate-100/60 dark:hover:bg-white/[0.02] transition-colors w-full min-w-0"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <Badge size="xs" variant="light" color="cyan" radius="sm" fw={700} className="shrink-0 uppercase text-[9px] font-mono tracking-wider">
                          {category}
                        </Badge>
                        <span className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate" title={part.model}>
                          {part.model}
                        </span>
                      </div>
                      <span className="shrink-0 font-mono text-xs font-bold text-slate-900 dark:text-slate-100 tabular-nums ml-2">
                        {formatCurrency(part.price || 0)}
                      </span>
                    </div>
                  ));
                })}
              </div>
            </ScrollArea.Autosize>
          </Paper>

          {/* Pricing & Reservation Summary */}
          <Paper withBorder radius="md" p="md" className="bg-slate-50/80 dark:bg-white/[0.03] border-slate-200 dark:border-white/10 shadow-xs">
            <Group justify="space-between" align="center">
              <div>
                <Text size="xs" fw={700} className="font-headline uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Total Reservation Value
                </Text>
                <Text size="xs" c="dimmed">
                  {selectedParts} parts verified for reservation
                </Text>
              </div>
              <Text fw={900} className="font-headline text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                {formatCurrency(totalPrice)}
              </Text>
            </Group>
          </Paper>

          <Text size="xs" c="dimmed" className="leading-relaxed">
            Reservations hold selected inventory for pickup or store checkout. No immediate online charge is processed until verified at the counter.
          </Text>

          <Group justify="flex-end" gap="sm" mt="md" pt="sm" className="border-t border-slate-100 dark:border-white/5">
            <Button
              variant="default"
              size="sm"
              radius="md"
              onClick={() => setReserveOpen(false)}
              className="font-medium text-xs border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 transition-all active:scale-[0.98]"
            >
              Cancel
            </Button>
            <Button
              color="teal"
              size="sm"
              radius="md"
              loading={isCheckingOut}
              leftSection={<ShieldCheck size={16} />}
              onClick={() => onReserve(() => setReserveOpen(false))}
              className="font-headline font-bold text-xs uppercase tracking-wider shadow-md shadow-emerald-500/20 hover:scale-[1.01] active:scale-[0.99] transition-all"
            >
              Confirm Reservation
            </Button>
          </Group>
        </div>
      </Modal>
    </div>
  );
}
