// Screen recordings for video 15 (tools/video-record/record-clips.mjs). Runs against
// Saturdaze Admin and the API with the admin demo data (tools/video-record/admin-demo).
// SD_DEMO_PHOTOS is the folder of downloaded demo photos; SD_DEMO_IMAGE_HOST is the
// allow-listed HTTPS host that serves the same photos (the stand-in provider CDN).
// The clips build on each other: record them together, after a reset.
import { join, resolve } from 'node:path';

export const config = {
  baseURL: process.env.SD_ADMIN_URL ?? 'http://localhost:4300',
  apiURL: process.env.SD_API_URL ?? 'http://localhost:5100',
  viewport: { width: 1408, height: 792 },
};

const photos = resolve(process.env.SD_DEMO_PHOTOS ?? '.cache/admin-demo/www/provider');
const imageHost = process.env.SD_DEMO_IMAGE_HOST ?? 'https://localhost:5443';

const signedIn = (t) => t.signIn('admin@saturdaze.app');
export const setup = { upload: signedIn, refused: signedIn, url: signedIn };

const dialog = (t) => t.page.locator('[role="dialog"]');
const tile = (t, text) => t.page.locator('sd-photo-tile', { hasText: text });

async function openRiverwood(t) {
  await t.go('/places?q=riverwood');
  await t.wait(1000);
  await t.click(t.page.locator('.place-row', { hasText: 'Riverwood' }));
  await t.page.waitForURL(/\/places\/Activity\//);
  await t.page.waitForLoadState('networkidle');
}

export const clips = {
  /** A curated upload to a place with no photo becomes its primary (L2-115). */
  async upload(t) {
    await openRiverwood(t);
    await t.wait(1500);
    await t.scroll(500, 1200);
    await t.hover(t.page.getByText('No photos yet'), 2000);
    await t.scroll(-500, 900);
    await t.click(t.page.getByRole('button', { name: 'Upload photo' }));
    await dialog(t).waitFor();
    await t.wait(1200);
    await t.hover(dialog(t).getByRole('button', { name: 'Save photo' }), 1500);
    await t.moveTo(dialog(t).locator('.upload-drop'));
    await t.wait(600);
    await dialog(t).getByLabel('Choose a photo').setInputFiles(join(photos, 'riverwood.jpg'));
    await t.wait(1800);
    await t.type(dialog(t).getByLabel('Alt text'), 'Meadow and woods in the Credit River valley at Riverwood', 40);
    // Attribution and licence start as "Photo · Saturdaze" / "Saturdaze owned"; this one is not ours.
    const attribution = dialog(t).getByLabel('Attribution');
    await t.moveTo(attribution);
    await attribution.fill('');
    await t.wait(1500);
    await t.hover(dialog(t).getByRole('button', { name: 'Save photo' }), 1800);
    await t.type(attribution, 'Photo · Ryan Hodnett, Wikimedia Commons', 35);
    await t.moveTo(dialog(t).getByLabel('Licence'));
    await t.wait(500);
    await dialog(t).getByLabel('Licence').selectOption('CC BY-SA 4.0');
    await t.wait(1200);
    await t.click(dialog(t).getByRole('button', { name: 'Save photo' }));
    await dialog(t).waitFor({ state: 'detached' });
    await t.wait(2500);
    await t.scroll(400, 1200);
    await t.wait(2000);
    await t.scroll(500, 1200);
    await t.hover(tile(t, 'Meadow and woods').locator('.photo-tile__badges'), 2500);
  },

  /** A file that is not a photo is refused before anything is sent. */
  async refused(t) {
    await openRiverwood(t);
    await t.wait(800);
    await t.click(t.page.getByRole('button', { name: 'Upload photo' }));
    await dialog(t).waitFor();
    await t.moveTo(dialog(t).locator('.upload-drop'));
    await t.wait(800);
    await dialog(t).getByLabel('Choose a photo').setInputFiles({
      name: 'opening-hours.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.7\n'),
    });
    await t.wait(800);
    await t.hover(dialog(t).getByRole('alert'), 2500);
    await t.hover(dialog(t).getByRole('button', { name: 'Save photo' }), 1500);
    await t.click(dialog(t).getByRole('button', { name: 'Cancel' }));
    await t.wait(1000);
  },

  /** Add from URL: HTTPS on an allowed origin only, checked twice (L2-116). */
  async url(t) {
    await openRiverwood(t);
    await t.wait(800);
    await t.click(t.page.getByRole('button', { name: 'Add from URL' }));
    await dialog(t).waitFor();
    await t.wait(1200);
    const url = dialog(t).getByLabel('Image URL');
    await t.type(url, 'http://localhost:5443/provider/riverwood-path.jpg', 30);
    await t.wait(400);
    await t.type(dialog(t).getByLabel('Alt text'), 'Spring path through the Riverwood woods', 35);
    await t.type(dialog(t).getByLabel('Attribution'), 'Photo · Ryan Hodnett, Wikimedia Commons', 30);
    await dialog(t).getByLabel('Licence').selectOption('CC BY-SA 4.0');
    await t.hover(dialog(t).getByText("This address isn't on the image allow-list."), 2200);
    await t.hover(dialog(t).getByRole('button', { name: 'Save photo' }), 1200);

    await url.fill('');
    await t.type(url, 'https://elsewhere.example.net/riverwood-path.jpg', 30);
    await t.wait(800);
    await t.click(dialog(t).getByRole('button', { name: 'Save photo' }));
    await dialog(t).getByText("This address isn't on the image allow-list.").waitFor();
    await t.wait(2200);

    await url.fill('');
    await t.type(url, `${imageHost}/provider/riverwood-path.jpg`, 30);
    await t.wait(800);
    await t.click(dialog(t).getByRole('button', { name: 'Save photo' }));
    await dialog(t).waitFor({ state: 'detached' });
    await t.wait(1500);
    await t.scroll(900, 1500);
    await t.hover(tile(t, 'Spring path').locator('.photo-tile__badges'), 2200);
    await t.hover(tile(t, 'Meadow and woods').locator('.photo-tile__badges'), 2200);
  },
};
