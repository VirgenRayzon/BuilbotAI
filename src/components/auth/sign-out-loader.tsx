"use client";

import { AnimatePresence, motion } from "framer-motion";
import { LoaderCard } from "@/components/loading/loader-card";

interface SignOutLoaderProps {
  visible: boolean;
}

export function SignOutLoader({ visible }: SignOutLoaderProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm"
        >
          <LoaderCard message="Signing you out..." />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
