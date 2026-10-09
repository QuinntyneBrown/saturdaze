/**
 * Email template set-up for the admin specs (L1-037): a fresh template per
 * test through the API, so specs never depend on what earlier runs left
 * behind, and an out-of-band save to make the editor's copy stale.
 */
import { APIRequestContext, expect } from "@playwright/test";
import { API_URL, TestSession } from "./auth.js";

export interface CreatedTemplate {
  readonly id: string;
  readonly key: string;
  readonly name: string;
  readonly version: number;
}

const ROUTE = `${API_URL}/api/admin/email-templates`;

const auth = (session: TestSession) => ({ Authorization: `Bearer ${session.accessToken}` });

/** A unique key per call ("e2e.notification-lq3x9a"). */
export function uniqueKey(prefix = "e2e"): string {
  return `${prefix}.${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export async function createTemplate(
  request: APIRequestContext,
  session: TestSession,
  opts: { name?: string; category?: string; key?: string } = {},
): Promise<CreatedTemplate> {
  const key = opts.key ?? uniqueKey();
  const res = await request.post(ROUTE, {
    headers: auth(session),
    data: { key, name: opts.name ?? `E2E ${key}`, description: "", category: opts.category ?? "Notification" },
  });
  expect(res.status(), await res.text()).toBe(201);
  const body = (await res.json()) as CreatedTemplate;
  return { id: body.id, key: body.key, name: body.name, version: body.version };
}

/** Saves a new subject behind the editor's back; returns the new version. */
export async function saveSubjectOutOfBand(
  request: APIRequestContext,
  session: TestSession,
  id: string,
  subject: string,
): Promise<number> {
  const current = await (await request.get(`${ROUTE}/${id}`, { headers: auth(session) })).json();
  const res = await request.put(`${ROUTE}/${id}`, {
    headers: auth(session),
    data: { ...current, subject },
  });
  expect(res.status(), await res.text()).toBe(200);
  return ((await res.json()) as { version: number }).version;
}
