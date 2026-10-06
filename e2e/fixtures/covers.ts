import { readFileSync } from "node:fs";
import { APIRequestContext } from "@playwright/test";
import { API_URL, TestSession } from "./auth.js";
import { FAMILY_PHOTO } from "./weekend-cover.js";

/** Upload {@link FAMILY_PHOTO} as a weekend's cover through the API (L2-097). */
export async function uploadCover(request: APIRequestContext, session: TestSession, weekendId: string): Promise<void> {
  const res = await request.post(`${API_URL}/api/weekends/${weekendId}/cover`, {
    headers: { Authorization: `Bearer ${session.accessToken}` },
    multipart: { file: { name: "family.jpg", mimeType: "image/jpeg", buffer: readFileSync(FAMILY_PHOTO) } },
  });
  if (!res.ok()) throw new Error(`POST /api/weekends/${weekendId}/cover failed: ${res.status()} ${await res.text()}`);
}

/** Plan the weekend of `weekendOf` (`YYYY-MM-DD`, a Saturday) so Past has more than one card. */
export async function planWeekend(request: APIRequestContext, session: TestSession, weekendOf: string): Promise<void> {
  const res = await request.post(`${API_URL}/api/weekends/plan`, {
    headers: { Authorization: `Bearer ${session.accessToken}` },
    data: { weekendOf },
  });
  if (!res.ok()) throw new Error(`POST /api/weekends/plan failed: ${res.status()} ${await res.text()}`);
}
