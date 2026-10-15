// Screen recordings for video 34 (tools/video-record/record-clips.mjs). Saturdaze Admin is built
// twice with `ng build admin --configuration development` (it talks to the local API on :5100):
// main before the D39 fix is served on :4401 and the fix on :4402. The clips sign in as the seeded
// family account, which is not an administrator, so Admin shows its gate. The pointer only
// hovers, so nothing shifts a click target.
export const config = {
  baseURL: 'http://localhost:4402',
  apiURL: 'http://localhost:5100',
  viewport: { width: 1408, height: 792 },
};

async function gate(t, base) {
  await t.signIn('quinntynebrown@gmail.com');
  await t.go(`${base}/`);
  const signOut = t.page.getByRole('button', { name: 'Sign out' });
  await signOut.waitFor();
  await t.wait(2500);
  await t.hover(signOut, 4500);
}

export const clips = {
  before: (t) => gate(t, 'http://localhost:4401'),
  after: (t) => gate(t, 'http://localhost:4402'),
};
