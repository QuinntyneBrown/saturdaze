import { APIRequestContext, Page } from "@playwright/test";

/**
 * Session plumbing for behaviour specs.
 *
 * Every guarded route needs a signed-in user. Rather than drive the login
 * form per test, specs log in once through the real API and seed the
 * SessionStore's persisted shape into storage before Angular bootstraps —
 * `provideAppInitializer` then rehydrates it and the route guards see an
 * authoritative session on first paint.
 *
 * Refresh tokens rotate on use, so a shared Playwright `storageState` file
 * would go stale after the first refresh in a run; per-test API login gives
 * every test a fresh pair.
 */

export const API_URL = process.env.SD_API_URL ?? "http://localhost:5100";

/** Seeded by `saturdaze seed` (Saturdaze.Cli UserSeeder). */
export const SEEDED_USER = {
  email: process.env.SD_E2E_EMAIL ?? "quinntynebrown@gmail.com",
  password: process.env.SD_E2E_PASSWORD ?? "password123",
} as const;

export const SEEDED_ADMIN = {
  email: process.env.SD_E2E_ADMIN_EMAIL ?? "admin@saturdaze.app",
  password: process.env.SD_E2E_ADMIN_PASSWORD ?? "password123",
} as const;

export interface Credentials {
  readonly email: string;
  readonly password: string;
}

export interface TestSession {
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly expiresUtc: string;
  readonly user: {
    id: string;
    email: string;
    role: "User" | "Admin";
    emailVerifiedUtc: string | null;
  };
}

/** Optional overrides used to exercise the refresh path end-to-end. */
export interface SeedOptions {
  /** `false` persists to sessionStorage (remember-me off). Default: localStorage. */
  readonly remember?: boolean;
  /** Replace the access token (e.g. with garbage) to force a 401 → refresh. */
  readonly accessToken?: string;
  /** Replace the expiry (e.g. in the past) to force a refresh on rehydrate. */
  readonly expiresUtc?: string;
  /** Replace the refresh token (e.g. with garbage) to force a sign-out. */
  readonly refreshToken?: string;
}

export async function apiLogin(request: APIRequestContext, creds: Credentials): Promise<TestSession> {
  const res = await request.post(`${API_URL}/api/auth/login`, { data: creds });
  if (!res.ok()) {
    throw new Error(
      `API login failed for ${creds.email}: ${res.status()} ${await res.text()} — is the API running on ${API_URL} with a seeded database?`,
    );
  }
  const body = (await res.json()) as {
    token: { accessToken: string; refreshToken: string; accessTokenExpiresAtUtc: string };
    user: TestSession["user"];
  };
  return {
    accessToken: body.token.accessToken,
    refreshToken: body.token.refreshToken,
    expiresUtc: body.token.accessTokenExpiresAtUtc,
    user: body.user,
  };
}

/**
 * Registers an init script that writes the SessionStore's persisted shape
 * before the first navigation. The sentinel in sessionStorage remembers
 * which access token was seeded: reloading with the same session does not
 * re-authenticate a tab that signed out or rotated its tokens, while a
 * different session (e.g. switching to the admin) replaces the old one.
 */
export async function seedSession(page: Page, session: TestSession, opts: SeedOptions = {}): Promise<void> {
  const payload = {
    value: opts.accessToken ?? session.accessToken,
    expiresUtc: opts.expiresUtc ?? session.expiresUtc,
    refreshToken: opts.refreshToken ?? session.refreshToken,
  };
  const tier = opts.remember === false ? "session" : "local";
  await page.addInitScript(
    ({ payload, tier }) => {
      if (sessionStorage.getItem("sd.e2e.seeded") === payload.value) return;
      localStorage.removeItem("sd.auth.token");
      sessionStorage.removeItem("sd.auth.token");
      const store = tier === "local" ? localStorage : sessionStorage;
      store.setItem("sd.auth.token", JSON.stringify(payload));
      store.setItem("sd.auth.storage", tier);
      sessionStorage.setItem("sd.e2e.seeded", payload.value);
    },
    { payload, tier },
  );
}

export interface CurrentWeekend {
  readonly id: string;
  readonly weekendOf: string;
  readonly blocks: ReadonlyArray<{ id: string; day: "Saturday" | "Sunday"; kind: string; title: string; isLocked: boolean }>;
  readonly errands: ReadonlyArray<{ id: string; description: string; done: boolean }>;
}

/**
 * Makes sure the session's family has a planned weekend and returns it.
 * `GET /api/weekends/current` generates the weekend on first call and is
 * idempotent afterwards (ADR-003), so specs can rely on saved history,
 * timeline blocks and errand placement having something to work with.
 */
export async function ensureCurrentWeekend(request: APIRequestContext, session: TestSession): Promise<CurrentWeekend> {
  const res = await request.get(`${API_URL}/api/weekends/current`, {
    headers: { Authorization: `Bearer ${session.accessToken}` },
  });
  if (!res.ok()) throw new Error(`GET /api/weekends/current failed: ${res.status()} ${await res.text()}`);
  return (await res.json()) as CurrentWeekend;
}

/**
 * Registers a throwaway account and returns its credentials. Used by the
 * auth-flow specs so password resets never touch the seeded family account.
 */
export async function registerThrowaway(request: APIRequestContext, prefix = "e2e"): Promise<Credentials> {
  const creds = { email: `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`, password: "password123" };
  const res = await request.post(`${API_URL}/api/auth/register`, {
    data: { email: creds.email, password: creds.password, familyName: "E2E Family", homeLocation: "Port Credit" },
  });
  if (!res.ok()) throw new Error(`API register failed: ${res.status()} ${await res.text()}`);
  return creds;
}

/**
 * Outside Production the API hands back the reset / verification token it
 * would otherwise email (`AuthController.DevDelivery`). The dev server runs
 * as Development, so behaviour specs can complete those flows for real.
 */
export async function devToken(
  request: APIRequestContext,
  path: "/api/auth/forgot-password" | "/api/auth/resend-verification",
  email: string,
): Promise<string> {
  const res = await request.post(`${API_URL}${path}`, { data: { email } });
  if (!res.ok()) throw new Error(`${path} failed: ${res.status()} ${await res.text()}`);
  const body = (await res.json()) as { token?: string | null };
  if (!body.token) throw new Error(`${path} returned no token — is the API running as Development?`);
  return body.token;
}
