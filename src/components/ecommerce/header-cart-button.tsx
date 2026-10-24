"use client";

import React from "react";
import { ActionIcon, Badge, Indicator, Tooltip } from "@mantine/core";
import { ShoppingCart } from "lucide-react";
import { useSiteSettings } from "@/context/site-settings-context";
import { useEcommerce } from "@/context/ecommerce-context";

export function HeaderCartButton() {
  const { isEcommerceMode } = useSiteSettings();
  const { cartCount, setIsCartOpen } = useEcommerce();

  if (!isEcommerceMode) return null;

  return (
    <div className="flex items-center gap-1.5">
      <Badge
        size="xs"
        color="cyan"
        variant="light"
        radius="sm"
        className="hidden xl:inline-flex uppercase tracking-wider text-[9px] font-bold border border-cyan-500/30"
      >
        E-Commerce UI
      </Badge>
      <Tooltip label={`Shopping Cart (${cartCount} items)`} withArrow position="bottom">
        <Indicator
          inline
          label={cartCount}
          size={16}
          offset={3}
          color="cyan"
          disabled={cartCount === 0}
          classNames={{
            indicator: "font-mono font-bold text-[10px] px-1",
          }}
        >
          <ActionIcon
            variant="subtle"
            color="cyan"
            size="lg"
            radius="md"
            onClick={() => setIsCartOpen(true)}
            aria-label={`Open shopping cart (${cartCount} items)`}
            className="border border-cyan-500/20 bg-cyan-500/5 hover:bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 transition-all"
          >
            <ShoppingCart size={18} />
          </ActionIcon>
        </Indicator>
      </Tooltip>
    </div>
  );
}
