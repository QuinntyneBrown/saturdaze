// Screen recordings for video 21 (tools/video-record/record-clips.mjs). Runs against
// Saturdaze Admin and the API with the email template demo data (tools/video-record/email-demo).
// Record after a reset: the clips change statuses, delete a template and save a revision.
import { idOf, token } from '../../../../tools/video-record/email-demo/demo-env.mjs';

export const config = {
  baseURL: process.env.SD_ADMIN_URL ?? 'http://localhost:4300',
  apiURL: process.env.SD_API_URL ?? 'http://localhost:5100',
  viewport: { width: 1408, height: 792 },
};

/** Off camera: sign in and open a template's editor by its key, so the clip starts on it. */
const editorOf = (key) => async (t) => {
  await t.signIn('admin@saturdaze.app');
  await t.go(`/email-templates/${await idOf(await token('admin@saturdaze.app'), key)}`);
  await t.wait(600);
};

export const setup = {
  lifecycle: editorOf('occasion.holidays'),
  system: editorOf('account.verify-email'),
  delete: editorOf('promo.spring-sale'),
  history: editorOf('notify.weekend-ready'),
};

const header = (t) => t.page.locator('.page-header');
const action = (t, name) => header(t).getByRole('button', { name, exact: true });
const dialog = (t) => t.page.locator('[role="dialog"], [role="alertdialog"]');

export const clips = {
  /** Draft → Active → Archived → Draft, each a new version (L2-129 AC5). */
  async lifecycle(t) {
    await t.wait(1000);
    await t.hover(t.page.locator('.template-status'), 1800);
    await t.hover(t.page.locator('.page-header__subtitle'), 1600);
    await t.click(action(t, 'Activate'));
    await t.page.waitForLoadState('networkidle');
    await t.wait(1000);
    await t.hover(t.page.locator('.template-status'), 1600);
    await t.hover(t.page.locator('.page-header__subtitle'), 1600);
    await t.click(action(t, 'Archive'));
    await t.page.waitForLoadState('networkidle');
    await t.wait(1000);
    await t.hover(t.page.locator('.template-status'), 1800);
    await t.click(action(t, 'Restore as draft'));
    await t.page.waitForLoadState('networkidle');
    await t.wait(1000);
    await t.hover(t.page.locator('.template-status'), 1600);
    await t.hover(t.page.locator('.page-header__subtitle'), 2200);
  },

  /** A system template offers neither Archive nor Delete (L2-129 AC6). */
  async system(t) {
    await t.wait(1000);
    await t.hover(t.page.locator('.template-status'), 1800);
    await t.hover(action(t, 'Save changes'), 900);
    await t.hover(action(t, 'History'), 900);
    await t.hover(action(t, 'Duplicate'), 1400);
    await t.hover(t.page.locator('.template-note'), 2800);
  },

  /** Delete confirms in AD8, then returns to the list (L2-129 AC7). */
  async delete(t) {
    await t.wait(1000);
    await t.hover(t.page.locator('.template-status'), 1600);
    await t.click(action(t, 'Delete'));
    await dialog(t).waitFor();
    await t.wait(1500);
    await t.hover(dialog(t).locator('.dialog__title'), 1600);
    await t.hover(dialog(t).locator('.dialog__sub'), 2000);
    await t.hover(dialog(t).locator('sd-well'), 2600);
    await t.click(dialog(t).getByRole('button', { name: 'Delete template' }));
    await t.page.waitForURL(/\/email-templates$/);
    await t.page.waitForLoadState('networkidle');
    await t.wait(1600);
    await t.hover(t.page.locator('.template-list'), 2400);
  },

  /** History lists every revision; an old one loads into the editor unsaved (L2-130). */
  async history(t) {
    await t.wait(1000);
    await t.hover(t.page.locator('.page-header__subtitle'), 1600);
    await t.click(action(t, 'History'));
    await dialog(t).locator('.revision').first().waitFor();
    await t.wait(1400);
    const rows = dialog(t).locator('.revision');
    for (let i = 0; i < 4; i++) await t.hover(rows.nth(i).locator('.revision__meta'), 1500);
    await t.click(dialog(t).getByRole('button', { name: 'Load version 1 into the editor' }));
    await dialog(t).waitFor({ state: 'detached' });
    await t.wait(1000);
    await t.hover(t.page.locator('.email-editor__form').getByRole('textbox', { name: /^Subject\b/ }), 1800);
    await t.hover(t.page.locator('.template-status'), 1600);
    await t.click(action(t, 'Save changes'));
    await t.page.waitForLoadState('networkidle');
    await t.wait(1000);
    await t.hover(t.page.locator('.page-header__subtitle'), 1600);
    await t.click(action(t, 'History'));
    await dialog(t).locator('.revision').first().waitFor();
    await t.wait(1000);
    await t.hover(dialog(t).locator('.revision').first(), 2600);
  },
};
