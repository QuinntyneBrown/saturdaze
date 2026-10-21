import { test, expect } from "../fixtures/sd-test.js";
import {
  apiLogin,
  createProspect,
  SEEDED_ADMIN,
  sendInvitations,
  uniqueEmail,
} from "../fixtures/auth.js";
import { pathFor } from "../fixtures/routes.js";

/**
 * Join Saturdaze (L2-161): the invited person opens the link an administrator
 * sent, sees the sample weekend planned for their family, and creates their
 * account in one step. Invitations are minted per test through the admin API.
 */

const PASSWORD = "Riverwood-24-Oct";

test.describe("Join from an admin invite", () => {
  test("an invite with a sample weekend shows the plan and creates the account that owns it", async ({
    page,
    pages,
    request,
  }) => {
    // Traces to: L2-161 AC7
    const admin = await apiLogin(request, SEEDED_ADMIN);
    const prospect = await createProspect(request, admin, "The Riveras");
    const email = uniqueEmail("join");
    const [sent] = await sendInvitations(request, admin, [email], prospect.id);

    const join = pages.join;
    await join.open(sent.url);

    await expect(join.sitebar).toBeVisible();
    await expect(join.heroTitle()).toHaveText(
      "A weekend planned for The Riveras",
    );
    await expect(join.heroSubtitle()).toContainText(SEEDED_ADMIN.email);
    await expect(join.blocks("Saturday").first()).toBeVisible();
    await expect(join.blocks("Sunday").first()).toBeVisible();
    await expect(join.emailField()).toHaveValue(email);
    await expect(join.emailField()).toHaveAttribute("readonly", "");
    const firstActivity = prospect.weekend.blocks.find(
      (b) => b.kind === "Activity",
    )!.title;
    await expect(
      join
        .blockTitle(join.blocks("Saturday"))
        .filter({ hasText: firstActivity }),
    ).toHaveCount(1);

    await join.join(PASSWORD);

    await page.waitForURL(/\/weekend$/);
    const weekend = pages.weekend;
    await weekend.waitForReady();
    await expect(weekend.block(firstActivity, "Saturday")).toBeVisible();
  });

  test("an invite without a sample weekend shows the card alone", async ({
    page,
    pages,
    request,
  }) => {
    // Traces to: L2-161 AC8
    const admin = await apiLogin(request, SEEDED_ADMIN);
    const email = uniqueEmail("plain");
    const [sent] = await sendInvitations(request, admin, [email]);

    const join = pages.join;
    await join.open(sent.url);

    await expect(join.cardTitle()).toHaveText("Join Saturdaze");
    await expect(join.daysGrid).toHaveCount(0);
    await expect(join.emailField()).toHaveValue(email);
    await join.join(PASSWORD);
    await page.waitForURL(/\/weekend$/);
  });

  test("an unusable link says so and offers sign-in", async ({
    page,
    pages,
  }) => {
    // Traces to: L2-161 AC8
    const join = pages.join;
    await page.goto(pathFor("join").replace("{token}", "no-such-token"));
    await join.waitForReady();

    await expect(join.cardTitle()).toHaveText("This invite no longer works");
    await expect(join.signInLink()).toBeVisible();
    await expect(join.submitButton()).toHaveCount(0);
  });

  test("the sample page fits every width and the days stack below 1024px", async ({
    page,
    pages,
    request,
  }) => {
    // Traces to: L2-161 AC9
    const admin = await apiLogin(request, SEEDED_ADMIN);
    const prospect = await createProspect(request, admin, "The Widths");
    const [sent] = await sendInvitations(
      request,
      admin,
      [uniqueEmail("width")],
      prospect.id,
    );
    const join = pages.join;
    await join.open(sent.url);

    for (const width of [390, 820, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      expect(await join.hasHorizontalOverflow(), `${width}px`).toBe(false);
      expect(await join.dayColumns(), `days at ${width}px`).toBe(
        width >= 1024 ? 2 : 1,
      );
    }
  });
});
