// Screen recordings for video 22 (tools/video-record/record-clips.mjs), against the family
// app and an API on a freshly reset database (tools/video-record/family-demo/README.md).
// The invitee's clips are recorded at phone width: invite links are opened from a message.
import { accept, createFamily, invite, people, PASSWORD } from '../../../../tools/video-record/family-demo/family.mjs';

export const config = {
  baseURL: process.env.SD_APP_URL ?? 'http://localhost:4200',
  apiURL: process.env.SD_API_URL ?? 'http://localhost:5100',
  viewport: { width: 1408, height: 792 },
};

export const viewports = {
  accept: { width: 390, height: 792 },
  invalid: { width: 390, height: 792 },
};

/** The path and query of Jordan's invite link (the link D30 shows). */
let link;

export const setup = {
  async accept(t) {
    const owner = await createFamily([{ name: 'Mae', age: 5 }]);
    const { url } = await invite(owner, 'Jordan', 37, people.jordan);
    const { pathname, search } = new URL(url);
    link = pathname + search;
    await t.go(link);
  },
  async invalid(t) {
    await t.go(link);
  },
  async 'sign-in'(t) {
    await t.go('/sign-in');
  },
  async 'member-view'(t) {
    await t.signIn(people.jordan, PASSWORD);
    await t.go('/family');
  },
};

export const clips = {
  /** The invite link on a phone: preview, choose a password, join signed in (L2-127 #6). */
  async accept(t) {
    await t.wait(1500);
    await t.hover(t.page.locator('.auth-card__title'), 2500);
    await t.hover(t.page.locator('.auth-card__sub'), 3000);
    await t.hover(t.page.getByLabel('Email'), 2200);
    await t.type(t.page.getByLabel('Password', { exact: true }), PASSWORD, 45);
    await t.type(t.page.getByLabel('Confirm password'), PASSWORD, 45);
    await t.wait(600);
    await t.click(t.page.getByRole('button', { name: 'Join the family' }));
    await t.page.waitForURL(/\/weekend/);
    await t.page.waitForLoadState('networkidle');
    await t.wait(4500);
  },

  /** The same link again, now used (L2-127 #4, #6). */
  async invalid(t) {
    await t.page.getByText('This invite no longer works').waitFor();
    await t.wait(1500);
    await t.hover(t.page.locator('.auth-card__sub'), 3500);
    await t.hover(t.page.getByRole('link', { name: 'Sign in' }), 2500);
  },

  /** Jordan signs in later with their own email and password (L2-127 #3). */
  async 'sign-in'(t) {
    await t.wait(1000);
    await t.type(t.page.getByLabel('Email'), people.jordan, 40);
    await t.type(t.page.getByLabel('Password', { exact: true }), PASSWORD, 45);
    await t.click(t.page.getByRole('button', { name: 'Sign in' }));
    await t.page.waitForURL(/\/weekend/);
    await t.page.waitForLoadState('networkidle');
    await t.wait(3000);
  },

  /** Family as a member who is not the owner: who's in is read-only (L2-124 #4). */
  async 'member-view'(t) {
    const members = t.page.locator('sd-section', { hasText: "Who's in" });
    await t.wait(1200);
    await t.hover(members.locator('.section-header__sub, [class*="sub"]').first(), 3500);
    await t.hover(members.getByText(`Signs in as ${people.jordan}`), 2800);
    await t.hover(members.getByText('Alex', { exact: true }), 1500);
    await t.click(members.getByText('Mae', { exact: true }));
    await t.wait(1500);
    await t.scroll(520, 1200);
    await t.hover(t.page.getByText(people.jordan, { exact: true }), 3000);
  },
};
