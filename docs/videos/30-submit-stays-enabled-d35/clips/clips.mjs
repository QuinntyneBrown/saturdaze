// Screen recordings for video 30 (tools/video-record/record-clips.mjs). The Angular app is built
// twice with `ng build saturdaze --configuration development` (it talks to the local API on
// :5100): main before the D35 fix is served on :4401 and the fix on :4402. The clips sign in as
// the seeded demo account, open the two dialogs, scroll to the primary action and press it with the form
// empty. The page is not zoomed: zoom shifts the pointer's hit targets.
export const config = {
  baseURL: 'http://localhost:4402',
  apiURL: 'http://localhost:5100',
  viewport: { width: 1408, height: 792 },
};

const EMAIL = 'quinntynebrown@gmail.com';


async function suggest(t, base) {
  await t.signIn(EMAIL);
  await t.go(`${base}/ideas/events`);
  await t.click(t.page.getByRole('button', { name: 'Suggest an event' }).or(t.page.getByRole('link', { name: 'Suggest an event' })).first());
  await t.wait(1200);
  const press = t.page.locator('.cdk-overlay-container .btn--primary', { hasText: /Submit|Send suggestion/ });
  await press.scrollIntoViewIfNeeded();
  await t.wait(800);
  await t.hover(press);
  await t.wait(800);
  if (await press.isEnabled()) await t.click(press);
  await t.wait(4800);
}

async function member(t, base) {
  await t.signIn(EMAIL);
  await t.go(`${base}/family`);
  await t.click(t.page.getByRole('button', { name: /Add a family member/ }).or(t.page.getByRole('link', { name: /Add a family member/ })).first());
  await t.wait(1200);
  const press = t.page.locator('.cdk-overlay-container .btn--primary', { hasText: 'Add member' });
  await press.scrollIntoViewIfNeeded();
  await t.wait(800);
  await t.hover(press);
  await t.wait(800);
  if (await press.isEnabled()) await t.click(press);
  await t.wait(4800);
}

export const clips = {
  'before-suggest': (t) => suggest(t, 'http://localhost:4401'),
  'before-member': (t) => member(t, 'http://localhost:4401'),
  'after-suggest': (t) => suggest(t, 'http://localhost:4402'),
  'after-member': (t) => member(t, 'http://localhost:4402'),
};
