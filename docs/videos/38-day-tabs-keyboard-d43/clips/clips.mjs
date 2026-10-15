// Screen recordings for video 38 (tools/video-record/record-clips.mjs). The Angular app is built
// twice with `ng build saturdaze --configuration development` (it talks to the local API on
// :5100): main before the D43 fix is served on :4401 and the fix on :4402. The clips sign in as the
// seeded family, focus the Saturday tab and press →, then Home, then End, with the key shown on
// screen. Before the fix the arrows already work but Home and End do nothing.
export const config = {
  baseURL: 'http://localhost:4402',
  apiURL: 'http://localhost:5100',
  viewport: { width: 1408, height: 792 },
};

async function showKey(t, key) {
  await t.page.evaluate((key) => {
    document.getElementById('key-badge')?.remove();
    const badge = document.createElement('div');
    badge.id = 'key-badge';
    badge.textContent = 'Key pressed: ' + key;
    badge.style.cssText =
      'position:fixed;right:24px;top:24px;z-index:99999;background:#111827;color:#fbbf24;' +
      'border-radius:12px;padding:12px 18px;font:600 18px system-ui,sans-serif;box-shadow:0 8px 32px rgba(0,0,0,.4)';
    document.body.append(badge);
  }, key);
}

async function keyboard(t, base) {
  await t.signIn('quinntynebrown@gmail.com');
  await t.go(`${base}/weekend`);
  await t.page.locator('.day').first().waitFor();
  const saturday = t.page.getByRole('tab', { name: 'Saturday', exact: true });
  await saturday.waitFor();
  await saturday.focus();
  await t.wait(2200);
  for (const [label, key] of [
    ['→', 'ArrowRight'],
    ['Home', 'Home'],
    ['End', 'End'],
  ]) {
    await showKey(t, label);
    await t.wait(700);
    await t.page.keyboard.press(key);
    await t.wait(2600);
  }
}

export const clips = {
  before: (t) => keyboard(t, 'http://localhost:4401'),
  after: (t) => keyboard(t, 'http://localhost:4402'),
};
