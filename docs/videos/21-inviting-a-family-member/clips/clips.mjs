// Screen recordings for video 21 (tools/video-record/record-clips.mjs), against the family
// app and an API on a freshly reset database (tools/video-record/family-demo/README.md).
import { createFamily, people, PASSWORD } from '../../../../tools/video-record/family-demo/family.mjs';

export const config = {
  baseURL: process.env.SD_APP_URL ?? 'http://localhost:4200',
  apiURL: process.env.SD_API_URL ?? 'http://localhost:5100',
  viewport: { width: 1408, height: 792 },
};

const dialog = (t) => t.page.locator('.cdk-overlay-container [role="dialog"]');

async function openAdd(t, name, age) {
  await t.click(t.page.getByText('Add a family member'));
  await dialog(t).waitFor();
  await t.wait(700);
  await t.type(dialog(t).getByLabel('Name'), name, 80);
  await t.type(dialog(t).getByLabel('Age'), String(age), 80);
}

export const setup = {
  async invite(t) {
    await createFamily([{ name: 'Mae', age: 5 }]);
    await t.signIn(people.alex, PASSWORD);
    await t.go('/family');
  },
  async refusals(t) {
    await t.signIn(people.alex, PASSWORD);
    await t.go('/family');
  },
};

export const clips = {
  /** Invite to sign in: the email field, Send invite, D30 and the row (L2-126 #6). */
  async invite(t) {
    await t.wait(1200);
    await openAdd(t, 'Jordan', 37);
    await t.click(dialog(t).getByRole('radio', { name: 'Invite to sign in' }));
    await t.wait(1200);
    await t.hover(dialog(t).getByText("They'll choose their own password from the invite link."), 2200);
    await t.hover(dialog(t).getByRole('button', { name: 'Send invite' }), 1800);
    await t.type(dialog(t).getByLabel('Email'), people.jordan, 45);
    await t.click(dialog(t).getByRole('button', { name: 'Send invite' }));
    await t.page.getByText('Invite ready for Jordan').waitFor();
    await t.wait(1500);
    await t.hover(dialog(t).locator('.copy-field__value'), 3000);
    await t.click(dialog(t).getByRole('button', { name: 'Copy link' }));
    await t.wait(1800);
    await t.hover(dialog(t).getByText('Expires in 7 days'), 2200);
    await t.click(dialog(t).getByRole('button', { name: 'Done' }));
    await dialog(t).waitFor({ state: 'detached' });
    await t.wait(600);
    await t.hover(t.page.getByText(`Invite sent to ${people.jordan}`), 3500);
  },

  /** Two refusals: an address that already signs in, and one already invited (L2-126 #3, #4). */
  async refusals(t) {
    await t.wait(1000);
    await openAdd(t, 'Sam', 41);
    await t.click(dialog(t).getByRole('radio', { name: 'Invite to sign in' }));
    await t.type(dialog(t).getByLabel('Email'), 'quinntynebrown@gmail.com', 40);
    await t.click(dialog(t).getByRole('button', { name: 'Send invite' }));
    const banner = t.page.locator('sd-banner.error');
    await banner.waitFor();
    await t.wait(500);
    await t.hover(banner, 3500);
    await openAdd(t, 'Jo', 37);
    await t.click(dialog(t).getByRole('radio', { name: 'Invite to sign in' }));
    await t.type(dialog(t).getByLabel('Email'), people.jordan, 40);
    await t.click(dialog(t).getByRole('button', { name: 'Send invite' }));
    await t.page.getByText('That email already has an invite to this family.').waitFor();
    await t.wait(500);
    await t.hover(banner, 3800);
  },
};
