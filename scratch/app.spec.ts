import { test, expect } from '@playwright/test';

test('has title and landing content', async ({ page }) => {
  console.log("Navigating to landing page...");
  await page.goto('http://localhost:9002/');
  
  console.log("Waiting for 'BuildbotAI v4.0' badge to appear...");
  await page.waitForSelector('text=BuildbotAI v4.0', { state: 'visible', timeout: 15000 });
  
  const title = await page.title();
  console.log(`Landing page title: "${title}"`);
  expect(title.toLowerCase()).toContain('buildbot');
  
  await page.screenshot({ path: 'scratch/screenshot-home.png', fullPage: true });
  console.log("Home page screenshot saved to scratch/screenshot-home.png");
});

test('system access sign-in page loads correctly', async ({ page }) => {
  console.log("Navigating to system access page...");
  await page.goto('http://localhost:9002/system-access');
  
  console.log("Waiting for 'System Access' card title to appear...");
  await page.waitForSelector('text=System Access', { state: 'visible', timeout: 15000 });
  
  const title = await page.title();
  console.log(`System Access page title: "${title}"`);
  expect(title.toLowerCase()).toContain('buildbot');
  
  await page.screenshot({ path: 'scratch/screenshot-system-access.png' });
  console.log("System Access page screenshot saved to scratch/screenshot-system-access.png");
});
