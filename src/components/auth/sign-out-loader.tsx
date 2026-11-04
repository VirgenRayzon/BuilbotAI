"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Loader, Text } from "@mantine/core";

interface SignOutLoaderProps {
  visible: boolean;
}

/** In-place modal overlay during sign-out transition */
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
          <div className="flex flex-col items-center gap-3 p-6 bg-white dark:bg-[#111722] rounded-2xl shadow-xl border border-slate-200 dark:border-white/10">
            <Loader color="cyan" size="md" />
            <Text size="sm" fw={600} className="text-slate-700 dark:text-slate-300">
              Signing you out...
            </Text>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
