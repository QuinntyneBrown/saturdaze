// Screen recordings for video 18 (tools/video-record/record-clips.mjs). Runs against the
// family app and the API with the admin demo data (tools/video-record/admin-demo). The API
// runs as Development there, so AuthController.DevDelivery hands back the token it would
// otherwise email; the clips read it the way e2e/fixtures/auth.ts `devToken` does.
export const config = {
  baseURL: process.env.SD_APP_URL ?? 'http://localhost:4200',
  apiURL: process.env.SD_API_URL ?? 'http://localhost:5100',
  viewport: { width: 1408, height: 792 },
};

const api = config.apiURL;
const PASSWORD = 'password123';

async function post(path, body) {
  const res = await fetch(`${api}${path}`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`POST ${path}: ${res.status} ${await res.text()}`);
  return res.status === 204 ? null : res.json();
}

/** The token the API would have emailed (Development only). */
async function devToken(path, email) {
  const { token } = await post(path, { email });
  if (!token) throw new Error(`${path} returned no token: is the API running as Development?`);
  return token;
}

/** A fresh throwaway account per clip, so nothing is already verified or reset. */
const accounts = {};
async function throwaway(name) {
  const email = `sam.rivera.${Date.now().toString(36)}@example.com`;
  await post('/api/auth/register', { email, password: PASSWORD, familyName: 'The Riveras', homeLocation: 'Port Credit, ON' });
  accounts[name] = email;
}

// Each clip's first page loads off camera, so the recording opens on a painted screen.
export const setup = {
  async verify(t) {
    await throwaway('verify');
    await t.go(`/verify-email?email=${encodeURIComponent(accounts.verify)}`);
  },
  async reset(t) {
    await throwaway('reset');
    await t.go('/reset-password');
  },
};

export const clips = {
  /** Right after sign-up: the sent card, one resend, then the link (L2-006). */
  async verify(t) {
    const email = accounts.verify;
    await t.wait(4500);
    await t.click(t.page.getByRole('button', { name: 'Resend' }));
    await t.page.getByRole('button', { name: 'Sent' }).waitFor();
    await t.wait(5000);
    const token = await devToken('/api/auth/resend-verification', email);
    await t.go(`/verify-email?token=${encodeURIComponent(token)}`);
    await t.page.getByText('You are verified').waitFor();
    await t.wait(3500);
    await t.hover(t.page.getByRole('link', { name: 'Set up your family' }), 4000);
  },

  /** Request a link, use it once, then try it again (L2-004, L2-005). */
  async reset(t) {
    const email = accounts.reset;
    await t.wait(1200);
    await t.type(t.page.getByLabel('Email'), email, 35);
    await t.click(t.page.getByRole('button', { name: 'Send reset link' }));
    await t.page.getByText('Check your email').waitFor();
    await t.wait(4500);
    const token = await devToken('/api/auth/forgot-password', email);
    const link = `/reset-password?token=${encodeURIComponent(token)}`;
    await t.go(link);
    await t.wait(1000);
    await t.type(t.page.getByLabel('New password'), 'lavender-weekend', 40);
    await t.type(t.page.getByLabel('Confirm password'), 'lavender-weekend', 40);
    await t.click(t.page.getByRole('button', { name: 'Save password' }));
    await t.page.getByText('Password updated').waitFor();
    await t.wait(3500);
    await t.go(link);
    await t.wait(800);
    await t.type(t.page.getByLabel('New password'), 'another-weekend', 30);
    await t.type(t.page.getByLabel('Confirm password'), 'another-weekend', 30);
    await t.click(t.page.getByRole('button', { name: 'Save password' }));
    await t.page.getByText('This link has expired').waitFor();
    await t.wait(4500);
  },
};
