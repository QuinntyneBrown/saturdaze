// Screen recordings for video 20 (tools/video-record/record-clips.mjs), against the family
// app and an API on a freshly reset database (tools/video-record/family-demo/README.md).
import { createFamily, people, PASSWORD } from '../../../../tools/video-record/family-demo/family.mjs';

export const config = {
  baseURL: process.env.SD_APP_URL ?? 'http://localhost:4200',
  apiURL: process.env.SD_API_URL ?? 'http://localhost:5100',
  viewport: { width: 1408, height: 792 },
};

const dialog = (t) => t.page.locator('.cdk-overlay-container [role="dialog"]');

// Each clip's first page loads off camera, so the recording opens on a painted screen.
export const setup = {
  async 'owner-view'(t) {
    await createFamily();
    await t.signIn(people.alex, PASSWORD);
    await t.go('/family');
  },
  async 'add-child'(t) {
    await t.signIn(people.alex, PASSWORD);
    await t.go('/family');
  },
};

export const clips = {
  /** The owner's Family page: who's in, editable (L2-124 #4). */
  async 'owner-view'(t) {
    const members = t.page.locator('sd-section', { hasText: "Who's in" });
    await t.wait(1500);
    await t.hover(members.getByText('Ages shape the picks. Tap a person to edit.'), 2500);
    await t.hover(members.getByText('Alex', { exact: true }), 1800);
    await t.hover(members.getByText('Eli', { exact: true }), 1800);
    await t.hover(members.getByText('Add a family member'), 2500);
    await t.scroll(500, 1200);
    await t.hover(t.page.getByText(people.alex), 3000);
  },

  /** Add a member who will not sign in: D17b with "No sign-in" (L2-125). */
  async 'add-child'(t) {
    await t.wait(1200);
    await t.click(t.page.getByText('Add a family member'));
    await dialog(t).waitFor();
    await t.wait(1200);
    await t.type(dialog(t).getByLabel('Name'), 'Mae', 90);
    await t.type(dialog(t).getByLabel('Age'), '5', 90);
    await t.hover(dialog(t).getByRole('radio', { name: 'No sign-in' }), 2200);
    await t.hover(dialog(t).getByText('No invite is sent. Good for young children.'), 2600);
    await t.click(dialog(t).getByRole('button', { name: 'Add member' }));
    await dialog(t).waitFor({ state: 'detached' });
    await t.page.getByText('Kid · 5').waitFor();
    await t.wait(800);
    await t.hover(t.page.getByText('Kid · 5'), 3500);
  },
};
