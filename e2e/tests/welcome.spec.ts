import { test, expect } from "../fixtures/sd-test.js";
import { FAKE_USER, FakeApi, installFakeApi, freshFamily, ownerlessFamily } from "../fixtures/fake-api.js";

/**
 * Welcome — the onboarding wizard a new account lands in (L1-039): one
 * question per step, each saved as it is completed, each skippable.
 *
 * The API is stood in for by `fixtures/fake-api.ts` (an in-memory family
 * behind `page.route`), so every assertion is about what the wizard sends
 * and shows; the endpoints themselves are covered by the API tests and the
 * Family specs.
 */

const WIDTHS = [320, 390, 820, 1440, 1920] as const;

test.describe("Welcome — one step at a time (L2-166)", () => {
  let api: FakeApi;

  test.beforeEach(async ({ page }) => {
    api = await installFakeApi(page);
  });

  // Traces to: L2-166 AC1, AC5, AC6
  test("step 1 renders in the bare shell under a stepper reading Step 1 of 4", async ({ page, pages }) => {
    const w = pages.welcome;
    await w.open("home");
    await expect(w.body).toHaveAttribute("data-page", "welcome");
    await expect(w.body).toHaveAttribute("data-shell", "bare");
    await expect(w.stepperLabel()).toHaveText("Step 1 of 4");
    await expect(w.stepperTrack()).toHaveAttribute("aria-hidden", "true");
    await expect(w.stepperSegments()).toHaveCount(4);
    await expect(w.card().locator("h1.auth-card__title")).toHaveText("Where's home?");
    for (const width of WIDTHS) {
      await page.setViewportSize({ width, height: 900 });
      await expect(w.topbar).toHaveCount(0);
      await expect(w.bottomNav).toHaveCount(0);
      await expect(w.continueButton()).toBeVisible();
      expect(await w.hasHorizontalOverflow()).toBe(false);
    }
  });

  // Traces to: L2-166 AC2
  test("Continue and Skip for now move on; Back returns", async ({ page, pages }) => {
    const w = pages.welcome;
    await w.open("home");
    await expect(w.backButton()).toHaveCount(0);
    await w.skipButton().click();
    await page.waitForURL("**/welcome/family");
    await expect(w.stepperLabel()).toHaveText("Step 2 of 4");
    expect(api.family.homeLocation).toBe("");

    await w.backButton().click();
    await page.waitForURL("**/welcome/home");
    await expect(w.stepperLabel()).toHaveText("Step 1 of 4");

    await w.homeInput().fill("Port Credit, Mississauga");
    await w.continueButton().click();
    await page.waitForURL("**/welcome/family");
    await expect(w.stepperLabel()).toHaveText("Step 2 of 4");
  });

  // Traces to: L2-166 AC3
  test("/welcome and an unknown step open the home step", async ({ page, pages }) => {
    const w = pages.welcome;
    await page.goto("/welcome");
    await page.waitForURL("**/welcome/home");
    await w.waitForReady();
    await expect(w.stepperLabel()).toHaveText("Step 1 of 4");

    await page.goto("/welcome/nope");
    await page.waitForURL("**/welcome/home");
    await expect(w.stepperLabel()).toHaveText("Step 1 of 4");
  });

  // Traces to: L2-166 AC5
  test("the stepper's text is the progress a keyboard user hears, and Continue is reachable by Tab", async ({ page, pages }) => {
    const w = pages.welcome;
    await w.open("home");
    await w.homeInput().fill("Port Credit");
    await w.tabTo(w.continueButton());
    await page.keyboard.press("Enter");
    await page.waitForURL("**/welcome/family");
  });
});

// Traces to: L2-166 AC4
test("a signed-out visitor is sent to sign in and back to the step", async ({ page, settle }) => {
  await page.goto("/welcome/home");
  await settle();
  const url = new URL(page.url());
  expect(url.pathname).toBe("/sign-in");
  expect(url.searchParams.get("returnUrl")).toBe("/welcome/home");
});

test.describe("Welcome — where's home (L2-167)", () => {
  let api: FakeApi;

  test.beforeEach(async ({ page }) => {
    api = await installFakeApi(page);
  });

  // Traces to: L2-167 AC1, AC2
  test("Continue waits for an address, then saves it and moves on", async ({ page, pages }) => {
    const w = pages.welcome;
    await w.open("home");
    await expect(w.cardTitle()).toHaveText("Where's home?");
    await expect(w.cardSubtitle()).toHaveText("Weather and drive times start here.");
    await expect(w.homeInput()).toHaveValue("");
    await expect(w.continueButton()).toBeDisabled();

    await w.homeInput().fill("   ");
    await expect(w.continueButton()).toBeDisabled();

    await w.homeInput().fill("Port Credit, Mississauga");
    await expect(w.continueButton()).toBeEnabled();
    const saved = w.nextProfileSave();
    await w.continueButton().click();
    expect((await saved)["homeLocation"]).toBe("Port Credit, Mississauga");
    await page.waitForURL("**/welcome/family");
    expect(api.family.homeLocation).toBe("Port Credit, Mississauga");
  });

  // Traces to: L2-167 AC3
  test("a home already set is prefilled", async ({ page, pages }) => {
    await page.unroute("**/api/**");
    await installFakeApi(page, { family: { ...freshFamily(), homeLocation: "Streetsville" } });
    const w = pages.welcome;
    await w.open("home");
    await expect(w.homeInput()).toHaveValue("Streetsville");
    await expect(w.continueButton()).toBeEnabled();
  });

  // Traces to: L2-167 AC4
  test("a failed save keeps the step open with the error banner", async ({ page, pages }) => {
    const w = pages.welcome;
    await w.open("home");
    api.failNextSave(500);
    await w.homeInput().fill("Port Credit");
    await w.continueButton().click();
    await expect(w.errorBanner()).toHaveText("That did not save. Try again in a moment.");
    expect(new URL(page.url()).pathname).toBe("/welcome/home");
    await expect(w.stepperLabel()).toHaveText("Step 1 of 4");
  });
});

test.describe("Welcome — who's in (L2-168)", () => {
  let api: FakeApi;

  test.beforeEach(async ({ page, pages }) => {
    api = await installFakeApi(page);
    await pages.welcome.open("family");
  });

  // Traces to: L2-168 AC1, L2-214 AC4
  test("starts with the owner's own row and the add row", async ({ pages }) => {
    const w = pages.welcome;
    await expect(w.stepperLabel()).toHaveText("Step 2 of 4");
    await expect(w.cardTitle()).toHaveText("Who's in?");
    await expect(w.cardSubtitle()).toContainText("Ages shape the picks.");
    await expect(w.memberRows()).toHaveCount(1);
    await expect(w.rowSubtitle(w.memberRow("Quinn"))).toHaveText(`Parent · 38 · Signs in as ${FAKE_USER.email}`);
    await expect(w.addYourselfRow()).toHaveCount(0);
    await expect(w.addMemberRow()).toBeVisible();
    await expect(w.continueButton()).toBeEnabled();
  });

  // Traces to: L2-168 AC2
  test("adds a member who will not sign in through D17b", async ({ pages }) => {
    const w = pages.welcome;
    await w.addMemberRow().click();
    await expect(w.dialogTitle()).toHaveText("Add a family member");
    await expect(w.signInChoice("No sign-in")).toBeChecked();
    await w.dialogAction("Cancel").click();

    const sent = await w.addMember({ name: "Mae", age: 5 });
    expect(sent).toEqual({ name: "Mae", age: 5, email: null });
    await expect(w.dialog()).toHaveCount(0);
    await expect(w.memberRows()).toHaveCount(2);
    await expect(w.rowSubtitle(w.memberRow("Mae"))).toHaveText("Kid · 5");
    expect(api.family.members.map((m) => m.name)).toEqual(["Quinn", "Mae"]);
  });

  // Traces to: L2-168 AC3
  test("invites a member and shows the link in D30", async ({ pages }) => {
    const w = pages.welcome;
    const sent = await w.addMember({ name: "Sara", age: 36, inviteEmail: "sara@example.com" });
    expect(sent).toEqual({ name: "Sara", age: 36, email: "sara@example.com" });
    await expect(w.dialogTitle()).toHaveText("Invite ready for Sara");
    await expect(w.inviteLink()).toContainText("/accept-invite?token=");
    await w.dialogAction("Done").click();
    await expect(w.dialog()).toHaveCount(0);
    await expect(w.rowSubtitle(w.memberRow("Sara"))).toHaveText("Parent · 36 · Invite sent to sara@example.com");
  });

  // Traces to: L2-168 AC4
  test("a tapped member can be re-aged through D17 or removed through D21", async ({ page, pages }) => {
    const w = pages.welcome;
    await w.addMember({ name: "Eli", age: 9 });
    await expect(w.rowSubtitle(w.memberRow("Eli"))).toHaveText("Kid · 9");

    await w.memberRow("Eli").click();
    await expect(w.dialogTitle()).toHaveText("Edit Eli");
    await w.dialogField("Age").fill("10");
    const saved = w.nextProfileSave();
    await w.dialogAction("Save").click();
    const members = (await saved)["members"] as Array<{ name: string; age: number }>;
    expect(members).toEqual([
      { id: "m-owner", name: "Quinn", age: 38, interests: [] },
      { id: expect.any(String), name: "Eli", age: 10, interests: [] },
    ]);
    await expect(w.rowSubtitle(w.memberRow("Eli"))).toHaveText("Kid · 10");

    await w.memberRow("Eli").click();
    await w.dialogAction("Remove").click();
    await expect(w.dialogTitle()).toHaveText("Remove Eli from the family?");
    const deleted = page.waitForRequest((r) => r.method() === "DELETE" && /\/api\/family\/members\//.test(r.url()));
    await w.dialogAction("Remove").click();
    await deleted;
    await expect(w.dialog()).toHaveCount(0);
    await expect(w.memberRow("Eli")).toHaveCount(0);
    expect(api.family.members.map((m) => m.name)).toEqual(["Quinn"]);
  });

  // Traces to: L2-168 AC5
  test("Continue moves on without another family request", async ({ page, pages }) => {
    const w = pages.welcome;
    await w.addMember({ name: "Mae", age: 5 });
    await expect(w.memberRows()).toHaveCount(2);
    const requests: string[] = [];
    page.on("request", (r) => {
      if (r.url().includes("/api/family")) requests.push(`${r.method()} ${new URL(r.url()).pathname}`);
    });
    await w.continueButton().click();
    await page.waitForURL("**/welcome/likes");
    await expect(w.stepperLabel()).toHaveText("Step 3 of 4");
    expect(requests).toEqual([]);
  });
});

test.describe("Welcome — an owner who is not in Who's in yet (L2-217)", () => {
  let api: FakeApi;

  test.beforeEach(async ({ page, pages }) => {
    api = await installFakeApi(page, { family: ownerlessFamily() });
    await pages.welcome.open("family");
  });

  // Traces to: L2-217 AC4, L2-216 AC8
  test("a Google owner sees only Add yourself and adds themselves", async ({ pages }) => {
    const w = pages.welcome;
    await expect(w.memberRows()).toHaveCount(0);
    await expect(w.rowSubtitle(w.addYourselfRow())).toHaveText(
      "You're not in Who's in yet. Weekends plan for you once you are.",
    );

    await w.addYourselfRow().click();
    await expect(w.dialogTitle()).toHaveText("Add a family member");
    await expect(w.thisIsMeCheckbox()).toBeChecked();
    await expect(w.signInChoice("No sign-in")).toHaveCount(0);
    await expect(w.dialogNote()).toHaveText(
      `Linked to your account, ${FAKE_USER.email}. No invite is sent.`,
    );
    await w.dialogField("Name").fill("Quinn");
    await w.dialogField("Age").fill("38");
    const posted = w.nextMemberPost();
    await w.dialogAction("Add me").click();
    expect(await posted).toEqual({ name: "Quinn", age: 38, email: null, self: true });

    await expect(w.dialog()).toHaveCount(0);
    await expect(w.addYourselfRow()).toHaveCount(0);
    await expect(w.rowSubtitle(w.memberRow("Quinn"))).toHaveText(`Parent · 38 · Signs in as ${FAKE_USER.email}`);
    expect(api.family.selfMemberId).toBe(api.family.members[0]!.id);
  });
});

test.describe("Welcome — likes and dislikes (L2-169)", () => {
  let api: FakeApi;

  test.beforeEach(async ({ page, pages }) => {
    api = await installFakeApi(page);
    await pages.welcome.open("likes");
  });

  // Traces to: L2-169 AC1
  test("offers the two tag editors from D20", async ({ pages }) => {
    const w = pages.welcome;
    await expect(w.stepperLabel()).toHaveText("Step 3 of 4");
    await expect(w.cardTitle()).toHaveText("What does your family like?");
    await expect(w.cardSubtitle()).toHaveText("Liked tags get a boost. Disliked ones are left out.");
    await expect(w.chipInput("Likes")).toHaveClass(/chip-input__field/);
    await expect(w.chipInput("Dislikes")).toHaveClass(/chip-input__field/);
  });

  // Traces to: L2-169 AC2
  test("Continue saves the tags as Like and Dislike preferences", async ({ page, pages }) => {
    const w = pages.welcome;
    await w.addChip("Likes", "Parks");
    await w.addChip("Likes", "Zoo");
    await w.addChip("Dislikes", "Camping");
    const saved = w.nextProfileSave();
    await w.continueButton().click();
    expect((await saved)["preferences"]).toEqual([
      { kind: "Like", value: "Parks" },
      { kind: "Like", value: "Zoo" },
      { kind: "Dislike", value: "Camping" },
    ]);
    await page.waitForURL("**/welcome/preferences");
    expect(api.family.preferences.map((p) => `${p.kind}:${p.value}`)).toEqual(["Like:Parks", "Like:Zoo", "Dislike:Camping"]);
  });

  // Traces to: L2-169 AC3
  test("a like cannot also be a dislike", async ({ page, pages }) => {
    const w = pages.welcome;
    await w.addChip("Likes", "Parks");
    await w.addChip("Dislikes", "Parks");
    await expect(w.chipInputError("Dislikes")).toHaveText("Parks is in Likes. Remove it there first.");
    await expect(w.chipInput("Dislikes")).toHaveValue("Parks");
    expect(new URL(page.url()).pathname).toBe("/welcome/likes");
    expect(api.family.preferences).toEqual([]);
  });

  // Traces to: L2-169 AC4
  test("Continue with nothing added still saves and moves on", async ({ page, pages }) => {
    const w = pages.welcome;
    const saved = w.nextProfileSave();
    await w.continueButton().click();
    expect((await saved)["preferences"]).toEqual([]);
    await page.waitForURL("**/welcome/preferences");
  });

  test("tags already saved are prefilled", async ({ page, pages }) => {
    await page.unroute("**/api/**");
    await installFakeApi(page, {
      family: {
        ...freshFamily(),
        preferences: [
          { id: "p1", kind: "Like", value: "Parks" },
          { id: "p2", kind: "Dislike", value: "Camping" },
        ],
      },
    });
    const w = pages.welcome;
    await w.open("likes");
    await expect(w.card().locator(".chip.chip--leaf")).toHaveText(["Parks"]);
    await expect(w.card().locator(".chip.chip--warn")).toHaveText(["Camping"]);
  });
});

test.describe("Welcome — preferences (L2-170)", () => {
  let api: FakeApi;

  test.beforeEach(async ({ page, pages }) => {
    api = await installFakeApi(page);
    await pages.welcome.open("preferences");
  });

  // Traces to: L2-170 AC1
  test("shows the three switches at the family's current values", async ({ pages }) => {
    const w = pages.welcome;
    await expect(w.stepperLabel()).toHaveText("Step 4 of 4");
    await expect(w.cardTitle()).toHaveText("A few preferences");
    await expect(w.cardSubtitle()).toHaveText("Change these any time on Family.");
    await expect(w.toggle("Budget matters")).not.toBeChecked();
    await expect(w.toggle("Try something new each weekend")).not.toBeChecked();
    await expect(w.toggle("Friday preview email")).toBeChecked();
  });

  // Traces to: L2-170 AC2
  test("Continue saves the switches and opens the done step", async ({ page, pages }) => {
    const w = pages.welcome;
    await w.toggle("Budget matters").check();
    await w.toggle("Try something new each weekend").check();
    const saved = w.nextProfileSave();
    await w.continueButton().click();
    const body = await saved;
    expect(body["budgetEnabled"]).toBe(true);
    expect(body["tryNewEnabled"]).toBe(true);
    expect(body["fridayPreviewEnabled"]).toBe(true);
    await page.waitForURL("**/welcome/done");
    expect(api.family.budgetEnabled).toBe(true);
    expect(api.family.tryNewEnabled).toBe(true);
  });

  // Traces to: L2-170 AC3
  test("Skip for now opens the done step without a request", async ({ page, pages }) => {
    const w = pages.welcome;
    const requests: string[] = [];
    page.on("request", (r) => {
      if (r.url().includes("/api/family")) requests.push(r.method());
    });
    await w.toggle("Budget matters").check();
    await w.skipButton().click();
    await page.waitForURL("**/welcome/done");
    expect(requests).toEqual([]);
    expect(api.family.budgetEnabled).toBe(false);
  });
});

test.describe("Welcome — you're set (L2-171)", () => {
  // Traces to: L2-171 AC1, AC2
  test("names the masked email, offers the weekend and the family", async ({ page, pages }) => {
    await installFakeApi(page);
    const w = pages.welcome;
    await w.open("done");
    await expect(w.stepper()).toHaveCount(0);
    await expect(w.cardTitle()).toHaveText("You're set");
    await expect(w.cardSubtitle()).toHaveText(
      "Your first weekend is drafted around the Browns. We sent a verification link to q••••••••••••n@gmail.com. It works for 24 hours.",
    );
    await expect(w.planWeekendLink()).toHaveAttribute("href", /\/weekend$/);
    await expect(w.reviewFamilyLink()).toHaveAttribute("href", /\/family$/);
    await w.reviewFamilyLink().click();
    await page.waitForURL("**/family");

    await w.open("done");
    await w.planWeekendLink().click();
    await page.waitForURL("**/weekend");
  });

  // Traces to: L2-171 AC3
  test("a verified account is not asked to verify", async ({ page, pages }) => {
    await installFakeApi(page, {
      user: { id: "u-new", email: "quinntynebrown@gmail.com", role: "User", emailVerifiedUtc: "2026-10-20T12:00:00Z", avatarUrl: null },
    });
    const w = pages.welcome;
    await w.open("done");
    await expect(w.cardSubtitle()).toHaveText("Your first weekend is drafted around the Browns.");
  });

  test("an unnamed family is just 'your family'", async ({ page, pages }) => {
    await installFakeApi(page, {
      family: { ...freshFamily(), name: null },
      user: { id: "u-new", email: "quinntynebrown@gmail.com", role: "User", emailVerifiedUtc: "2026-10-20T12:00:00Z", avatarUrl: null },
    });
    const w = pages.welcome;
    await w.open("done");
    await expect(w.cardSubtitle()).toHaveText("Your first weekend is drafted around your family.");
  });
});
