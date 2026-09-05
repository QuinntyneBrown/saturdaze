import { Locator } from "@playwright/test";
import { test, expect } from "../../fixtures/sd-test.js";
import { isBaseline, RouteKey } from "../../fixtures/routes.js";
import { AuthCardPage } from "../../pages/auth-card.page.js";
import { SEEDED_USER } from "../../fixtures/auth.js";

/**
 * Auth parity — sign-in / create-account / reset-password / verify-email,
 * one card per state.
 *
 * The mocks pre-fill inputs with sample values (and render the strength
 * meter for that sample password). In app mode the same values are typed
 * in first and the field blurred, so inputs and the meter are compared
 * unmasked — the app's strength copy has to match the mock's. Masked-email
 * chips stay masked: the app derives them from whichever account is in
 * flight.
 */

type Pages = Parameters<Parameters<typeof test>[2]>[0]["pages"];

interface CardCase {
  readonly key: RouteKey;
  readonly pom: (p: Pages) => AuthCardPage;
  readonly state?: string;
  readonly name: string;
  /** App mode only: type the mock's sample values, then blur. */
  readonly prepare?: (pom: AuthCardPage) => Promise<void>;
  readonly masks?: (pom: AuthCardPage, state?: string) => Locator[];
}

const MOCK_PASSWORD = "password123";

async function fillAndBlur(pom: AuthCardPage, values: ReadonlyArray<[label: string, value: string]>): Promise<void> {
  let last: Locator | undefined;
  for (const [label, value] of values) {
    last = pom.field(label);
    await last.fill(value);
  }
  await last?.blur();
}

const CASES: readonly CardCase[] = [
  {
    key: "signIn", pom: (p) => p.signIn, state: "default", name: "sign-in.default",
    prepare: (pom) => fillAndBlur(pom, [["Email", SEEDED_USER.email], ["Password", MOCK_PASSWORD]]),
  },
  {
    key: "signInError", pom: (p) => p.signIn, state: "error", name: "sign-in.error",
    prepare: (pom) => fillAndBlur(pom, [["Email", SEEDED_USER.email]]),
  },
  {
    key: "createAccount", pom: (p) => p.createAccount, name: "create-account",
    prepare: async (pom) => {
      await pom.card().getByRole("checkbox", { name: /I agree to the Terms/ }).check();
      await fillAndBlur(pom, [["Family name", "The Browns"], ["Email", SEEDED_USER.email], ["Password", "lavender-17"]]);
    },
  },
  {
    key: "resetRequest", pom: (p) => p.resetPassword, state: "request", name: "reset-password.request",
    prepare: (pom) => fillAndBlur(pom, [["Email", SEEDED_USER.email]]),
  },
  {
    key: "resetSent", pom: (p) => p.resetPassword, state: "sent", name: "reset-password.sent",
    masks: (pom, s) => [pom.emailChip(s)],
  },
  {
    key: "resetNew", pom: (p) => p.resetPassword, state: "new", name: "reset-password.new",
    prepare: (pom) => fillAndBlur(pom, [["New password", "Lavender-17-May"], ["Confirm password", "Lavender-17-May"]]),
  },
  { key: "resetDone",       pom: (p) => p.resetPassword, state: "done",      name: "reset-password.done" },
  { key: "resetExpired",    pom: (p) => p.resetPassword, state: "expired",   name: "reset-password.expired" },
  {
    key: "verifySent", pom: (p) => p.verifyEmail, state: "sent", name: "verify-email.sent",
    masks: (pom, s) => [pom.cardSubtitle(s)],
  },
  { key: "verifyVerifying", pom: (p) => p.verifyEmail,   state: "verifying", name: "verify-email.verifying" },
  { key: "verifyVerified",  pom: (p) => p.verifyEmail,   state: "verified",  name: "verify-email.verified" },
  { key: "verifyExpired",   pom: (p) => p.verifyEmail,   state: "expired",   name: "verify-email.expired" },
];

test.describe("Visual: auth cards", () => {
  for (const c of CASES) {
    test(`${c.name} card`, async ({ goto, pages, settle }) => {
      await goto(c.key);
      const pom = c.pom(pages);
      await pom.waitForReady();
      if (!isBaseline() && c.prepare) await c.prepare(pom);
      await settle();
      await expect(pom.card(c.state)).toHaveScreenshot(`auth.${c.name}.png`, {
        mask: c.masks?.(pom, c.state) ?? [],
      });
    });
  }
});

test.describe("Visual: auth chrome", () => {
  test.beforeEach(async ({ goto, pages, settle }) => {
    await goto("signIn");
    await pages.signIn.waitForReady();
    await settle();
  });

  test("brand mark above the card", async ({ pages }) => {
    await expect(pages.signIn.brand()).toHaveScreenshot("auth.brand.png");
  });

  test("footer links", async ({ pages }) => {
    await expect(pages.signIn.foot()).toHaveScreenshot("auth.foot.png");
  });
});
