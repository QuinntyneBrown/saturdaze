import { test, expect } from "../fixtures/sd-test.js";
import { SEEDED_USER } from "../fixtures/auth.js";

/**
 * Family — the seeded Browns: members (D17 / D17b / D21), commitments
 * (D18 / D18b / D21b), home (D19), likes (D20), preference toggles that
 * save immediately, the role-gated Admin section, and the account card.
 */

test.describe("Family", () => {
  test.beforeEach(async ({ goto, pages }) => {
    await goto("family");
    await pages.family.waitForReady();
  });

  test("header and nav state", async ({ pages }) => {
    const f = pages.family;
    await expect(f.pageTitle()).toHaveText("The Browns");
    await expect(f.pageSubtitle()).toContainText("Port Credit");
    await expect(f.activeNavLink()).toHaveAttribute("data-nav", "family");
  });

  test("members list the four Browns with derived roles", async ({ pages }) => {
    const f = pages.family;
    await expect(f.memberRows()).toHaveCount(4);
    await expect(f.rowSubtitle(f.memberRow("Quinn"))).toHaveText("Parent · 38");
    await expect(f.rowSubtitle(f.memberRow("Sara"))).toHaveText("Parent · 36");
    await expect(f.rowSubtitle(f.memberRow("Eli"))).toHaveText("Kid · 9");
    await expect(f.rowSubtitle(f.memberRow("Mae"))).toHaveText("Kid · 5");
    await expect(f.addMemberRow()).toBeVisible();
  });

  test("commitments list the three anchors with day and window", async ({ pages }) => {
    const f = pages.family;
    await expect(f.commitmentRows()).toHaveCount(3);
    await expect(f.rowSubtitle(f.commitmentRow("Swim lessons"))).toHaveText("Saturdays · 9:00 to 10:00");
    await expect(f.rowSubtitle(f.commitmentRow("Church"))).toHaveText("Sundays · 10:30 to 11:45");
    await expect(f.rowSubtitle(f.commitmentRow("Workout window"))).toHaveText("Saturdays · 5:00 to 6:00pm");
    await expect(f.addCommitmentRow()).toBeVisible();
  });

  test("home, likes and preferences render from the profile", async ({ pages }) => {
    const f = pages.family;
    await expect(f.rowTitle(f.homeRow())).toHaveText("Port Credit, Mississauga");
    expect(await f.likeChips().count()).toBeGreaterThan(0);
    expect(await f.dislikeChips().count()).toBeGreaterThan(0);
    await expect(f.toggle("Budget matters")).toBeVisible();
    await expect(f.toggle("Try something new each weekend")).toBeVisible();
    await expect(f.toggle("Friday preview email")).toBeVisible();
  });

  test("editing a member opens D17 with Name + Age and saves", async ({ page, pages }) => {
    const f = pages.family;
    await f.memberRow("Mae").click();
    await expect(f.dialogTitle()).toHaveText("Edit Mae");
    await expect(f.dialogField("Name")).toHaveValue("Mae");
    await expect(f.dialogField("Age")).toHaveValue("5");
    await expect(f.dialog().locator(".field__hint")).toContainText("under 18 counts as a kid");
    await expect(f.dialogAction("Remove")).toBeVisible();

    await f.dialogField("Age").fill("6");
    const saved = page.waitForResponse((r) => r.url().endsWith("/api/family") && r.request().method() === "PUT");
    await f.dialogAction("Save").click();
    expect((await saved).ok()).toBeTruthy();
    await expect(f.dialog()).toHaveCount(0);
    await expect(f.rowSubtitle(f.memberRow("Mae"))).toHaveText("Kid · 6");

    await f.memberRow("Mae").click();
    await f.dialogField("Age").fill("5");
    await f.dialogAction("Save").click();
    await expect(f.rowSubtitle(f.memberRow("Mae"))).toHaveText("Kid · 5");
  });

  test("adding then removing a member round-trips through D17b and D21", async ({ page, pages }) => {
    const f = pages.family;
    const name = `Guest${Date.now().toString(36)}`;

    await f.addMemberRow().click();
    await expect(f.dialogTitle()).toHaveText("Add a family member");
    await expect(f.dialogAction("Add member")).toBeDisabled();
    await f.dialogField("Name").fill(name);
    await f.dialogField("Age").fill("40");
    await f.dialogAction("Add member").click();
    await expect(f.dialog()).toHaveCount(0);
    await expect(f.memberRows()).toHaveCount(5);
    await expect(f.rowSubtitle(f.memberRow(name))).toHaveText("Parent · 40");

    await f.memberRow(name).click();
    await f.dialogAction("Remove").click();
    await expect(f.dialog()).toHaveAttribute("role", "alertdialog");
    await expect(f.dialogTitle()).toHaveText(`Remove ${name} from the family?`);
    const saved = page.waitForResponse((r) => r.url().endsWith("/api/family") && r.request().method() === "PUT");
    await f.dialogAction("Remove").click();
    expect((await saved).ok()).toBeTruthy();
    await expect(f.dialog()).toHaveCount(0);
    await expect(f.memberRows()).toHaveCount(4);
  });

  test("editing a commitment opens D18 with Name, Day radio and Start/End", async ({ pages }) => {
    const f = pages.family;
    await f.commitmentRow("Swim lessons").click();
    await expect(f.dialogTitle()).toHaveText("Edit Swim lessons");
    await expect(f.dialogField("Name")).toHaveValue("Swim lessons");
    await expect(f.dialog().getByRole("radio", { name: "Saturday" })).toBeChecked();
    await expect(f.dialogField("Start")).toHaveValue("09:00");
    await expect(f.dialogField("End")).toHaveValue("10:00");
    await expect(f.dialogAction("Remove")).toBeVisible();
    await f.dialogAction("Cancel").click();
    await expect(f.dialog()).toHaveCount(0);
  });

  test("adding then removing a commitment round-trips through D18b and D21b", async ({ page, pages }) => {
    const f = pages.family;
    const name = `Piano ${Date.now().toString(36)}`;

    await f.addCommitmentRow().click();
    await expect(f.dialogTitle()).toHaveText("Add a commitment");
    await expect(f.dialogAction("Add commitment")).toBeDisabled();
    await f.dialogField("Name").fill(name);
    await f.dialog().getByRole("radio", { name: "Sunday" }).check();
    await f.dialogField("Start").fill("15:00");
    await f.dialogField("End").fill("16:00");
    const saved = page.waitForResponse((r) => r.url().endsWith("/api/family") && r.request().method() === "PUT");
    await f.dialogAction("Add commitment").click();
    expect((await saved).ok()).toBeTruthy();
    await expect(f.commitmentRows()).toHaveCount(4);
    await expect(f.rowSubtitle(f.commitmentRow(name))).toHaveText("Sundays · 3:00 to 4:00pm");

    await f.commitmentRow(name).click();
    await f.dialogAction("Remove").click();
    await expect(f.dialogTitle()).toHaveText(`Remove ${name}?`);
    await f.dialogAction("Remove").click();
    await expect(f.commitmentRows()).toHaveCount(3);
  });

  test("editing home opens D19 and cancel leaves it unchanged", async ({ pages }) => {
    const f = pages.family;
    await f.editHomeButton().click();
    await expect(f.dialogTitle()).toHaveText("Home location");
    await expect(f.dialogField("Neighbourhood or address")).toHaveValue(/Port Credit/);
    await f.dialogAction("Cancel").click();
    await expect(f.dialog()).toHaveCount(0);
    await expect(f.rowTitle(f.homeRow())).toHaveText("Port Credit, Mississauga");
  });

  test("editing likes opens D20 with two chip inputs and saves a new like", async ({ page, pages }) => {
    const f = pages.family;
    const like = `Kites${Date.now().toString(36)}`;
    const before = await f.likeChips().count();

    await f.editLikesButton().click();
    await expect(f.dialogTitle()).toHaveText("Likes and dislikes");
    await expect(f.dialog().locator(".chip-input")).toHaveCount(2);
    const likesInput = f.dialogField("Likes");
    await expect(likesInput).toHaveClass(/chip-input__field/);
    await likesInput.fill(like);
    await likesInput.press("Enter");
    const saved = page.waitForResponse((r) => r.url().endsWith("/api/family") && r.request().method() === "PUT");
    await f.dialogAction("Save").click();
    expect((await saved).ok()).toBeTruthy();
    await expect(f.likeChips()).toHaveCount(before + 1);
    await expect(f.likeChips().filter({ hasText: like })).toHaveCount(1);

    await f.editLikesButton().click();
    await f.dialog().getByRole("button", { name: `Remove ${like}`, exact: true }).click();
    await f.dialogAction("Save").click();
    await expect(f.likeChips()).toHaveCount(before);
  });

  test("a preference toggle saves immediately and survives a reload", async ({ page, pages }) => {
    const f = pages.family;
    const toggle = f.toggle("Budget matters");
    const before = await toggle.isChecked();

    const saved = page.waitForResponse((r) => r.url().endsWith("/api/family") && r.request().method() === "PUT");
    await toggle.click();
    expect((await saved).ok()).toBeTruthy();
    await expect(toggle).toBeChecked({ checked: !before });

    await page.reload();
    await f.waitForReady();
    await expect(f.toggle("Budget matters")).toBeChecked({ checked: !before });
    await f.toggle("Budget matters").click();
    await expect(f.toggle("Budget matters")).toBeChecked({ checked: before });
  });

  test("the Admin section is hidden for a regular user", async ({ pages }) => {
    await expect(pages.family.adminSection()).toHaveCount(0);
  });

  test("the account card shows the signed-in email and a Sign out button", async ({ pages }) => {
    const f = pages.family;
    await expect(f.accountEmail()).toHaveText(SEEDED_USER.email);
    await expect(f.accountSince()).toContainText(/Signed in since/);
    await expect(f.signOutButton()).toBeVisible();
  });
});

test.describe("Family — admin", () => {
  test("the Admin section links to review submissions with the pending count", async ({ page, goto, pages }) => {
    await goto("family", { as: "admin" });
    await pages.family.waitForReady();
    const f = pages.family;
    await expect(f.adminSection()).toBeVisible();
    await expect(f.rowSubtitle(f.reviewSubmissionsRow())).toHaveText(/\d+ waiting|Nothing waiting/);
    await f.reviewSubmissionsRow().click();
    await page.waitForURL("**/review-submissions");
  });
});
