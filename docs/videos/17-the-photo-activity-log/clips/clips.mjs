// Screen recordings for video 17 (tools/video-record/record-clips.mjs). Runs against
// Saturdaze Admin and the API with the admin demo data (tools/video-record/admin-demo).
// Before the first clip, two administrators make a morning's worth of changes through the
// admin API, so the log has every action in it. Record after a reset.
import { IMAGE_HOST } from '../../../../tools/video-record/admin-demo/demo-env.mjs';

export const config = {
  baseURL: process.env.SD_ADMIN_URL ?? 'http://localhost:4300',
  apiURL: process.env.SD_API_URL ?? 'http://localhost:5100',
  viewport: { width: 1408, height: 792 },
};

const api = config.apiURL;

async function token(email) {
  const res = await fetch(`${api}/api/auth/login`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password: 'password123' }),
  });
  return (await res.json()).token.accessToken;
}

async function call(bearer, method, path, body) {
  const res = await fetch(`${api}${path}`, {
    method,
    headers: { authorization: `Bearer ${bearer}`, ...(body ? { 'content-type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`${method} ${path}: ${res.status} ${await res.text()}`);
  return res.status === 204 ? null : res.json();
}

/** A place and its photos, found by name. */
async function place(bearer, q) {
  const { items } = await call(bearer, 'GET', `/api/admin/places?q=${encodeURIComponent(q)}`);
  const p = items[0];
  return { ...p, photos: (await call(bearer, 'GET', `/api/admin/places/${p.kind}/${p.id}/photos`)).photos };
}

async function morningOfChanges() {
  const admin = await token('admin@saturdaze.app');
  const jo = await token('jo.curator@saturdaze.app');
  const bronte = await place(admin, 'bronte');
  const trail = bronte.photos.find((p) => p.alt.startsWith('Boardwalk'));
  await call(admin, 'POST', `/api/admin/photos/${trail.id}/primary`);
  const science = await place(jo, 'science');
  await call(jo, 'PATCH', `/api/admin/photos/${science.photos[0].id}`, {
    alt: 'The Ontario Science Centre building on a winter day', attribution: science.photos[0].attribution, licence: 'CC0',
  });
  const reviews = await call(admin, 'GET', '/api/admin/photo-reviews');
  const review = (name) => reviews.find((r) => r.placeName === name).photo.id;
  await call(admin, 'POST', `/api/admin/photos/${review('Snug Harbour')}/review`, { decision: 'keep' });
  await call(jo, 'POST', `/api/admin/photos/${review('La Marina')}/review`, {
    decision: 'reject', reason: 'Wrong venue: this is the Port Credit lighthouse',
  });
  const riverwood = await place(jo, 'riverwood');
  await call(jo, 'POST', `/api/admin/places/Activity/${riverwood.id}/photos`, {
    url: `${IMAGE_HOST}/provider/riverwood-path.jpg`, alt: 'Spring path through the Riverwood woods',
    attribution: 'Photo · Ryan Hodnett, Wikimedia Commons', licence: 'CC BY-SA 4.0',
  });
  const shore = bronte.photos.find((p) => p.alt.startsWith('Creek bed'));
  await call(admin, 'DELETE', `/api/admin/photos/${shore.id}`);
}

export const setup = {
  log: async (t) => {
    await morningOfChanges();
    await t.signIn('admin@saturdaze.app');
  },
  filters: (t) => t.signIn('admin@saturdaze.app'),
};

export const clips = {
  /** Who, when (UTC), the place, the action and what changed (L2-122 AC4). */
  async log(t) {
    await t.go('/');
    await t.wait(800);
    await t.click(t.page.locator('.admin-nav__link', { hasText: 'Activity log' }));
    await t.page.waitForLoadState('networkidle');
    await t.wait(2200);
    const rows = t.page.locator('.audit-row');
    for (let i = 0; i < 6; i++) await t.hover(rows.nth(i).locator('.audit-row__change'), 1700);
    await t.scroll(500, 1400);
    await t.wait(1200);
    await t.hover(rows.last().locator('.audit-row__change'), 1800);
    await t.scroll(-500, 1000);
    await t.wait(800);
  },

  /** Filter by place and by administrator; the filters live in the address. */
  async filters(t) {
    await t.go('/activity');
    await t.wait(1800);
    await t.moveTo(t.page.getByLabel('Place'));
    await t.wait(600);
    await t.page.getByLabel('Place').selectOption({ label: 'Bronte Creek Provincial Park' });
    await t.page.waitForLoadState('networkidle');
    await t.wait(3000);
    await t.page.getByLabel('Place').selectOption({ label: 'All places' });
    await t.moveTo(t.page.getByLabel('Administrator'));
    await t.wait(600);
    await t.page.getByLabel('Administrator').selectOption({ label: 'jo.curator@saturdaze.app' });
    await t.page.waitForLoadState('networkidle');
    await t.wait(3200);
    await t.click(t.page.locator('.audit-row__place', { hasText: 'La Marina' }).first());
    await t.page.waitForURL(/\/places\/Restaurant\//);
    await t.page.waitForLoadState('networkidle');
    await t.wait(2500);
  },
};
