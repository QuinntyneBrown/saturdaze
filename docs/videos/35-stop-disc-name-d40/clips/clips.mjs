// Screen recordings for video 35 (tools/video-record/record-clips.mjs). The Angular app is built
// twice with `ng build saturdaze --configuration development` (it talks to the local API on
// :5100): main before the D40 fix is served on :4401 and the fix on :4402. The clips open the
// Weekend page, scroll to the first numbered stop and overlay what the browser's accessibility
// tree says about that block (Playwright's `ariaSnapshot`), because the disc looks identical
// before and after: the change is in what assistive technology reads.
export const config = {
  baseURL: 'http://localhost:4402',
  apiURL: 'http://localhost:5100',
  viewport: { width: 1408, height: 792 },
};

async function stopDisc(t, base, label) {
  await t.signIn('quinntynebrown@gmail.com');
  await t.go(`${base}/weekend`);
  const disc = t.page.locator('.block__disc--num').first();
  await disc.waitFor();
  await disc.scrollIntoViewIfNeeded();
  await t.page.evaluate(() => {
    const el = document.querySelector('.block__disc--num');
    if (el) window.scrollBy(0, el.getBoundingClientRect().top - 220);
  });
  await t.wait(1500);
  const block = t.page.locator('.block', { has: t.page.locator('.block__disc--num') }).first();
  const tree = await block.ariaSnapshot();
  await t.page.evaluate(
    ({ tree, label }) => {
      const box = document.createElement('div');
      box.style.cssText =
        'position:fixed;right:24px;top:96px;width:520px;z-index:99999;background:#111827;color:#f9fafb;' +
        'border-radius:12px;padding:16px 20px;font:14px/1.5 ui-monospace,Consolas,monospace;box-shadow:0 8px 32px rgba(0,0,0,.4)';
      const head = document.createElement('div');
      head.textContent = label;
      head.style.cssText = 'font:600 15px system-ui,sans-serif;margin-bottom:8px;color:#fbbf24';
      const pre = document.createElement('pre');
      pre.textContent = tree;
      pre.style.cssText = 'margin:0;white-space:pre-wrap';
      box.append(head, pre);
      document.body.append(box);
    },
    { tree, label },
  );
  await t.wait(7000);
}

export const clips = {
  before: (t) => stopDisc(t, 'http://localhost:4401', 'Accessibility tree · before'),
  after: (t) => stopDisc(t, 'http://localhost:4402', 'Accessibility tree · after'),
};
