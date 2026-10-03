"use client";

import React, { useEffect, useState } from "react";
import { MantineProvider, createTheme } from "@mantine/core";
import { useTheme } from "@/context/theme-provider";
import "@mantine/core/styles.css";

const mantineTheme = createTheme({
  primaryColor: "cyan",
  colors: {
    dark: [
      "#C1C2C5",
      "#A6A7AB",
      "#909296",
      "#5c5f66",
      "#373A40",
      "#2C2E33",
      "#25262b",
      "#141a23", // deeper sleek background
      "#0f131a",
      "#0a0d12",
    ],
  },
  fontFamily: 'var(--font-body, "Inter", -apple-system, BlinkMacSystemFont, sans-serif)',
  headings: {
    fontFamily: 'var(--font-headline, "Space Grotesk", sans-serif)',
  },
  defaultRadius: "lg",
});

export function MantineAppProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <MantineProvider
      theme={mantineTheme}
      forceColorScheme={mounted ? (theme === "dark" ? "dark" : "light") : "dark"}
    >
      {children}
    </MantineProvider>
  );
}
