// Screen recordings for video 41 (tools/video-record/record-clips.mjs). The Angular app is built
// twice with `ng build saturdaze --configuration development` (it talks to the local API on
// :5100): main before the D46 fix is served on :4401 and the fix on :4402. Each clip opens the
// Weekend screen, zooms to 150% so the pill's edge reads at video size, and overlays what separates
// the selected day tab from its track: the luminance step between the two fills before the fix,
// and the 1px inset edge after it, both measured live in the page.
export const config = {
  baseURL: 'http://localhost:4402',
  apiURL: 'http://localhost:5100',
  viewport: { width: 1408, height: 792 },
};

async function segment(t, base, label) {
  await t.signIn('quinntynebrown@gmail.com');
  await t.go(`${base}/weekend`);
  const tab = t.page.getByRole('tab', { name: 'Saturday', exact: true });
  await tab.waitFor();
  await t.page.evaluate(() => (document.documentElement.style.zoom = '1.5'));
  await tab.scrollIntoViewIfNeeded();
  await t.page.evaluate(() => {
    const el = document.querySelector('[role="tablist"]');
    if (el) window.scrollBy(0, el.getBoundingClientRect().top - 180);
  });
  await t.wait(1500);
  const result = await t.page.evaluate(() => {
    const track = document.querySelector('[role="tablist"]');
    const pill = document.querySelector('[role="tab"][aria-selected="true"]');
    const parse = (c) => c.match(/[\d.]+/g).slice(0, 3).map(Number);
    const lum = (rgb) => {
      const [r, g, b] = rgb.map((v) => {
        const s = v / 255;
        return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    const ratio = (a, b) => {
      const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
      return (hi + 0.05) / (lo + 0.05);
    };
    const trackBg = parse(getComputedStyle(track).backgroundColor);
    const pillBg = parse(getComputedStyle(pill).backgroundColor);
    const shadow = getComputedStyle(pill).boxShadow;
    const edge = /(rgba?\([^)]*\))\s+0px 0px 0px 1px inset/.exec(shadow)?.[1];
    return {
      fill: ratio(pillBg, trackBg),
      edge: edge ? ratio(parse(edge), trackBg) : null,
    };
  });
  await t.page.evaluate(
    ({ label, result }) => {
      const box = document.createElement('div');
      box.style.cssText =
        'position:fixed;right:24px;top:24px;z-index:99999;background:#111827;color:#f9fafb;border-radius:12px;' +
        'padding:16px 20px;font:15px/1.6 system-ui,sans-serif;box-shadow:0 8px 32px rgba(0,0,0,.4)';
      const edgeLine = result.edge
        ? `1px edge on the track: <b style="color:#86efac">${result.edge.toFixed(2)} : 1</b> (needs 3 : 1)`
        : `Edge: <b style="color:#fca5a5">none</b>`;
      box.innerHTML =
        `<div style="font-weight:600;color:#fbbf24">${label}</div>` +
        `<div>Pill fill vs track: <b style="color:#fca5a5">${result.fill.toFixed(2)} : 1</b> (needs 3 : 1)</div>` +
        `<div>${edgeLine}</div>`;
      document.body.append(box);
    },
    { label, result },
  );
  await t.page.mouse.move(1390, 770);
  await t.wait(6000);
}

export const clips = {
  before: (t) => segment(t, 'http://localhost:4401', 'Selected day tab · before'),
  after: (t) => segment(t, 'http://localhost:4402', 'Selected day tab · after'),
};
