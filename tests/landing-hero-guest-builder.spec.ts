import { expect, test } from '@playwright/test';

const baseURL = process.env.E2E_BASE_URL || 'http://127.0.0.1:9002';

test.setTimeout(90000);

test('featured videos, dots and landing links lead to their destinations', async ({ page, request }) => {
  await page.goto(baseURL);
  await expect(page.getByRole('link', { name: 'Features', exact: true })).toHaveCount(0);
  await expect(page.locator('#features')).toHaveCount(0);
  const hero = page.getByRole('region', { name: 'Featured PCs and ways to shop' });
  await expect(hero.getByRole('heading', { name: 'Prism 5' })).toBeVisible();
  await expect(hero.getByRole('link', { name: 'Shop Now' })).toHaveAttribute('href', '/pre-builts/PRD-000390');
  const prismVideo = hero.locator('video[data-hero-video="Prism 5"]');
  await expect(prismVideo).toHaveAttribute('preload', 'auto');
  await expect.poll(() => prismVideo.evaluate(video => {
    const element = video as HTMLVideoElement;
    return !element.paused && element.currentTime > 0;
  })).toBe(true);
  await hero.getByRole('button', { name: 'Show King 45' }).click();
  await expect(hero.getByRole('heading', { name: 'King 45' })).toBeVisible();
  await expect(hero.getByRole('link', { name: 'Shop Now' })).toHaveAttribute('href', '/pre-builts/PRD-000360');
  const kingVideo = hero.locator('video[data-hero-video="King 45"]');
  await expect(kingVideo).toHaveAttribute('preload', 'auto');
  await expect.poll(() => kingVideo.evaluate(video => {
    const element = video as HTMLVideoElement;
    return !element.paused && element.currentTime > 0;
  })).toBe(true);
  const featureSlides = [
    ['Bottleneck Analysis', 'Open Builder', '/builder'],
    ['Buildbot Build Critique', 'Sign In to Review', '/signin?returnTo=%2Fbuilder'],
    ['Instant AI Build Generation', 'Sign In to Start', '/signin'],
  ] as const;
  for (const [name, action, href] of featureSlides) {
    await hero.getByRole('button', { name: `Show ${name}` }).click();
    await expect(hero.getByRole('heading', { name })).toBeVisible();
    await expect(hero.getByRole('link', { name: action })).toHaveAttribute('href', href);
  }
  await expect(hero.getByRole('button')).toHaveCount(5);
  await expect(hero.getByRole('link', { name: /Build Your Dream PC/i })).toHaveAttribute('href', '/builder');
  await expect(hero.getByRole('link', { name: /Ship Ready Deals/i })).toHaveAttribute('href', '/parts');

  for (const name of ['prism5', 'king45']) {
    const response = await request.get(`${baseURL}/landing-video/${name}`, { headers: { Range: 'bytes=0-99' } });
    expect(response.status()).toBe(206);
    expect(response.headers()['content-type']).toContain('video/mp4');
    expect((await response.body()).byteLength).toBe(100);
  }
});

test('guest builder keeps compatibility browsing public and gates account actions', async ({ page }) => {
  await page.goto(`${baseURL}/builder`);
  await expect(page.getByRole('heading', { name: /Select PC Components/i })).toBeVisible();
  await page.getByRole('button', { name: 'Add to Build', exact: true }).first().click();
  await expect(page.getByRole('button', { name: 'Added to Build', exact: true }).first()).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('pc_builder_state'))).toContain('"');
  await expect(page.getByRole('link', { name: 'Sign in to use Buildbot chat' })).toHaveAttribute('href', '/signin?returnTo=%2Fbuilder');
  const reserve = page.getByRole('button', { name: 'Reserve Build' });
  if (await reserve.isVisible()) {
    await reserve.click();
    await expect(page).toHaveURL(/\/signin\?returnTo=%2Fbuilder$/);
    await page.goto(`${baseURL}/builder`);
  }
  await page.getByRole('button', { name: 'Analyze build' }).click();
  await expect(page).toHaveURL(/\/signin\?returnTo=%2Fbuilder$/);
});
