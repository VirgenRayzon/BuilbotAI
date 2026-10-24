"use client";

import React, { useEffect, useState } from "react";
import {
  Badge as MantineBadge,
  Card as MantineCard,
  MantineProvider,
  Paper as MantinePaper,
  createTheme,
} from "@mantine/core";
import { useTheme } from "@/context/theme-provider";
import "@mantine/core/styles.css";

const mantineTheme = createTheme({
  primaryColor: "cyan",
  primaryShade: { light: 6, dark: 8 },
  white: "#FDFBF7",
  black: "#252B31",
  colors: {
    cyan: [
      "#EDF9FB",
      "#D7F0F4",
      "#B1E0E7",
      "#80C9D4",
      "#4BAFBE",
      "#0E7490",
      "#0C657C",
      "#0A566A",
      "#084957",
      "#063B47",
    ],
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
  components: {
    Card: MantineCard.extend({
      defaultProps: {
        shadow: "lg",
      },
    }),
    Paper: MantinePaper.extend({
      defaultProps: {
        shadow: "lg",
      },
    }),
    Badge: MantineBadge.extend({
      defaultProps: {
        radius: "sm",
      },
    }),
  },
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
      forceColorScheme={mounted ? (theme === "dark" ? "dark" : "light") : "light"}
    >
      {children}
    </MantineProvider>
  );
}
