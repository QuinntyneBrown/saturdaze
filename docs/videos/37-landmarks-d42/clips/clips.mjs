// Screen recordings for video 37 (tools/video-record/record-clips.mjs). The family app and
// Saturdaze Admin are each built twice with `ng build <app> --configuration development` (they talk
// to the local API on :5100). main before the D42 fix: family app on :4401, Admin on :4403; the
// fix: :4402 and :4404. The pages look the same before and after, so each clip overlays the
// accessibility tree the browser builds (Playwright's `ariaSnapshot`): the landing page's tail
// (is the footer a contentinfo landmark?) and Admin Places' pager (is it a navigation?).
export const config = {
  baseURL: 'http://localhost:4402',
  apiURL: 'http://localhost:5100',
  viewport: { width: 1408, height: 792 },
};

async function overlay(t, title, text) {
  await t.page.evaluate(
    ({ title, text }) => {
      const box = document.createElement('div');
      box.style.cssText =
        'position:fixed;right:24px;top:24px;width:560px;z-index:99999;background:#111827;color:#f9fafb;' +
        'border-radius:12px;padding:16px 20px;font:14px/1.5 ui-monospace,Consolas,monospace;box-shadow:0 8px 32px rgba(0,0,0,.4)';
      const head = document.createElement('div');
      head.textContent = title;
      head.style.cssText = 'font:600 15px system-ui,sans-serif;margin-bottom:8px;color:#fbbf24';
      const pre = document.createElement('pre');
      pre.textContent = text;
      pre.style.cssText = 'margin:0;white-space:pre-wrap';
      box.append(head, pre);
      document.body.append(box);
    },
    { title, text },
  );
}

async function landing(t, base, title) {
  await t.go(`${base}/`);
  await t.page.locator('.site-footer').waitFor();
  await t.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await t.wait(1200);
  const tree = await t.page.locator('body').ariaSnapshot();
  const tail = tree.split('\n').slice(-12).join('\n');
  await overlay(t, title, tail);
  await t.page.mouse.move(1390, 770);
  await t.wait(7000);
}

async function pager(t, base, title) {
  await t.signIn('admin@saturdaze.app');
  await t.go(`${base}/places`);
  await t.page.locator('.pager').waitFor();
  await t.page.locator('.pager').scrollIntoViewIfNeeded();
  await t.wait(1200);
  const tree = await t.page.locator('main').ariaSnapshot();
  const tail = tree.split('\n').slice(-7).join('\n');
  await overlay(t, title, tail);
  await t.page.mouse.move(1390, 770);
  await t.wait(4000);
}

export const clips = {
  'before-footer': (t) => landing(t, 'http://localhost:4401', 'Landing · accessibility tree (tail) · before'),
  'before-pager': (t) => pager(t, 'http://localhost:4403', 'Admin Places · accessibility tree (tail) · before'),
  'after-footer': (t) => landing(t, 'http://localhost:4402', 'Landing · accessibility tree (tail) · after'),
  'after-pager': (t) => pager(t, 'http://localhost:4404', 'Admin Places · accessibility tree (tail) · after'),
};
