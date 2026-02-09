import { expect, test } from 'playwright/test';

test('language switch routes to Spanish locale', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  const switcher = page.locator('.language-switcher');
  await switcher.locator('summary').click();
  await expect(switcher).toHaveAttribute('open', '');
  await switcher.locator("a[href='/es/']").click();

  await expect(page).toHaveURL(/\/es\/$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Mueve USDT y USDC');
});

test('dark theme shows dark-logo variant and hides light variant', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.removeItem('theme');
  });

  await page.goto('/');
  const html = page.locator('html');
  await expect(html).not.toHaveClass(/dark/);

  const darkLogo = page.locator('.theme-dark-logo').first();
  const lightLogo = page.locator('.theme-light-logo').first();

  const beforeDarkDisplay = await darkLogo.evaluate((node) => getComputedStyle(node).display);
  expect(beforeDarkDisplay).toBe('none');

  await page.locator('[data-theme-toggle]').click();
  await expect(html).toHaveClass(/dark/);

  const afterDarkDisplay = await darkLogo.evaluate((node) => getComputedStyle(node).display);
  expect(afterDarkDisplay).not.toBe('none');

  const afterLightDisplay = await lightLogo.evaluate((node) => getComputedStyle(node).display);
  expect(afterLightDisplay).toBe('none');
});

test('route preview deep-link matches bridge prefill contract', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('[data-landing-swap]')).toBeVisible();
  const openLink = page.locator('[data-swap-open]');

  await expect
    .poll(async () => {
      const href = await openLink.getAttribute('href');
      if (!href) return null;
      return new URL(href).searchParams.get('direction');
    })
    .toMatch(/TRON_TO_EVM|EVM_TO_TRON/);

  const href = await openLink.getAttribute('href');
  expect(href).toBeTruthy();
  const url = new URL(href!);

  const direction = url.searchParams.get('direction');
  const chainId = url.searchParams.get('chainId');
  const token = url.searchParams.get('token');
  const tronToken = url.searchParams.get('tronToken');
  const amount = url.searchParams.get('amount');

  expect(direction).toBeTruthy();
  expect(chainId).toMatch(/^\d+$/);
  expect(token).toMatch(/USDT|USDC/);
  expect(tronToken).toMatch(/USDT|USDC/);
  expect(amount).toMatch(/^\d+(\.\d+)?$/);

  // Legacy alias keys are emitted to match bridge parser compatibility.
  expect(url.searchParams.get('dir')).toBe(direction);
  expect(url.searchParams.get('chain')).toBe(chainId);
  expect(url.searchParams.get('asset')).toBe(token);
  expect(url.searchParams.get('tron')).toBe(tronToken);
});
