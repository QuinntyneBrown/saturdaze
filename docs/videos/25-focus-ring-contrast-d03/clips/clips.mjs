// Screen recordings for video 25 (tools/video-record/record-clips.mjs). The Angular app is
// built twice with `ng build saturdaze --configuration production`: the commit before the D03
// fix is served on :4401 and the fix on :4402 (any static server with an index.html fallback).
// Sign-in is anonymous, so no API is needed. The page is zoomed to 135% so the 2px ring reads
// at video size; the clip tabs through the form with the keyboard, as a keyboard user would.
export const config = {
  baseURL: 'http://localhost:4402',
  viewport: { width: 1408, height: 792 },
};

async function tabTo(t, locator, ms) {
  for (let i = 0; i < 20; i++) {
    await t.page.keyboard.press('Tab');
    await t.wait(450);
    if (await locator.evaluate((el) => el === document.activeElement)) break;
  }
  await t.wait(ms);
}

async function tour(t, base) {
  await t.go(`${base}/sign-in`);
  await t.page.evaluate(() => (document.documentElement.style.zoom = '1.35'));
  const card = t.page.locator('.auth-card');
  // Filled first, so leaving the fields does not show the required-field error border.
  await card.getByLabel('Email').fill('sam@example.com');
  await card.getByLabel('Password').fill('password123');
  // A click on the empty canvas moves the Tab starting point back to the top of the page.
  await t.page.mouse.click(40, 40);
  await t.page.mouse.move(1380, 760);
  await t.wait(1200);
  await tabTo(t, card.getByLabel('Email'), 1800);
  await tabTo(t, card.getByRole('link', { name: 'Forgot password?', exact: true }), 1800);
  await tabTo(t, card.getByRole('button', { name: 'Sign in', exact: true }), 2200);
}

export const clips = {
  before: (t) => tour(t, 'http://localhost:4401'),
  after: (t) => tour(t, 'http://localhost:4402'),
};
