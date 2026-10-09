// Screen recordings for video 19 (tools/video-record/record-clips.mjs). Runs against
// Saturdaze Admin and the API with the email template demo data (tools/video-record/email-demo).
// Record after a reset: the clips create templates.
export const config = {
  baseURL: process.env.SD_ADMIN_URL ?? 'http://localhost:4300',
  apiURL: process.env.SD_API_URL ?? 'http://localhost:5100',
  viewport: { width: 1408, height: 792 },
};

// Off camera: sign in and open the clip's first screen, so the recording starts on a loaded page.
const opened = (path) => async (t) => {
  await t.signIn('admin@saturdaze.app');
  await t.go(path);
};
export const setup = {
  list: opened('/'),
  new: opened('/email-templates'),
  taken: opened('/email-templates'),
  duplicate: opened('/email-templates'),
};

const row = (t, name) => t.page.locator('.template-row').filter({ has: t.page.locator('.list__title', { hasText: new RegExp(`^\\s*${name}\\s*$`) }) });
const dialog = (t) => t.page.locator('[role="dialog"]');
const field = (t, name) => dialog(t).getByRole('textbox', { name: new RegExp(`^${name}\\b`) });

async function select(t, label, option) {
  const box = t.page.getByLabel(label, { exact: true });
  await t.moveTo(box);
  await t.wait(500);
  await box.selectOption({ label: option });
  await t.page.waitForLoadState('networkidle');
}

export const clips = {
  /** The Email templates screen: rows, chips, filters and search (L2-125). */
  async list(t) {
    await t.wait(900);
    await t.click(t.page.locator('.admin-nav__link[data-nav="emails"]'));
    await t.page.waitForLoadState('networkidle');
    await t.wait(1800);
    await t.hover(row(t, 'Reset your password').locator('.template-row__chips'), 2600);
    await t.hover(row(t, 'Reset your password').locator('.template-row__updated'), 1800);
    await t.hover(row(t, 'Weekend plan is ready').locator('.template-row__chips'), 2000);
    await t.hover(row(t, 'Spring sale').locator('.template-row__chips'), 2000);
    await t.hover(row(t, 'Your weekly plan').locator('.template-row__key'), 1800);
    await select(t, 'Category', 'Account');
    await t.wait(2600);
    await select(t, 'Category', 'All categories');
    await select(t, 'Status', 'Draft');
    await t.wait(2600);
    await select(t, 'Status', 'All statuses');
    await t.type(t.page.getByLabel('Search', { exact: true }), 'reset', 90);
    await t.page.waitForLoadState('networkidle');
    await t.wait(2800);
  },

  /** New template: the key follows the name; a draft opens with starter content (L2-126). */
  async new(t) {
    await t.wait(1500);
    await t.click(t.page.getByRole('button', { name: 'New template' }));
    await dialog(t).waitFor();
    await t.wait(1600);
    await t.type(field(t, 'Name'), 'Birthday wishes', 110);
    await t.wait(900);
    await t.hover(field(t, 'Key'), 2400);
    const category = dialog(t).getByLabel('Category', { exact: true });
    await t.moveTo(category);
    await t.wait(500);
    await category.selectOption({ label: 'Special occasion' });
    await t.wait(1400);
    await t.type(field(t, 'Description'), 'On a family member\'s birthday, with ideas to celebrate.', 40);
    await t.wait(800);
    await t.click(dialog(t).getByRole('button', { name: 'Create template' }));
    await t.page.waitForURL(/\/email-templates\/[0-9a-f-]{36}$/);
    await t.page.waitForLoadState('networkidle');
    await t.wait(2200);
    await t.hover(t.page.locator('.page-header__subtitle'), 2200);
    await t.hover(t.page.locator('.template-status'), 1800);
    await t.scroll(420, 1400);
    await t.wait(2600);
  },

  /** A key that is taken is refused in the dialog (L2-126 AC4). */
  async taken(t) {
    await t.wait(1200);
    await t.click(t.page.getByRole('button', { name: 'New template' }));
    await dialog(t).waitFor();
    await t.wait(1000);
    await t.type(field(t, 'Name'), 'Reset reminder', 90);
    await t.wait(600);
    const key = field(t, 'Key');
    await t.moveTo(key);
    await key.fill('');
    await t.type(key, 'account.password-reset', 70);
    await t.wait(600);
    await t.click(dialog(t).getByRole('button', { name: 'Create template' }));
    await dialog(t).locator('[role="alert"]').waitFor();
    await t.wait(800);
    await t.hover(dialog(t).locator('[role="alert"]'), 3200);
  },

  /** Duplicate: a new draft with the content, the category fixed, no system flag (L2-126 AC3). */
  async duplicate(t) {
    await t.wait(1200);
    await t.click(row(t, 'Verify your email').locator('a.list__item'));
    await t.page.waitForLoadState('networkidle');
    await t.wait(1800);
    await t.hover(t.page.locator('.template-status'), 1800);
    await t.click(t.page.getByRole('button', { name: 'Duplicate' }));
    await dialog(t).waitFor();
    await t.wait(1600);
    await t.hover(field(t, 'Name'), 1500);
    await t.hover(dialog(t).getByLabel('Category', { exact: true }), 2200);
    const key = field(t, 'Key');
    await t.moveTo(key);
    await key.fill('');
    await t.type(key, 'account.verify-email-friendly', 70);
    await t.wait(700);
    await t.click(dialog(t).getByRole('button', { name: 'Create template' }));
    await t.page.waitForURL((url) => !url.pathname.endsWith('/email-templates'));
    await t.page.waitForLoadState('networkidle');
    await t.wait(1800);
    await t.hover(t.page.locator('.page-header__subtitle'), 2000);
    await t.hover(t.page.locator('.template-status'), 2400);
  },
};
