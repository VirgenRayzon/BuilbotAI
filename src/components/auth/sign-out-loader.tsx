"use client";

import { AnimatePresence } from "framer-motion";
import { NeutralPageLoader } from "@/components/neutral-page-loader";

interface SignOutLoaderProps {
  visible: boolean;
}

/** Mirrors the account-verification loader during the short sign-out transition. */
export function SignOutLoader({ visible }: SignOutLoaderProps) {
  return (
    <AnimatePresence>
      {visible && <NeutralPageLoader isOverlay message="Signing you out..." />}
    </AnimatePresence>
  );
}
