// Screen recordings for video 16 (tools/video-record/record-clips.mjs). Runs against
// Saturdaze Admin and the API with the admin demo data (tools/video-record/admin-demo).
// The clips build on each other: record them together, after a reset.
import { IMAGE_HOST, stageIngestionRun } from '../../../../tools/video-record/admin-demo/demo-env.mjs';

export const config = {
  baseURL: process.env.SD_ADMIN_URL ?? 'http://localhost:4300',
  apiURL: process.env.SD_API_URL ?? 'http://localhost:5100',
  viewport: { width: 1408, height: 792 },
};

const item = (t, name) => t.page.locator('article.review-item', { hasText: name });
const dialog = (t) => t.page.locator('[role="dialog"]');

export const setup = {
  queue: (t) => t.signIn('admin@saturdaze.app'),
  reject: (t) => t.signIn('admin@saturdaze.app'),
  skips: async (t) => {
    // What ingestion's next restaurants pass writes when it meets the rejected address
    // again (CatalogUpserter). Only a live Claude run would produce it, so it is staged.
    stageIngestionRun({
      type: 'Restaurants',
      skips: [
        `La Marina: photo ${IMAGE_HOST}/provider/lighthouse.jpg skipped, previously rejected`,
        'Snug Harbour: photo https://media.example.org/snug-patio.jpg skipped, missing attribution or licence',
      ],
    });
    await t.signIn('admin@saturdaze.app');
  },
};

export const clips = {
  /** The queue: each provider photo beside what it would replace; Keep and Make primary (L2-120). */
  async queue(t) {
    await t.go('/');
    await t.wait(1200);
    await t.click(t.page.getByRole('link', { name: /Review 4 new photos/ }));
    await t.page.waitForURL(/\/reviews/);
    await t.page.waitForLoadState('networkidle');
    await t.wait(2000);
    await t.hover(item(t, 'Royal Botanical').locator('figure').nth(0), 2000);
    await t.hover(item(t, 'Royal Botanical').locator('figure').nth(1), 2000);
    await t.hover(item(t, 'La Marina').locator('figure').nth(1), 2500);
    await t.hover(item(t, 'Royal Botanical').locator('.review-item__link'), 2000);
    await t.hover(item(t, 'Royal Botanical').locator('.card__meta'), 2000);
    await t.scroll(300, 900);
    await t.click(item(t, 'Snug Harbour').getByRole('button', { name: 'Keep' }));
    await item(t, 'Snug Harbour').waitFor({ state: 'detached' });
    await t.wait(1800);
    await t.click(item(t, 'Royal Botanical').getByRole('button', { name: 'Make primary' }));
    await dialog(t).waitFor();
    await t.wait(1200);
    await t.hover(dialog(t).locator('sd-well'), 2200);
    await t.click(dialog(t).getByRole('button', { name: 'Make primary' }));
    await item(t, 'Royal Botanical').waitFor({ state: 'detached' });
    await t.wait(2200);
  },

  /** Reject with a reason: the row goes and the address is remembered (L2-120 AC3, AC4). */
  async reject(t) {
    await t.go('/reviews');
    await t.wait(1500);
    await t.hover(item(t, 'La Marina').locator('figure').nth(0), 2000);
    await t.click(item(t, 'La Marina').getByRole('button', { name: 'Reject' }));
    await dialog(t).waitFor();
    await t.wait(1500);
    await t.type(dialog(t).getByLabel('Reason'), 'Wrong venue: this is the Port Credit lighthouse, not the restaurant', 35);
    await t.wait(800);
    await t.click(dialog(t).getByRole('button', { name: 'Reject' }));
    await item(t, 'La Marina').waitFor({ state: 'detached' });
    await t.wait(1800);
    await t.click(item(t, 'Toronto Zoo').getByRole('button', { name: 'Keep' }));
    await t.page.getByText('Nothing to review').waitFor();
    await t.wait(2800);
  },

  /** Ingestion photo skips, read-only, linking places that exist (L2-120 AC5, L2-121 AC1). */
  async skips(t) {
    await t.go('/');
    await t.wait(800);
    await t.click(t.page.locator('.admin-nav__link', { hasText: 'Ingestion skips' }));
    await t.page.waitForLoadState('networkidle');
    await t.wait(2000);
    await t.hover(t.page.locator('.skip', { hasText: 'previously rejected' }), 3000);
    await t.hover(t.page.locator('.skip', { hasText: 'snug-patio' }), 2000);
    await t.hover(t.page.locator('.skip', { hasText: 'Harbourfront Splash Pad' }), 2500);
    await t.click(t.page.locator('.skip', { hasText: 'previously rejected' }).getByRole('link', { name: 'La Marina' }));
    await t.page.waitForURL(/\/places\/Restaurant\//);
    await t.page.waitForLoadState('networkidle');
    await t.wait(1500);
    await t.scroll(700, 1400);
    await t.wait(2500);
  },
};
