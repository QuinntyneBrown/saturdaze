// Screen recordings for video 39 (tools/video-record/record-clips.mjs). The Angular app is built
// twice with `ng build saturdaze --configuration development` (it talks to the local API on
// :5100): main before the D44 fix is served on :4401 and the fix on :4402. Saturday's dinner is
// locked (the API keeps it), so the Food ideas page shows dimmed siblings. Each clip scrolls to a
// dimmed card and overlays the contrast of its meta text, computed live in the page: the card's
// own opacity is blended into both the text and the surface, as the eye sees them.
export const config = {
  baseURL: 'http://localhost:4402',
  apiURL: 'http://localhost:5100',
  viewport: { width: 1408, height: 792 },
};

async function dimmedCard(t, base, label) {
  await t.signIn('quinntynebrown@gmail.com');
  await t.go(`${base}/ideas/food`);
  const card = t.page.locator('.card--dimmed').first();
  await card.waitFor();
  await card.scrollIntoViewIfNeeded();
  await t.page.evaluate(() => {
    const el = document.querySelector('.card--dimmed');
    if (el) window.scrollBy(0, el.getBoundingClientRect().top - 140);
  });
  await t.wait(1500);
  const text = await t.page.evaluate(() => {
    const card = document.querySelector('.card--dimmed');
    const meta = card.querySelector('.card__meta');
    const parse = (c) => c.match(/[\d.]+/g).slice(0, 3).map(Number);
    const mix = (fg, bg, a) => fg.map((v, i) => v * a + bg[i] * (1 - a));
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
    const page = parse(getComputedStyle(document.body).backgroundColor === 'rgba(0, 0, 0, 0)' ? 'rgb(250, 247, 242)' : getComputedStyle(document.body).backgroundColor);
    const opacity = Number(getComputedStyle(card).opacity);
    const fg = parse(getComputedStyle(meta).color);
    const bgRaw = getComputedStyle(card).backgroundColor;
    const bg = parse(bgRaw);
    // The eye sees the card's opacity applied to its text and its surface over the page.
    const seenFg = mix(fg, page, opacity);
    const seenBg = mix(bg, page, opacity);
    return {
      opacity,
      ratio: ratio(seenFg, seenBg),
    };
  });
  await t.page.evaluate(
    ({ label, text }) => {
      const box = document.createElement('div');
      box.style.cssText =
        'position:fixed;right:24px;top:24px;z-index:99999;background:#111827;color:#f9fafb;border-radius:12px;' +
        'padding:16px 20px;font:15px/1.6 system-ui,sans-serif;box-shadow:0 8px 32px rgba(0,0,0,.4)';
      const ok = text.ratio >= 4.5;
      box.innerHTML =
        `<div style="font-weight:600;color:#fbbf24">${label}</div>` +
        `<div>Card opacity: <b>${text.opacity}</b></div>` +
        `<div>Meta text contrast: <b style="color:${ok ? '#86efac' : '#fca5a5'}">${text.ratio.toFixed(2)} : 1</b> ` +
        `(needs 4.5 : 1)</div>`;
      document.body.append(box);
    },
    { label, text },
  );
  await t.page.mouse.move(1390, 770);
  await t.wait(6500);
}

export const clips = {
  before: (t) => dimmedCard(t, 'http://localhost:4401', 'Dimmed pick · before'),
  after: (t) => dimmedCard(t, 'http://localhost:4402', 'Dimmed pick · after'),
};
