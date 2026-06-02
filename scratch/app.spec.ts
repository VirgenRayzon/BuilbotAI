import { test, expect } from '@playwright/test';

test('has title and landing content', async ({ page }) => {
  console.log("Navigating to landing page...");
  await page.goto('http://localhost:9002/');
  
  // Wait for page to hydrate
  console.log("Waiting for 'BuildbotAI v4.0' badge to appear...");
  await page.waitForSelector('text=BuildbotAI v4.0', { state: 'visible', timeout: 15000 });
  
  // Assert title contains Buildbot
  const title = await page.title();
  console.log(`Landing page title: "${title}"`);
  expect(title.toLowerCase()).toContain('buildbot');
  
  // Take screenshot
  await page.screenshot({ path: 'scratch/screenshot-home.png', fullPage: true });
  console.log("Home page screenshot saved to scratch/screenshot-home.png");
});

test('system access sign-in page loads correctly', async ({ page }) => {
  console.log("Navigating to system access page...");
  await page.goto('http://localhost:9002/system-access');
  
  // Wait for page to hydrate
  console.log("Waiting for 'System Access' card title to appear...");
  await page.waitForSelector('text=System Access', { state: 'visible', timeout: 15000 });
  
  // Verify system access page title
  const title = await page.title();
  console.log(`System Access page title: "${title}"`);
  expect(title.toLowerCase()).toContain('buildbot');
  
  // Take screenshot
  await page.screenshot({ path: 'scratch/screenshot-system-access.png' });
  console.log("System Access page screenshot saved to scratch/screenshot-system-access.png");
});
