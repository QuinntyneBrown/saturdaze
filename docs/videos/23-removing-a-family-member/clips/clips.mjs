// Screen recordings for video 23 (tools/video-record/record-clips.mjs), against the family
// app and an API on a freshly reset database (tools/video-record/family-demo/README.md).
import { accept, createFamily, invite, people, PASSWORD, remove } from '../../../../tools/video-record/family-demo/family.mjs';

export const config = {
  baseURL: process.env.SD_APP_URL ?? 'http://localhost:4200',
  apiURL: process.env.SD_API_URL ?? 'http://localhost:5100',
  viewport: { width: 1408, height: 792 },
};

const dialog = (t) => t.page.locator('.cdk-overlay-container [role="dialog"]');

/** Alex's bearer, for the removal the last clip makes from "another device". */
let owner;

export const setup = {
  async 'remove-invited'(t) {
    owner = await createFamily([{ name: 'Mae', age: 5 }]);
    await accept((await invite(owner, 'Jordan', 37, people.jordan)).token);
    await accept((await invite(owner, 'Rosa', 68, people.rosa)).token);
    await invite(owner, 'Theo', 31, people.theo);
    await t.signIn(people.alex, PASSWORD);
    await t.go('/family');
  },
  async 'remove-account'(t) {
    await t.signIn(people.alex, PASSWORD);
    await t.go('/family');
  },
  async 'signed-out'(t) {
    await t.signIn(people.jordan, PASSWORD);
    await t.go('/family');
  },
};

async function removeFromDialog(t, name, hint) {
  await t.click(t.page.locator('sd-section', { hasText: "Who's in" }).getByText(name, { exact: true }));
  await dialog(t).waitFor();
  await t.wait(900);
  await t.hover(dialog(t).getByText(hint), 2600);
  await t.click(dialog(t).getByRole('button', { name: 'Remove' }));
  await t.page.getByText(`Remove ${name} from the family?`).waitFor();
  await t.wait(900);
  await t.hover(dialog(t).locator('.dialog__sub'), 3200);
  await t.click(dialog(t).getByRole('button', { name: 'Remove' }));
  await dialog(t).waitFor({ state: 'detached' });
  await t.page.locator('sd-section', { hasText: "Who's in" }).getByText(name, { exact: true }).waitFor({ state: 'detached' });
  await t.wait(2500);
}

export const clips = {
  /** Remove an invited member: the invitation goes with them (L2-128 #2, #7). */
  async 'remove-invited'(t) {
    await t.wait(1500);
    await t.hover(t.page.getByText(`Invite sent to ${people.theo}`), 2200);
    await removeFromDialog(t, 'Theo', `Invite sent to ${people.theo}`);
  },

  /** Remove a member who signs in: their account goes with them (L2-128 #3, #7). */
  async 'remove-account'(t) {
    await t.wait(1200);
    await t.hover(t.page.getByText(`Signs in as ${people.rosa}`), 2200);
    await removeFromDialog(t, 'Rosa', `Signs in as ${people.rosa}`);
  },

  /** Jordan's open session ends the moment Alex removes Jordan elsewhere (L2-128 #3). */
  async 'signed-out'(t) {
    await t.wait(1500);
    await t.hover(t.page.getByText(`Signs in as ${people.jordan}`), 2500);
    await remove(owner, 'Jordan');
    await t.wait(1500);
    await t.click(t.page.getByRole('link', { name: 'Weekend' }).first());
    await t.page.waitForURL(/\/sign-in/);
    await t.page.waitForLoadState('networkidle');
    await t.wait(1800);
    await t.type(t.page.getByLabel('Email'), people.jordan, 35);
    await t.type(t.page.getByLabel('Password', { exact: true }), PASSWORD, 40);
    await t.click(t.page.getByRole('button', { name: 'Sign in' }));
    await t.page.locator('[role="alert"]').first().waitFor();
    await t.wait(500);
    await t.hover(t.page.locator('[role="alert"]').first(), 3500);
  },
};
