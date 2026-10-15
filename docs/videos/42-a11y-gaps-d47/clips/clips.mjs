// Screen recordings for video 42 (tools/video-record/record-clips.mjs). The family app and
// Saturdaze Admin are each built twice with `ng build <app> --configuration development` (they talk
// to the local API on :5100). main before the D47 fix: family app on :4401, Admin on :4403; the fix:
// :4402 and :4404. The "app" clip adds a duplicate like in the Family dialog, then clears the Starts
// field of Suggest an event and reports which ids its aria-describedby names. The "admin" clip
// overlays the accessibility tree around Admin's navigation.
export const config = {
  baseURL: 'http://localhost:4402',
  apiURL: 'http://localhost:5100',
  viewport: { width: 1408, height: 792 },
};

async function overlay(t, title, html, side = 'right') {
  await t.page.evaluate(
    ({ title, html, side }) => {
      document.getElementById('d47-note')?.remove();
      const box = document.createElement('div');
      box.id = 'd47-note';
      box.style.cssText =
        `position:fixed;${side}:24px;top:24px;width:${side === 'left' ? 395 : 520}px;z-index:99999;` +
        'background:#111827;color:#f9fafb;' +
        'border-radius:12px;padding:16px 20px;font:14px/1.6 ui-monospace,Consolas,monospace;box-shadow:0 8px 32px rgba(0,0,0,.4)';
      box.innerHTML = `<div style="font:600 15px system-ui,sans-serif;color:#fbbf24;margin-bottom:6px">${title}</div>${html}`;
      document.body.append(box);
    },
    { title, html, side },
  );
}

async function app(t, base, label) {
  await t.signIn('quinntynebrown@gmail.com');
  // 1. A duplicate like.
  await t.go(`${base}/family`);
  await t.page.getByRole('button', { name: /Edit/ }).nth(1).waitFor();
  await t.page.getByRole('heading', { name: 'Likes and dislikes' }).scrollIntoViewIfNeeded();
  await t.page.locator('button:has-text("Edit")').nth(1).evaluate((el) => el.click());
  const likes = t.page.getByLabel('Likes', { exact: true });
  await likes.waitFor();
  const existing = (await t.page.locator('.chip-input .chip').first().innerText()).trim();
  await t.wait(1200);
  await likes.fill(existing.toLowerCase());
  await likes.press('Enter');
  await t.wait(4200);
  // 2. A field that swaps its hint for an error.
  await t.page.keyboard.press('Escape');
  await t.go(`${base}/ideas/events`);
  await t.page.getByRole('button', { name: 'Suggest an event' }).or(t.page.getByRole('link', { name: 'Suggest an event' })).first().evaluate((el) => el.click());
  const starts = t.page.getByLabel('Starts', { exact: false }).first();
  await starts.waitFor();
  await starts.fill('');
  await t.wait(1000);
  const info = await starts.evaluate((el) => {
    const ids = (el.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(Boolean);
    return ids.map((id) => ({ id: id.replace(/^sd-field-\d+/, 'field'), found: !!document.getElementById(id) }));
  });
  const rows = info
    .map((i) => `<div>${i.id} → <b style="color:${i.found ? '#86efac' : '#fca5a5'}">${i.found ? 'in the page' : 'MISSING'}</b></div>`)
    .join('');
  await overlay(t, `Starts: aria-describedby · ${label}`, rows || '<div>(none)</div>', 'left');
  await t.wait(5500);
}

async function admin(t, base, label) {
  await t.signIn('admin@saturdaze.app');
  await t.go(`${base}/places`);
  await t.page.locator('.admin-nav').waitFor();
  const tree = (await t.page.locator('body').ariaSnapshot()).split('\n').slice(0, 9).join('\n');
  await overlay(t, `Admin · accessibility tree (top) · ${label}`, `<pre style="margin:0;white-space:pre-wrap">${tree.replace(/</g, '&lt;')}</pre>`);
  await t.page.mouse.move(1390, 770);
  await t.wait(7000);
}

export const clips = {
  'before-app': (t) => app(t, 'http://localhost:4401', 'before'),
  'before-admin': (t) => admin(t, 'http://localhost:4403', 'before'),
  'after-app': (t) => app(t, 'http://localhost:4402', 'after'),
  'after-admin': (t) => admin(t, 'http://localhost:4404', 'after'),
};
