import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';

type Entry = { id: string; title: string; name: string; type: 'story' | 'docs' };
const entries: Entry[] = Object.values(JSON.parse(readFileSync(
  resolve(__dirname, '../../frontend/dist/storybook/index.json'), 'utf8',
)).entries);

test('every public Angular component has a default example and API documentation', () => {
  const publicApi = readFileSync(resolve(__dirname, '../../frontend/projects/components/src/public-api.ts'), 'utf8');
  const exports = [...publicApi.matchAll(/export \* from '\.\/(lib\/[^']+)'/g)];
  for (const [, module] of exports) {
    const source = readFileSync(resolve(__dirname, '../../frontend/projects/components/src', `${module}.ts`), 'utf8');
    if (!source.includes('@Component(')) continue;
    const component = source.match(/export class (\w+)/)?.[1];
    expect(component, module).toBeTruthy();
    const stories = entries.filter(entry => entry.title.replaceAll(' ', '') === `Components/${component}`);
    expect(stories.some(entry => entry.type === 'story' && entry.name === 'Default'), `${component} default`).toBe(true);
    expect(stories.some(entry => entry.type === 'docs'), `${component} docs`).toBe(true);
  }
  for (const section of ['Concepts', 'Theme', 'Patterns']) {
    expect(entries.some(entry => entry.title.startsWith(`${section}/`)), section).toBe(true);
  }
});

// Compile-time success does not prove Angular can instantiate a story. Visit
// every indexed example to catch template, provider and runtime failures.
for (const entry of entries) {
  test(`${entry.title}: ${entry.name}`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => {
      if (message.type() === 'error') errors.push(message.text());
    });
    await page.goto(`/iframe.html?id=${entry.id}&viewMode=${entry.type}`, { waitUntil: 'domcontentloaded' });
    const root = page.locator(entry.type === 'docs' ? '#storybook-docs' : '#storybook-root');
    // Icon-only stories legitimately have no textContent.
    await expect(root.locator(':scope > *').first()).toBeAttached();
    await expect(page.locator('body')).toHaveClass(/sb-show-main/);
    await expect(page.locator('.sb-errordisplay')).not.toBeVisible();
    expect(errors).toEqual([]);
  });
}

test('checkbox example updates its checked state', async ({ page }) => {
  await page.goto('/iframe.html?id=components-checkbox--default&viewMode=story', { waitUntil: 'domcontentloaded' });
  const checkbox = page.getByRole('checkbox');
  await expect(checkbox).toBeChecked();
  await checkbox.uncheck();
  await expect(checkbox).not.toBeChecked();
});
