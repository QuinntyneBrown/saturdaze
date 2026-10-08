// Screen recordings for video 18 (tools/video-record/record-clips.mjs). The landing mock is
// served twice: the commit before the D01 fix on :4401 and the fix on :4402
// (python3 -m http.server in each docs/mocks copy).
export const config = {
  baseURL: 'http://localhost:4402',
  viewport: { width: 1408, height: 792 },
};

async function tour(t, base) {
  await t.go(`${base}/pages/landing.html`);
  await t.wait(2500);
  await t.scroll(500, 1800);
  await t.wait(2500);
  await t.scroll(-500, 1200);
  await t.wait(1000);
}

export const clips = {
  before: (t) => tour(t, 'http://localhost:4401'),
  after: (t) => tour(t, 'http://localhost:4402'),
};
