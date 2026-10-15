// Screen recordings for video 40 (tools/video-record/record-clips.mjs). The drift is in the static
// generating Weekend mock, so the clips open that mock on a phone-width screen: a copy of docs/mocks
// as it was on main is served on :4401 and the fixed one on :4402 (any static server; no API).
// The mock's header buttons are disabled while it "generates", and disabled buttons are skipped by
// Tab, so each clip enables them (as they are once the plan is ready) before pressing Tab.
export const config = {
  baseURL: 'http://localhost:4402',
  viewport: { width: 390, height: 792 },
};

export const viewports = {
  before: { width: 390, height: 792 },
  after: { width: 390, height: 792 },
};

async function tabOrder(t, base, label) {
  await t.go(`${base}/pages/weekend.generating.html`);
  await t.page.evaluate(() => {
    document.querySelectorAll('.page-header__actions .btn').forEach((b) => b.removeAttribute('disabled'));
    const box = document.createElement('div');
    box.id = 'tab-note';
    box.style.cssText =
      'position:fixed;left:12px;right:12px;bottom:12px;z-index:99999;background:#111827;color:#f9fafb;' +
      'border-radius:12px;padding:12px 16px;font:15px/1.5 system-ui,sans-serif;box-shadow:0 8px 32px rgba(0,0,0,.4)';
    document.body.append(box);
  });
  const note = (title, body) =>
    t.page.evaluate(
      ({ label, title, body }) => {
        document.getElementById('tab-note').innerHTML =
          `<div style="font-weight:600;color:#fbbf24">${label}</div><div style="font-weight:600">${title}</div><div>${body}</div>`;
      },
      { label, title, body },
    );
  await note('Page header on a phone', 'Buttons enabled. Press Tab until focus reaches the header actions.');
  await t.wait(2400);
  const inActions = () =>
    t.page.evaluate(() => !!document.activeElement?.closest('.page-header__actions'));
  for (let guard = 0; guard < 6 && !(await inActions()); guard++) {
    await t.page.keyboard.press('Tab');
    await t.wait(350);
  }
  const report = async (ordinal) => {
    const info = await t.page.evaluate(() => {
      const el = document.activeElement;
      const top = el ? el.getBoundingClientRect().top : -1;
      return { name: el?.textContent?.trim() ?? '', upper: top < 140 };
    });
    await note(
      `${ordinal} action reached`,
      `Focus is on <b>${info.name}</b>, the ${info.upper ? 'upper' : 'lower'} button on screen.`,
    );
    await t.wait(3200);
  };
  await report('First');
  await t.page.keyboard.press('Tab');
  await t.wait(400);
  await report('Second');
}

export const clips = {
  before: (t) => tabOrder(t, 'http://localhost:4401', 'Before: primary last in the DOM'),
  after: (t) => tabOrder(t, 'http://localhost:4402', 'After: primary first in the DOM'),
};
