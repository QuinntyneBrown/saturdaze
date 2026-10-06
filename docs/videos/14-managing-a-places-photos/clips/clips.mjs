// Screen recordings for video 14 (tools/video-record/record-clips.mjs). Runs against
// Saturdaze Admin and the API with the admin demo data (tools/video-record/admin-demo).
// The clips build on each other: record them together, after a reset.
export const config = {
  baseURL: process.env.SD_ADMIN_URL ?? 'http://localhost:4300',
  apiURL: process.env.SD_API_URL ?? 'http://localhost:5100',
  viewport: { width: 1408, height: 792 },
};

const signedIn = (t) => t.signIn('admin@saturdaze.app');
export const setup = { place: signedIn, tiles: signedIn, 'make-primary': signedIn, edit: signedIn, remove: signedIn };

const tile = (t, text) => t.page.locator('sd-photo-tile', { hasText: text });
const dialog = (t) => t.page.locator('[role="dialog"]');

async function openPlace(t, search, name) {
  await t.go(`/places?q=${encodeURIComponent(search)}`);
  await t.wait(1200);
  await t.click(t.page.locator('.place-row', { hasText: name }));
  await t.page.waitForURL(/\/places\/[A-Za-z]+\//);
  await t.page.waitForLoadState('networkidle');
}

export const clips = {
  /** The Place photos screen: the header and the slot previews (L2-114). */
  async place(t) {
    await openPlace(t, 'bronte', 'Bronte Creek');
    await t.wait(2500);
    await t.hover(t.page.getByText(/weekend covers follow this place/), 3500);
    await t.scroll(120, 800);
    await t.hover(t.page.locator('sd-slot-preview').getByText('Idea card', { exact: false }).first(), 1500);
    await t.hover(t.page.locator('sd-slot-preview img').first(), 3000);
    await t.hover(t.page.locator('sd-slot-preview img').nth(1), 2000);
    await t.hover(t.page.locator('sd-slot-preview img').nth(2), 2500);
    await t.scroll(330, 1400);
    await t.hover(t.page.locator('sd-slot-preview img').nth(3), 4500);
  },

  /** One tile per photo, with its badges, details and actions. */
  async tiles(t) {
    await openPlace(t, 'bronte', 'Bronte Creek');
    await t.wait(800);
    await t.scroll(900, 1600);
    await t.wait(1200);
    await t.hover(tile(t, 'Wildflower meadow').locator('.photo-tile__badges'), 2500);
    await t.hover(tile(t, 'Wildflower meadow').locator('sd-details'), 3000);
    await t.hover(tile(t, 'Creek bed').locator('.photo-tile__badges'), 1800);
    await t.hover(tile(t, 'Boardwalk trail').getByRole('button', { name: 'Make primary' }), 1500);
    await t.hover(tile(t, 'Boardwalk trail').getByRole('button', { name: 'Edit' }), 1200);
    await t.hover(tile(t, 'Boardwalk trail').getByRole('button', { name: 'Remove' }), 1500);
  },

  /** Make primary states the cover impact before confirming (L2-117). */
  async 'make-primary'(t) {
    await openPlace(t, 'bronte', 'Bronte Creek');
    await t.wait(1000);
    await tile(t, 'Boardwalk trail').scrollIntoViewIfNeeded();
    await t.wait(1200);
    await t.click(tile(t, 'Boardwalk trail').getByRole('button', { name: 'Make primary' }));
    await dialog(t).waitFor();
    await t.wait(1500);
    await t.hover(dialog(t).locator('sd-well'), 2600);
    await t.click(dialog(t).getByRole('button', { name: 'Make primary' }));
    await dialog(t).waitFor({ state: 'detached' });
    await t.wait(2200);
    await t.hover(tile(t, 'Boardwalk trail').locator('.photo-tile__badges'), 1500);
    await t.scroll(-1400, 1600);
    await t.wait(3000);
  },

  /** Edit details: attribution and licence stay mandatory; alt text clears the flag (L2-118). */
  async edit(t) {
    await openPlace(t, 'science', 'Ontario Science Centre');
    await t.wait(1200);
    await tile(t, 'Throwaway618420').scrollIntoViewIfNeeded();
    await t.wait(800);
    await t.hover(tile(t, 'Throwaway618420').locator('.photo-tile__badges'), 2000);
    await t.click(tile(t, 'Throwaway618420').getByRole('button', { name: 'Edit' }));
    await dialog(t).waitFor();
    await t.wait(1500);
    await t.hover(dialog(t).getByText('The address cannot change'), 3000);
    const attribution = dialog(t).getByLabel('Attribution');
    await t.moveTo(attribution);
    await attribution.fill('');
    await t.wait(2500);
    await t.hover(dialog(t).getByRole('button', { name: 'Save changes' }), 1500);
    await t.type(attribution, 'Photo · Throwaway618420, Wikimedia Commons', 35);
    await t.hover(dialog(t).getByLabel('Licence'), 2500);
    await t.type(dialog(t).getByLabel('Alt text'), 'The Ontario Science Centre building on a winter day', 45);
    await t.wait(1200);
    await t.click(dialog(t).getByRole('button', { name: 'Save changes' }));
    await dialog(t).waitFor({ state: 'detached' });
    await t.wait(1500);
    await t.hover(tile(t, 'Throwaway618420').locator('.photo-tile__badges'), 2500);
  },

  /** Removing the primary makes you choose the next one (L2-119). */
  async remove(t) {
    await openPlace(t, 'bronte', 'Bronte Creek');
    await t.wait(800);
    await tile(t, 'Boardwalk trail').scrollIntoViewIfNeeded();
    await t.wait(1200);
    await t.click(tile(t, 'Boardwalk trail').getByRole('button', { name: 'Remove' }));
    await dialog(t).waitFor();
    await t.wait(2500);
    await t.hover(dialog(t).locator('.photo-pick__opt').nth(0), 1500);
    await t.hover(dialog(t).locator('.photo-pick__opt').nth(1), 1200);
    await t.click(dialog(t).locator('.photo-pick__opt', { hasText: 'Wildflower meadow' }));
    await t.wait(1200);
    await t.hover(dialog(t).locator('.hint'), 2000);
    await t.click(dialog(t).getByRole('button', { name: 'Remove photo' }));
    await dialog(t).waitFor({ state: 'detached' });
    await t.wait(2200);
    await t.scroll(-1400, 1600);
    await t.wait(2500);
  },
};
