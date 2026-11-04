import { existsSync } from 'node:fs';
import { defineConfig } from '@playwright/test';

const localChrome = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

export default defineConfig({
  use: {
    launchOptions: process.platform === 'win32' && existsSync(localChrome)
      ? { executablePath: localChrome }
      : undefined,
  },
});
