// Screen recordings for video 33 (tools/video-record/record-clips.mjs). The Angular app is built
// twice with `ng build saturdaze --configuration development` (it talks to the local API on
// :5100): main before the D38 fix is served on :4401 and the fix on :4402. The clips open the
// sign-in screen, type a wrong password and press Enter, so the "did not match" banner appears.
export const config = {
  baseURL: 'http://localhost:4402',
  apiURL: 'http://localhost:5100',
  viewport: { width: 1408, height: 792 },
};

async function wrongPassword(t, base) {
  await t.go(`${base}/sign-in`);
  await t.wait(1200);
  await t.type(t.page.getByLabel('Email'), 'quinntynebrown@gmail.com');
  await t.type(t.page.getByLabel('Password', { exact: true }), 'not-the-password');
  await t.page.keyboard.press('Enter');
  await t.page.locator('.banner--warn[role="alert"]').waitFor();
  await t.page.mouse.move(1380, 770);
  await t.wait(5500);
}

export const clips = {
  before: (t) => wrongPassword(t, 'http://localhost:4401'),
  after: (t) => wrongPassword(t, 'http://localhost:4402'),
};
