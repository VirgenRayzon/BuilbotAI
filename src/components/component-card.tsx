/**
 * ComponentCard — Mantine UI card for displaying a single PC component in the AI build summary.
 * Designed with strict Mantine UI aesthetics, light/dark mode harmony, standardized headers,
 * padded product canvas, line-clamped AI rationale with Popover expansion, and structured price stack.
 */
"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  Card,
  Text,
  Badge,
  Group,
  Stack,
  Box,
  ThemeIcon,
  Popover,
} from "@mantine/core";
import type { ComponentData } from "@/lib/types";
import { formatCurrency, getOptimizedStorageUrl, cn } from "@/lib/utils";
import { getComponentPlaceholderImage } from "@/lib/placeholder-images";

interface ComponentCardProps {
  name: string;
  component: ComponentData;
  icon: React.ComponentType<{ className?: string }>;
}

export function ComponentCard({ name, component, icon: Icon }: ComponentCardProps) {
  const fallback = getComponentPlaceholderImage(name, component.model);
  const rawImage = component.image;
  const isPicsum = !rawImage || rawImage.includes("picsum.photos");
  const initialSrc = isPicsum ? fallback : (getOptimizedStorageUrl(rawImage) || fallback);

  const [imgSrc, setImgSrc] = useState(initialSrc);
  const isAiSuggested = component.id.startsWith("ai-suggested-");

  useEffect(() => {
    const freshFallback = getComponentPlaceholderImage(name, component.model);
    const freshRaw = component.image;
    const freshIsPicsum = !freshRaw || freshRaw.includes("picsum.photos");
    setImgSrc(freshIsPicsum ? freshFallback : (getOptimizedStorageUrl(freshRaw) || freshFallback));
  }, [component.image, component.model, name]);

  const hasLongDescription = Boolean(
    component.description && component.description.length > 130
  );

  return (
    <Card
      withBorder
      radius="lg"
      padding="md"
      className={cn(
        "flex flex-col justify-between h-full relative group transition-all duration-300",
        "bg-white/80 dark:bg-[#141a23]/90 hover:shadow-md hover:-translate-y-1",
        "border-slate-200/80 dark:border-white/10 hover:border-cyan-500/40 dark:hover:border-cyan-500/40"
      )}
    >
      {/* --- Top Header: Slot Icon, Badges & Model Name --- */}
      <Stack gap={8} mb="xs">
        <Group justify="space-between" align="center" wrap="nowrap">
          <Group gap={6} align="center" wrap="nowrap">
            <ThemeIcon
              size={28}
              radius="md"
              variant="light"
              color="cyan"
              className="shrink-0 shadow-xs"
            >
              <Icon className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            </ThemeIcon>
            <Badge
              size="xs"
              variant="light"
              color="cyan"
              radius="sm"
              className="font-semibold tracking-wider uppercase text-[10px]"
            >
              {name}
            </Badge>
          </Group>

          {isAiSuggested ? (
            <Badge
              size="xs"
              variant="light"
              color="amber"
              radius="sm"
              className="font-medium text-[10px] shrink-0"
            >
              Market Part
            </Badge>
          ) : (
            <Badge
              size="xs"
              variant="light"
              color="teal"
              radius="sm"
              className="font-medium text-[10px] shrink-0"
            >
              In Stock
            </Badge>
          )}
        </Group>

        {/* 2-line clamped Model Name with consistent min-height for row alignment */}
        <Text
          size="sm"
          fw={700}
          lineClamp={2}
          className="leading-snug transition-colors group-hover:text-cyan-600 dark:group-hover:text-cyan-400 min-h-[2.5rem] text-slate-900 dark:text-slate-100"
          title={component.model}
        >
          {component.model}
        </Text>
      </Stack>

      {/* --- Padded Product Showcase Canvas --- */}
      <Box
        className={cn(
          "aspect-square relative w-full overflow-hidden rounded-xl p-3 my-1",
          "bg-slate-100/70 dark:bg-white/[0.03] border border-slate-200/50 dark:border-white/5",
          "transition-colors duration-300 group-hover:bg-slate-100 dark:group-hover:bg-white/[0.05]"
        )}
      >
        <Image
          src={imgSrc}
          alt={component.description || component.model || name}
          fill
          unoptimized
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
          className="object-contain transition-transform duration-500 group-hover:scale-105 p-1"
          data-ai-hint={component.imageHint}
          onError={() => {
            setImgSrc(fallback);
          }}
        />
      </Box>

      {/* --- AI Rationale & Explanation Section --- */}
      <Stack gap={4} className="flex-grow justify-start my-2">
        <Text
          size="xs"
          c="dimmed"
          lineClamp={3}
          className="leading-relaxed min-h-[3rem] text-slate-600 dark:text-slate-400"
        >
          {component.description}
        </Text>

        {hasLongDescription && (
          <Popover
            width={320}
            position="top"
            withArrow
            shadow="md"
            radius="md"
          >
            <Popover.Target>
              <button
                type="button"
                className="text-[11px] font-semibold text-cyan-600 dark:text-cyan-400 hover:underline inline-block self-start cursor-pointer bg-transparent border-0 p-0 transition-colors"
              >
                Read more...
              </button>
            </Popover.Target>
            <Popover.Dropdown className="bg-white/95 dark:bg-[#111722]/95 border-slate-200 dark:border-white/10 backdrop-blur-xl p-3.5 shadow-xl">
              <Text
                size="xs"
                fw={700}
                className="mb-1.5 text-slate-900 dark:text-slate-100 font-headline"
              >
                Advisor Rationale • {name}
              </Text>
              <Text
                size="xs"
                className="leading-relaxed text-slate-600 dark:text-slate-300"
              >
                {component.description}
              </Text>
            </Popover.Dropdown>
          </Popover>
        )}
      </Stack>

      {/* --- Structured Footer: Price & Stock Status --- */}
      <Stack gap="xs" mt="xs" className="pt-2 border-t border-slate-100 dark:border-white/5">
        <Group justify="space-between" align="baseline">
          <Stack gap={0}>
            <Text
              size="xs"
              c="dimmed"
              tt="uppercase"
              fw={600}
              className="tracking-wider text-[10px]"
            >
              Price
            </Text>
            <Text
              size="lg"
              fw={700}
              className="text-slate-900 dark:text-slate-100 font-mono leading-none"
            >
              {formatCurrency(component.price)}
            </Text>
          </Stack>

          {isAiSuggested && (
            <Badge
              size="xs"
              variant="light"
              color="amber"
              radius="sm"
              className="font-semibold text-[10px]"
            >
              Est. Market Price
            </Badge>
          )}
        </Group>
      </Stack>
    </Card>
  );
}
