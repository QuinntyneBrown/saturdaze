// Screen recordings for video 43 (tools/video-record/record-clips.mjs). The Angular app is built
// twice with `ng build saturdaze --configuration development` (it talks to the local API on
// :5100): main before the fix is served on :4401 and the fix on :4402. Each clip registers a
// throwaway account, asks for a reset link on the real Reset password screen, and overlays the
// server's own expiry (the dev delivery the API returns outside Production) next to the number of
// minutes the page quotes.
export const config = {
  baseURL: 'http://localhost:4402',
  apiURL: 'http://localhost:5100',
  viewport: { width: 1408, height: 792 },
};

async function reset(t, base, label) {
  const email = `video-${Date.now().toString(36)}@example.com`;
  const reg = await t.page.request.post(`${config.apiURL}/api/auth/register`, {
    data: { email, password: 'password123', familyName: null, homeLocation: null },
  });
  if (!reg.ok()) throw new Error(`register failed: ${reg.status()}`);

  let expiresAtUtc = null;
  t.page.on('response', async (res) => {
    if (res.url().endsWith('/api/auth/forgot-password')) {
      try {
        expiresAtUtc = (await res.json()).expiresAtUtc;
      } catch {
        /* the overlay says so if the response had no expiry */
      }
    }
  });

  await t.go(`${base}/reset-password`);
  await t.type(t.page.getByLabel('Email'), email);
  await t.click(t.page.getByRole('button', { name: /Send reset link/ }));
  const sub = t.page.locator('.auth-card__sub');
  await t.page.getByRole('heading', { name: 'Check your email' }).waitFor();
  await t.wait(800);

  const quoted = (await sub.first().innerText()).trim();
  const server = expiresAtUtc ? Math.round((Date.parse(expiresAtUtc) - Date.now()) / 60000) : null;
  const quotedMinutes = Number(/(\d+) minutes/.exec(quoted)?.[1] ?? NaN);
  await t.page.evaluate(
    ({ label, quoted, server, quotedMinutes }) => {
      const agree = server !== null && server === quotedMinutes;
      const box = document.createElement('div');
      box.style.cssText =
        'position:fixed;right:24px;top:24px;z-index:99999;background:#111827;color:#f9fafb;border-radius:12px;' +
        'padding:16px 20px;font:15px/1.6 system-ui,sans-serif;box-shadow:0 8px 32px rgba(0,0,0,.4);max-width:430px';
      box.innerHTML =
        `<div style="font-weight:600;color:#fbbf24">${label}</div>` +
        `<div>The page says: <b>“${quoted}”</b></div>` +
        `<div>The server's link expires in: <b>${server === null ? 'unknown' : server + ' minutes'}</b></div>` +
        `<div style="margin-top:6px;font-weight:600;color:${agree ? '#86efac' : '#fca5a5'}">${agree ? 'They agree.' : 'They disagree.'}</div>`;
      document.body.append(box);
    },
    { label, quoted, server, quotedMinutes },
  );
  await t.page.mouse.move(1390, 770);
  await t.wait(6000);
}

export const clips = {
  before: (t) => reset(t, 'http://localhost:4401', 'Reset link · before'),
  after: (t) => reset(t, 'http://localhost:4402', 'Reset link · after'),
};
