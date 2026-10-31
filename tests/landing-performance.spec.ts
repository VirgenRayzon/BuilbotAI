import { expect, test } from '@playwright/test';

const baseURL = process.env.E2E_BASE_URL || 'http://127.0.0.1:9002';
test.setTimeout(60000);

test('hero preload is discoverable before JavaScript or authentication resolves', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(baseURL);
  const preload = page.locator('link[rel="preload"][as="image"]');
  await expect(preload).toHaveCount(1);
  await expect(preload).toHaveAttribute('fetchpriority', 'high');
  const candidates = await preload.getAttribute('imagesrcset') || await preload.getAttribute('href');
  expect(candidates).toContain('prism5-poster');
  // Preloading a public asset must not expose gated page content.
  await expect(page.locator('img[alt="Netcodex Prism 5 PC"]')).toHaveCount(0);
  await context.close();
});

for (const width of [390, 1440]) {
  test(`landing images, themes and deferred carousel work at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(baseURL);
    const hero = page.getByRole('img', { name: 'Netcodex Prism 5 PC', exact: true });
    await expect(hero).toBeVisible({ timeout: 30000 });
    await expect.poll(() => hero.evaluate(image => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
    await expect(hero).toHaveAttribute('fetchpriority', 'high');
    const heroURL = await hero.evaluate(image => (image as HTMLImageElement).currentSrc);
    const downloads = await page.evaluate(imageURL => performance.getEntriesByType('resource').filter(entry => entry.name === imageURL).length, heroURL);
    expect(downloads).toBe(1);
    // The carousel remains out of the initial render/network path.
    await expect(page.locator('#prebuilts [aria-roledescription="carousel"]')).toHaveCount(0);
    const heroRegion = page.getByRole('region', { name: 'Featured PCs and ways to shop' });
    const featureSlides = [
      ['Bottleneck Analysis', 'Bottleneck Analysis'],
      ['Buildbot Build Critique', 'Buildbot Build Critique'],
      ['Instant AI Build Generation', 'AI Build Generation'],
    ] as const;
    for (const [slideName, imageName] of featureSlides) {
      await heroRegion.getByRole('button', { name: `Show ${slideName}` }).click();
      const image = heroRegion.getByRole('img', { name: imageName, exact: true });
      await expect.poll(() => image.evaluate(element => (element as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
      await expect(image).toHaveAttribute('loading', 'lazy');
    }
    await heroRegion.getByRole('button', { name: 'Show Prism 5' }).click();
    const section = page.locator('#prebuilts');
    await section.scrollIntoViewIfNeeded();
    const carousel = section.locator('[aria-roledescription="carousel"]');
    await expect(carousel).toBeVisible({ timeout: 30000 });
    const slide = carousel.locator('[aria-roledescription="slide"]').first();
    await expect.poll(() => slide.locator('img').evaluate(image => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
    const before = await slide.boundingBox();
    const next = carousel.getByRole('button', { name: 'Next slide' });
    await expect(next).toBeEnabled();
    await next.click();
    await expect.poll(async () => (await slide.boundingBox())?.x).toBeLessThan(before!.x - 10);
    await carousel.getByRole('button', { name: 'Previous slide' }).click();
    await expect.poll(async () => Math.abs(((await slide.boundingBox())?.x ?? Infinity) - before!.x)).toBeLessThan(2);

    const shoppingPaths = page.getByRole('region', { name: 'Choose how to build your PC' });
    await shoppingPaths.scrollIntoViewIfNeeded();
    await expect(shoppingPaths.getByRole('link', { name: 'Shop Prebuilts' })).toHaveAttribute('href', '/pre-builts');
    await expect(shoppingPaths.getByRole('link', { name: 'Start Building' })).toHaveAttribute('href', '/builder');
    for (const name of ['Four prebuilt gaming PCs', 'PC case and components for a custom build']) {
      const image = shoppingPaths.getByRole('img', { name });
      await expect.poll(() => image.evaluate(element => (element as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
    }

    const whyNetcodex = page.getByRole('region', { name: 'Why Choose Netcodex?' });
    await whyNetcodex.scrollIntoViewIfNeeded();
    await expect(whyNetcodex.getByRole('heading', { level: 2 })).toHaveText('Why Choose Netcodex?');
    for (const title of ['Nationwide Shipping', 'Authorized Dealer', 'Secure Transactions', 'Top-notch Support']) {
      await expect(whyNetcodex.getByRole('heading', { name: title, level: 3 })).toBeVisible();
    }
    await expect(page.getByRole('heading', { name: /Ready to Build Your/i })).toHaveCount(0);

    // Exercise both stored themes on reload without changing the visual design.
    for (const theme of ['light', 'dark']) {
      await page.evaluate(value => localStorage.setItem('buildbot-ui-theme-v2', value), theme);
      await page.reload();
      await expect(page.locator('html')).toHaveClass(new RegExp(theme));
      await heroRegion.getByRole('button', { name: 'Show Prism 5' }).click();
      await expect(hero).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
    expect(errors).toEqual([]);
  });
}
