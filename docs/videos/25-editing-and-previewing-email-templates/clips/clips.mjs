// Screen recordings for video 25 (tools/video-record/record-clips.mjs). Runs against
// Saturdaze Admin and the API with the email template demo data (tools/video-record/email-demo).
// Record after a reset: `editor` saves a template and `stale` saves one behind the editor's back.
import { CURATOR, idOf, save, token } from '../../../../tools/video-record/email-demo/demo-env.mjs';

export const config = {
  baseURL: process.env.SD_ADMIN_URL ?? 'http://localhost:4300',
  apiURL: process.env.SD_API_URL ?? 'http://localhost:5100',
  viewport: { width: 1408, height: 792 },
};

/** Off camera: sign in and open a template's editor by its key, so the clip starts on it. */
const editorOf = (key) => async (t) => {
  await t.signIn('admin@saturdaze.app');
  const bearer = await token('admin@saturdaze.app');
  await t.go(`/email-templates/${await idOf(bearer, key)}`);
  await t.wait(600);
};

export const setup = {
  editor: editorOf('notify.weekend-ready'),
  preview: editorOf('notify.weekend-ready'),
  refused: editorOf('schedule.weekly-digest'),
  required: editorOf('account.password-reset'),
  stale: editorOf('occasion.holidays'),
};

const form = (t) => t.page.locator('.email-editor__form');
const field = (t, label) => form(t).getByRole('textbox', { name: new RegExp(`^${label}\\b`) });
const preview = (t) => t.page.locator('.email-preview');
const header = (t) => t.page.locator('.page-header');

/** Types at the end of a field's current text. */
async function append(t, locator, text, delay = 45) {
  await t.moveTo(locator);
  await t.wait(250);
  await locator.click();
  await t.page.keyboard.press('Control+End');
  await locator.pressSequentially(text, { delay });
}

/** Replaces a field's text by typing. */
async function retype(t, locator, text, delay = 45) {
  await t.moveTo(locator);
  await locator.fill('');
  await t.wait(300);
  await locator.pressSequentially(text, { delay });
}

export const clips = {
  /** The editor: header, form, sample data, Save only when something changed (L2-133). */
  async editor(t) {
    await t.wait(1200);
    await t.hover(t.page.locator('.page-header__subtitle'), 2200);
    await t.hover(t.page.locator('.template-status'), 1400);
    await t.hover(header(t).getByRole('button', { name: 'Save changes' }), 1800);
    await retype(t, field(t, 'Subject'), '{{recipientName}}, your weekend is planned', 55);
    await t.wait(1200);
    await t.hover(t.page.locator('.template-status'), 1600);
    await t.hover(preview(t).locator('.email-preview__subject'), 2000);
    await append(t, field(t, 'Preheader'), ' Out the door by {{startTime}}.', 55);
    await t.wait(800);
    await t.scroll(900, 1600);
    await t.wait(600);
    const sample = form(t).locator('.email-editor__samples').getByLabel('startTime', { exact: true });
    await t.type(sample, '9:30 on Saturday', 70);
    await t.wait(1200);
    await t.scroll(-1200, 1400);
    await t.hover(preview(t).locator('.email-preview__preheader'), 1800);
    await t.click(header(t).getByRole('button', { name: 'Save changes' }));
    await t.page.waitForLoadState('networkidle');
    await t.wait(1200);
    await t.hover(t.page.locator('.page-header__subtitle'), 2600);
  },

  /** The preview: inbox line, desktop and phone widths, plain text, placeholder sources (L2-134). */
  async preview(t) {
    await t.wait(1000);
    await t.hover(preview(t).locator('.email-preview__inbox'), 2000);
    await t.hover(preview(t).locator('iframe'), 2200);
    await t.click(preview(t).getByRole('radio', { name: 'Phone', exact: true }));
    await t.wait(2600);
    await t.click(preview(t).getByRole('radio', { name: 'Plain text', exact: true }));
    await t.wait(2800);
    await t.click(preview(t).getByRole('radio', { name: 'HTML', exact: true }));
    await t.click(preview(t).getByRole('radio', { name: 'Desktop', exact: true }));
    await t.wait(1000);
    await t.scroll(560, 1400);
    await t.wait(600);
    await t.hover(preview(t).locator('.email-preview__item').first(), 1800);
    await t.scroll(-560, 1000);
    await append(t, field(t, 'Subject'), ' {{giftCode}}', 70);
    await t.wait(900);
    await t.scroll(560, 1200);
    await t.hover(preview(t).locator('.email-preview__item', { hasText: 'giftCode' }), 3000);
  },

  /** A malformed placeholder and a script are refused, in the preview and on save (L2-133, L2-134). */
  async refused(t) {
    await t.wait(1000);
    await retype(t, field(t, 'Subject'), 'Hi {{ first name }}', 70);
    await t.wait(1200);
    await t.hover(preview(t).locator('.email-preview__error'), 3200);
    await retype(t, field(t, 'Subject'), 'Hi {{recipientName}}', 60);
    await t.wait(1200);
    await t.hover(preview(t).locator('.email-preview__subject'), 1500);
    await append(t, field(t, 'HTML body'), '\n<img src="x" onerror="alert(1)">', 45);
    await t.wait(1200);
    await t.hover(preview(t).locator('.email-preview__error'), 2600);
    await t.click(header(t).getByRole('button', { name: 'Save changes' }));
    await t.page.locator('.banner--warn[role="alert"], [role="alert"].banner--warn').first().waitFor().catch(() => {});
    await t.wait(800);
    await t.hover(t.page.locator('[role="alert"]').first(), 3200);
  },

  /** A system template keeps its link in both bodies (L2-133 AC5). */
  async required(t) {
    await t.wait(1000);
    await t.hover(t.page.locator('.template-note'), 3000);
    const text = field(t, 'Plain-text body');
    await text.scrollIntoViewIfNeeded();
    await t.wait(800);
    await retype(t, text, 'Hi {{recipientName}},\n\nOpen Saturdaze and choose "Forgot password" to reset it.\n\n{{appName}}', 30);
    await t.wait(800);
    await t.scroll(-2000, 1200);
    await t.click(header(t).getByRole('button', { name: 'Save changes' }));
    await t.page.locator('[role="alert"]').first().waitFor();
    await t.wait(600);
    await t.hover(t.page.locator('[role="alert"]').first(), 3400);
  },

  /** Someone else saved first: the save is refused and Reload brings their version (L2-133 AC2). */
  async stale(t) {
    await t.wait(1000);
    await t.hover(t.page.locator('.page-header__subtitle'), 2000);
    // The second curator saves while this editor is open.
    const jo = await token(CURATOR);
    const id = await idOf(jo, 'occasion.holidays');
    await save(jo, id, { subject: 'Happy holidays from all of us at {{appName}}' });
    await retype(t, field(t, 'Subject'), 'Season\'s greetings from {{appName}}', 60);
    await t.wait(700);
    await t.click(header(t).getByRole('button', { name: 'Save changes' }));
    await t.page.locator('[role="alert"]').first().waitFor();
    await t.wait(600);
    await t.hover(t.page.locator('[role="alert"]').first(), 2800);
    await t.click(t.page.locator('[role="alert"]').getByRole('button', { name: 'Reload' }));
    await t.page.waitForLoadState('networkidle');
    await t.wait(1000);
    await t.hover(field(t, 'Subject'), 2200);
    await t.hover(t.page.locator('.page-header__subtitle'), 2400);

  },
};
