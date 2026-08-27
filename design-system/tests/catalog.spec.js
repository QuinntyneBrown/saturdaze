import { expect, test } from '@playwright/test';

const selectors = [
  'sd-icon', 'sd-icon-button', 'sd-button', 'sd-chip', 'sd-section',
  'sd-tag-group', 'sd-list-item', 'sd-top-bar', 'sd-bottom-nav', 'sd-hero',
  'sd-weather-strip', 'sd-weather-day', 'sd-day-card', 'sd-anticipate',
  'sd-split-view', 'sd-timeline-block', 'sd-activity-card', 'sd-avatar',
  'sd-vote-row', 'sd-restaurant-card', 'sd-saved-card', 'sd-empty',
  'sd-event-card', 'sd-text-input', 'sd-card', 'sd-toggle', 'sd-dialog',
  'sd-auth-shell', 'sd-auth-card',
];

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Warm, useful interfaces for weekends together.' })).toBeVisible();
});

test('home presents complete live catalog coverage', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Warm, useful interfaces for weekends together.' })).toBeVisible();
  const coverage = page.getByLabel('Catalog coverage');
  await expect(coverage.getByText('29', { exact: true })).toBeVisible();
  await expect(coverage.getByText('18', { exact: true })).toBeVisible();
  await expect(coverage.getByText('40', { exact: true })).toBeVisible();
  await expect(page.locator('[data-component-card]')).toHaveCount(3);
  await expect(page.locator('[data-pattern-card]')).toHaveCount(3);
  await expect(page.locator('[data-dialog-card]')).toHaveCount(3);
});

test('component index renders and upgrades all public components', async ({ page }) => {
  await page.goto('/components');
  await expect(page.locator('[data-component-card]')).toHaveCount(29);
  for (const selector of selectors) {
    await expect(page.locator(`[data-component-card="${selector}"]`)).toHaveCount(1);
    await expect.poll(() => page.evaluate(name => Boolean(customElements.get(name)), selector)).toBe(true);
  }
  await expect(page.locator('[data-component-card] .card-preview').filter({ has: page.locator(':scope > *') })).toHaveCount(29);
});

test('component details provide overview, API, examples, and live playground', async ({ page }) => {
  await page.goto('/components/sd-button/overview');
  await expect(page.getByRole('heading', { name: 'Button', level: 1 })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Page sections' }).getByText('Overview')).toHaveClass(/active/);

  await page.getByRole('link', { name: 'API' }).click();
  await expect(page).toHaveURL(/\/components\/sd-button\/api$/);
  await expect(page.getByRole('heading', { name: 'Attributes' })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'variant' })).toBeVisible();

  await page.getByRole('link', { name: 'Examples' }).click();
  const playground = page.locator('[data-playground]');
  await expect(playground).toBeVisible();
  await playground.locator('[data-control="variant"]').selectOption('danger');
  await expect(playground.locator('[data-playground-preview] > sd-button')).toHaveAttribute('variant', 'danger');
  await expect(playground.locator('[data-code-panel] code')).toContainText('variant="danger"');
  await playground.locator('[data-control="disabled"]').check();
  await expect(playground.locator('[data-playground-preview] > sd-button')).toHaveAttribute('disabled', '');
  await playground.getByRole('button', { name: 'Reset' }).click();
  await expect(playground.locator('[data-playground-preview] > sd-button')).not.toHaveAttribute('variant', 'danger');
});

test('foundations visibly render every foundation family and icon', async ({ page }) => {
  await page.goto('/foundations');
  for (const heading of ['Color', 'Typography', 'Spacing', 'Shape & elevation', 'Motion & breakpoints', 'Icons']) {
    await expect(page.getByRole('heading', { name: heading })).toBeVisible();
  }
  await expect(page.locator('.token-card')).toHaveCount(18);
  await expect(page.locator('.icon-card')).toHaveCount(39);
});

test('all dialog families and product-action variants are rendered', async ({ page }) => {
  await page.goto('/dialogs');
  await expect(page.locator('[data-dialog-card]')).toHaveCount(7);
  await expect(page.locator('[data-dialog-card] sd-dialog[static][open]')).toHaveCount(7);

  await page.goto('/dialogs/product-action/examples');
  await expect(page.locator('.dialog-example')).toHaveCount(12);
  await expect(page.locator('.dialog-example sd-dialog[static][open]')).toHaveCount(12);
  await expect(page.getByRole('heading', { name: 'Calendar export' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Share fallback' })).toBeVisible();
});

test('live dialogs trap interaction, close with Escape, and restore focus', async ({ page }) => {
  await page.goto('/dialogs/sign-out/examples');
  const launch = page.getByRole('button', { name: 'Launch live' });
  await launch.click();
  await expect(page.getByRole('dialog', { name: 'Sign out?' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'Sign out?' })).toHaveCount(0);
  await expect(launch).toBeFocused();

  await launch.click();
  await page.locator('#dialog-host sd-dialog').evaluate(element => element.shadowRoot.querySelector('.scrim').click());
  await expect(page.getByRole('dialog', { name: 'Sign out?' })).toHaveCount(0);
  await expect(launch).toBeFocused();
});

test('all pattern families and declared states have responsive renderings', async ({ page }) => {
  await page.goto('/patterns');
  await expect(page.locator('[data-pattern-card]')).toHaveCount(8);
  await expect(page.locator('[data-pattern-card] iframe')).toHaveCount(8);

  await page.goto('/patterns/authentication/examples');
  await expect(page.locator('.pattern-card')).toHaveCount(15);
  await expect(page.locator('.pattern-card iframe')).toHaveCount(15);
  const first = page.locator('.pattern-card').first();
  await first.getByRole('button', { name: 'Mobile viewport' }).click();
  await expect(first.locator('iframe')).toHaveAttribute('data-viewport', 'mobile');
  await first.getByRole('button', { name: 'Tablet viewport' }).click();
  await expect(first.locator('iframe')).toHaveAttribute('data-viewport', 'tablet');
});

test('global search finds and opens components, dialogs, and patterns', async ({ page }) => {
  const search = page.getByRole('searchbox', { name: 'Search documentation' });
  await search.fill('restaurant');
  await expect(page.locator('#search-results')).toBeVisible();
  await expect(page.locator('#search-results .search-result')).toHaveCount(2);
  await page.locator('#search-results .search-result').first().click();
  await expect(page).toHaveURL(/\/components\/sd-restaurant-card\/overview$/);
  await expect(page.getByRole('heading', { name: 'Restaurant card', level: 1 })).toBeVisible();
});

test('deep links and isolated previews load directly', async ({ page }) => {
  await page.goto('/components/sd-dialog/api');
  await expect(page.getByRole('heading', { name: 'Dialog', level: 1 })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Attributes' })).toBeVisible();

  await page.goto('/preview.html?type=pattern&item=weekend-overview&scenario=default');
  await expect(page.locator('.product-screen')).toBeVisible();
  await expect(page.locator('sd-hero')).toBeVisible();
});

test('has no console, request, route, or horizontal-layout failures', async ({ page }) => {
  const errors = [];
  const failedRequests = [];
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', error => errors.push(error.message));
  page.on('requestfailed', request => {
    if (!request.failure()?.errorText.includes('ERR_ABORTED')) failedRequests.push(request.url());
  });
  for (const route of ['/', '/components', '/dialogs', '/patterns', '/foundations', '/components/sd-button/examples']) {
    await page.goto(route);
    await page.waitForLoadState('networkidle');
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(await page.evaluate(() => innerWidth));
  }
  expect(errors).toEqual([]);
  expect(failedRequests).toEqual([]);
});

test('mobile documentation navigation is keyboard operable', async ({ page, viewport }) => {
  test.skip(viewport?.width !== 390);
  const menu = page.locator('#menu');
  const nav = page.locator('#docs-nav');
  await menu.press('Enter');
  await expect(menu).toHaveAttribute('aria-expanded', 'true');
  await expect(nav).toHaveClass(/open/);
  await nav.getByRole('link', { name: 'Foundations' }).click();
  await expect(nav).not.toHaveClass(/open/);
  await menu.press('Enter');
  await page.keyboard.press('Escape');
  await expect(nav).not.toHaveClass(/open/);
  await expect(menu).toBeFocused();
});
