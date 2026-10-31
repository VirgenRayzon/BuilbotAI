import { expect, test } from '@playwright/test';

const baseURL = process.env.E2E_BASE_URL || 'http://127.0.0.1:9002';

test('landing features the twelve highest priced catalog products before systems', async ({ page, request }) => {
  test.setTimeout(60000);
  const response = await request.get(`${baseURL}/api/featured-parts`);
  expect(response.ok()).toBe(true);
  const products = await response.json() as Array<{ productId: string; price: number }>;
  expect(products).toHaveLength(12);
  for (let index = 1; index < products.length; index++) {
    expect(products[index - 1].price).toBeGreaterThanOrEqual(products[index].price);
  }

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(baseURL);
  const section = page.getByRole('region', { name: 'Featured Products' });
  await section.scrollIntoViewIfNeeded();
  const links = section.locator('a[aria-label^="View "]');
  await expect(links).toHaveCount(12, { timeout: 45000 });
  expect(await links.evaluateAll(elements => elements.map(element => element.getAttribute('href'))))
    .toEqual(products.map(product => `/parts/${product.productId}`));
  await expect(section.getByRole('link', { name: 'View All' })).toHaveAttribute('href', '/parts');
  expect(await section.evaluate(element => {
    const systems = document.querySelector('#prebuilts');
    return systems ? Boolean(element.compareDocumentPosition(systems) & Node.DOCUMENT_POSITION_FOLLOWING) : false;
  })).toBe(true);
  expect(await links.first().evaluate(element => getComputedStyle(element.parentElement!.parentElement!).gridTemplateColumns.split(' ').length)).toBe(4);
  const firstImage = links.first().getByRole('img');
  await expect.poll(() => firstImage.evaluate(image => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  await section.screenshot({ path: 'test-results/featured-products-desktop.png' });

  await page.setViewportSize({ width: 390, height: 844 });
  expect(await links.first().evaluate(element => getComputedStyle(element.parentElement!.parentElement!).gridTemplateColumns.split(' ').length)).toBe(1);
});
