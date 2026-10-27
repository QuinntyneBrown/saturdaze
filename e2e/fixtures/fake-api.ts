import { Page } from "@playwright/test";
import { seedSession, TestSession } from "./auth.js";

/**
 * An in-page stand-in for the Saturdaze API, for specs that exercise one
 * screen's requests in isolation (the onboarding wizard). `page.route`
 * answers `/api/auth/me` and the family endpoints from an in-memory family
 * that each call mutates, so a spec can assert what the screen sent and
 * what it shows afterwards without the API or a database.
 *
 * Every other `/api/**` request is answered 404 so a stray call fails loudly.
 */

export interface FakeMember {
  id: string;
  name: string;
  age: number;
  access: "None" | "Invited" | "Account";
  email: string | null;
}

export interface FakeFamily {
  id: string;
  name: string | null;
  homeLocation: string;
  budgetEnabled: boolean;
  tryNewEnabled: boolean;
  fridayPreviewEnabled: boolean;
  isOwner: boolean;
  ownerEmail: string | null;
  /** The member linked to the signed-in account, or null (L2-214). */
  selfMemberId: string | null;
  members: FakeMember[];
  commitments: Array<{ id: string; title: string; dayOfWeek: string; startTime: string; endTime: string }>;
  preferences: Array<{ id: string; kind: "Like" | "Dislike"; value: string }>;
}

export interface FakeUser {
  id: string;
  email: string;
  role: "User" | "Admin";
  emailVerifiedUtc: string | null;
  avatarUrl: string | null;
}

export interface FakeApi {
  readonly family: FakeFamily;
  readonly user: FakeUser;
  /** Make the next `PUT /api/family` fail with this status (once). */
  failNextSave(status: number): void;
}

export const FAKE_USER: FakeUser = {
  id: "u-new",
  email: "quinntynebrown@gmail.com",
  role: "User",
  emailVerifiedUtc: null,
  avatarUrl: null,
};

/**
 * A family exactly as `POST /api/auth/register` leaves it (L2-001): the
 * owner, who gave their first name and age, is its only member (L2-214).
 */
export function freshFamily(): FakeFamily {
  return {
    ...ownerlessFamily(),
    selfMemberId: "m-owner",
    members: [{ id: "m-owner", name: "Quinn", age: 38, access: "Account", email: FAKE_USER.email }],
  };
}

/** A family whose owner is not in Who's in yet, as Google sign-in leaves it (L2-215, L2-217). */
export function ownerlessFamily(): FakeFamily {
  return {
    id: "f-new",
    name: "The Browns",
    homeLocation: "",
    budgetEnabled: false,
    tryNewEnabled: false,
    fridayPreviewEnabled: true,
    isOwner: true,
    ownerEmail: FAKE_USER.email,
    selfMemberId: null,
    members: [],
    commitments: [],
    preferences: [],
  };
}

const json = (status: number, body: unknown) => ({
  status,
  contentType: "application/json",
  body: JSON.stringify(body),
});

let nextId = 1;
const id = (prefix: string) => `${prefix}-${nextId++}`;

/**
 * Seeds a signed-in session (the token is never verified by the fake) and
 * routes the API. Call before the first navigation.
 */
export async function installFakeApi(
  page: Page,
  options: { family?: FakeFamily; user?: FakeUser } = {},
): Promise<FakeApi> {
  const family = options.family ?? freshFamily();
  const user = options.user ?? { ...FAKE_USER };
  let failSave: number | null = null;

  const session: TestSession = {
    accessToken: "fake.access.token",
    refreshToken: "fake-refresh-token",
    expiresUtc: new Date(Date.now() + 3_600_000).toISOString(),
    user,
  };
  await seedSession(page, session);

  await page.route("**/api/**", async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const path = url.pathname;
    const method = req.method();

    if (path === "/api/auth/me" && method === "GET") return route.fulfill(json(200, user));

    if (path === "/api/family" && method === "GET") return route.fulfill(json(200, family));

    if (path === "/api/family" && method === "PUT") {
      if (failSave !== null) {
        const status = failSave;
        failSave = null;
        return route.fulfill(json(status, { code: "server_error", message: "boom" }));
      }
      const body = req.postDataJSON() as Partial<FakeFamily> & {
        members?: Array<{ id: string | null; name: string; age: number }>;
        preferences?: Array<{ kind: "Like" | "Dislike"; value: string }>;
      };
      if (typeof body.name !== "undefined") family.name = body.name;
      if (typeof body.homeLocation === "string") family.homeLocation = body.homeLocation;
      if (typeof body.budgetEnabled === "boolean") family.budgetEnabled = body.budgetEnabled;
      if (typeof body.tryNewEnabled === "boolean") family.tryNewEnabled = body.tryNewEnabled;
      if (typeof body.fridayPreviewEnabled === "boolean") family.fridayPreviewEnabled = body.fridayPreviewEnabled;
      if (body.members) {
        family.members = body.members.map((m) => {
          const existing = family.members.find((x) => x.id === m.id);
          return existing
            ? { ...existing, name: m.name, age: m.age }
            : { id: id("m"), name: m.name, age: m.age, access: "None", email: null };
        });
      }
      if (body.preferences) {
        family.preferences = body.preferences.map((p) => ({ id: id("p"), kind: p.kind, value: p.value }));
      }
      return route.fulfill(json(200, family));
    }

    if (path === "/api/family/members" && method === "POST") {
      const body = req.postDataJSON() as { name: string; age: number; email: string | null; self?: boolean };
      if (body.self && family.selfMemberId) return route.fulfill(json(409, { code: "already_in_family" }));
      const member: FakeMember = {
        id: id("m"),
        name: body.name,
        age: body.age,
        access: body.self ? "Account" : body.email ? "Invited" : "None",
        email: body.self ? user.email : body.email,
      };
      family.members.push(member);
      if (body.self) family.selfMemberId = member.id;
      const invite = body.email
        ? {
            email: body.email,
            token: "fake-invite-token",
            url: "http://localhost:4200/accept-invite?token=fake-invite-token",
            expiresAtUtc: new Date(Date.now() + 7 * 86_400_000).toISOString(),
          }
        : null;
      return route.fulfill(json(201, { member, invite }));
    }

    const claimed = /^\/api\/family\/members\/([^/]+)\/claim$/.exec(path);
    if (claimed && method === "POST") {
      const member = family.members.find((m) => m.id === decodeURIComponent(claimed[1]!));
      if (!member) return route.fulfill(json(404, { code: "not_found" }));
      if (family.selfMemberId) return route.fulfill(json(409, { code: "already_in_family" }));
      if (member.access !== "None") return route.fulfill(json(409, { code: "member_has_access" }));
      Object.assign(member, { access: "Account", email: user.email });
      family.selfMemberId = member.id;
      return route.fulfill(json(200, member));
    }

    const removed = /^\/api\/family\/members\/([^/]+)$/.exec(path);
    if (removed && method === "DELETE") {
      const memberId = decodeURIComponent(removed[1]!);
      const index = family.members.findIndex((m) => m.id === memberId);
      if (index < 0) return route.fulfill(json(404, { code: "not_found" }));
      family.members.splice(index, 1);
      return route.fulfill({ status: 204 });
    }

    return route.fulfill(json(404, { code: "not_found", message: `fake api: ${method} ${path}` }));
  });

  return {
    family,
    user,
    failNextSave: (status) => {
      failSave = status;
    },
  };
}
