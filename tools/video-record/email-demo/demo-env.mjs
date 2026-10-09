// Shared settings for the email template demo environment (see README.md).
// Everything it writes lives under .cache/email-demo/, which is never committed.
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
export const repo = resolve(here, '../../..');
export const state = join(repo, '.cache', 'email-demo');
export const API = process.env.SD_API_URL ?? 'http://localhost:5100';
export const ADMIN = 'admin@saturdaze.app';
export const CURATOR = 'jo.curator@saturdaze.app';
export const PASSWORD = 'password123';

/**
 * The demo database's connection string. It must name a database of its own (the reset
 * drops it), and the API under recording must use the same one (SATURDAZE_CONNECTION).
 */
export function connection() {
  const cs = process.env.SD_EMAIL_DEMO_CONNECTION;
  if (!cs) throw new Error('Set SD_EMAIL_DEMO_CONNECTION to the demo database (see tools/video-record/email-demo/README.md).');
  if (!/Database=SaturdazeEmailDemo/i.test(cs)) throw new Error('SD_EMAIL_DEMO_CONNECTION must use Database=SaturdazeEmailDemo.');
  return cs;
}

export async function token(email) {
  const res = await fetch(`${API}/api/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password: PASSWORD }),
  });
  if (!res.ok) throw new Error(`login ${email}: ${res.status}`);
  return (await res.json()).token.accessToken;
}

/** Calls the admin API as one administrator; throws on a refusal. */
export async function call(bearer, method, path, body) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { authorization: `Bearer ${bearer}`, ...(body ? { 'content-type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`${method} ${path}: ${res.status} ${await res.text()}`);
  return res.status === 204 ? null : res.json();
}

/** A template's id by its key. */
export async function idOf(bearer, key) {
  const rows = await call(bearer, 'GET', `/api/admin/email-templates?q=${encodeURIComponent(key)}`);
  return rows.find((r) => r.key === key).id;
}

/** Saves a template with some fields changed, at its current version. */
export async function save(bearer, id, changes) {
  const t = await call(bearer, 'GET', `/api/admin/email-templates/${id}`);
  return call(bearer, 'PUT', `/api/admin/email-templates/${id}`, {
    name: t.name, description: t.description, subject: t.subject, preheader: t.preheader,
    htmlBody: t.htmlBody, textBody: t.textBody, sampleData: t.sampleData, version: t.version,
    ...changes,
  });
}

export async function setStatus(bearer, id, status) {
  const t = await call(bearer, 'GET', `/api/admin/email-templates/${id}`);
  return call(bearer, 'POST', `/api/admin/email-templates/${id}/status`, { status, version: t.version });
}
