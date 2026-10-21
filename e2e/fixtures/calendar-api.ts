import { Page, Request } from "@playwright/test";

/**
 * Stands in for the calendar endpoints and Google's consent screen (L2-166,
 * ADR-020): no spec can hold a Google grant, and `CalendarConnectTests`
 * cover the API's own rules. `POST /api/calendar/google/authorize` answers
 * with a URL on the app's own `/family/calendar/google`, so "Continue to
 * Google" lands straight back as Google would after consent; the rest of
 * the round trip (the return route, the connect call, the section's states)
 * runs in the real app.
 */

export interface GoogleConnectionState {
  email: string;
  status: "connected" | "needs_reconnect";
  readCommitments: boolean;
  lastSyncedUtc: string | null;
}

export interface CalendarStubOptions {
  googleConfigured?: boolean;
  google?: GoogleConnectionState | null;
  /** Answer authorize with this status instead of a URL. */
  authorizeFails?: number;
  /** Answer connect with this error code instead of connecting. */
  connectError?: { status: number; code: string };
  /** Where the fake consent screen sends the browser back: `code` and `state`, or `error`. */
  consent?: "allow" | "deny";
}

export const FAKE_CODE = "fake-google-code";
export const FAKE_STATE = "fake-state";

export class CalendarStub {
  readonly requests: { method: string; path: string; body: unknown }[] = [];
  googleConfigured: boolean;
  google: GoogleConnectionState | null;

  constructor(private readonly options: CalendarStubOptions) {
    this.googleConfigured = options.googleConfigured ?? true;
    this.google = options.google ?? null;
  }

  settings(): unknown {
    return {
      googleConfigured: this.googleConfigured,
      google: this.google,
      feed: { active: false, createdUtc: null },
    };
  }

  sent(method: string, path: string): unknown[] {
    return this.requests.filter((r) => r.method === method && r.path === path).map((r) => r.body);
  }
}

export async function stubCalendarApi(page: Page, options: CalendarStubOptions = {}): Promise<CalendarStub> {
  const stub = new CalendarStub(options);
  const json = (body: unknown, status = 200) => ({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
  const record = (request: Request) => {
    const path = new URL(request.url()).pathname;
    let body: unknown = null;
    try {
      body = request.postDataJSON();
    } catch {
      body = null;
    }
    stub.requests.push({ method: request.method(), path, body });
    return path;
  };

  await page.route(/\/api\/calendar(\/google(\/authorize|\/connect)?)?$/, async (route) => {
    const request = route.request();
    const path = record(request);
    const method = request.method();

    if (path.endsWith("/api/calendar") && method === "GET") return route.fulfill(json(stub.settings()));

    if (path.endsWith("/google/authorize")) {
      if (options.authorizeFails)
        return route.fulfill(json({ code: "google_calendar_unavailable", message: "stub" }, options.authorizeFails));
      const origin = new URL(page.url()).origin;
      const back =
        options.consent === "deny"
          ? `${origin}/family/calendar/google?error=access_denied&state=${FAKE_STATE}`
          : `${origin}/family/calendar/google?code=${FAKE_CODE}&state=${FAKE_STATE}&scope=email`;
      return route.fulfill(json({ authorizationUrl: back }));
    }

    if (path.endsWith("/google/connect")) {
      if (options.connectError)
        return route.fulfill(json({ code: options.connectError.code, message: "stub" }, options.connectError.status));
      stub.google = {
        email: "cal@example.com",
        status: "connected",
        readCommitments: true,
        lastSyncedUtc: new Date().toISOString(),
      };
      return route.fulfill(json(stub.settings()));
    }

    if (path.endsWith("/api/calendar/google") && method === "PUT") {
      const body = request.postDataJSON() as { readCommitments: boolean };
      if (stub.google) stub.google = { ...stub.google, readCommitments: body.readCommitments };
      return route.fulfill(json(stub.settings()));
    }

    if (path.endsWith("/api/calendar/google") && method === "DELETE") {
      stub.google = null;
      return route.fulfill({ status: 204, body: "" });
    }

    return route.continue();
  });
  return stub;
}
