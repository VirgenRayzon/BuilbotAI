/**
 * ThemeToggle — Dark/Light mode toggle button.
 * Uses Sun/Moon icons with rotate/scale animations for smooth theme transitions.
 */

'use client';

import { ActionIcon, VisuallyHidden } from '@mantine/core';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/context/theme-provider';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <ActionIcon
      variant="subtle"
      color="gray"
      size="lg"
      radius="md"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      aria-label="Toggle theme"
      className="relative shrink-0 self-center text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/5"
    >
      <Sun className="absolute inset-1/2 h-[1.1rem] w-[1.1rem] -translate-x-1/2 -translate-y-1/2 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute inset-1/2 h-[1.1rem] w-[1.1rem] -translate-x-1/2 -translate-y-1/2 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <VisuallyHidden>Toggle theme</VisuallyHidden>
    </ActionIcon>
  );
}
