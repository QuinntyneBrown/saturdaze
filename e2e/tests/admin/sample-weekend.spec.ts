import { Request } from "@playwright/test";
import { test, expect } from "../../fixtures/sd-test.js";
import {
  apiLogin,
  createProspect,
  SEEDED_ADMIN,
  uniqueEmail,
} from "../../fixtures/auth.js";
import { pathFor } from "../../fixtures/routes.js";

/**
 * New sample weekend (A9) and Sample weekend (A10): an administrator
 * describes a prospective family, generates its weekend (L2-159) and shapes
 * it before sending the invite (L2-160).
 */

test.describe("Admin sample weekends", () => {
  test("generating a weekend from the form lands on the sample screen", async ({
    goto,
    page,
    pages,
  }) => {
    // Traces to: L2-159 AC6
    const form = pages.adminSampleNew;
    await goto("adminSampleNew");
    await form.waitForScreen("sample-new");
    const posts: Request[] = [];
    page.on("request", (r) => {
      if (r.method() === "POST" && r.url().endsWith("/api/admin/prospects"))
        posts.push(r);
    });

    await form.familyNameInput().fill("The Riveras");
    await form.homeInput().fill("Lakeview, Mississauga, ON");
    await form.enterMembers([
      { name: "Dani", age: 38 },
      { name: "Mateo", age: 7 },
    ]);
    await form.likesInput().fill("parks");
    await form.likesInput().press("Enter");
    await form.generateButton().click();

    const sample = pages.adminSample;
    await sample.waitForScreen("sample");
    expect(page.url()).toMatch(/\/invitations\/samples\/[0-9a-f-]{36}$/);
    expect(posts).toHaveLength(1);
    await expect(sample.pageTitle()).toContainText("The Riveras");
    await expect(sample.blocks("Saturday").first()).toBeVisible();
    await expect(sample.blocks("Sunday").first()).toBeVisible();
  });

  test("the form refuses to generate without a member", async ({
    goto,
    page,
    pages,
  }) => {
    // Traces to: L2-159 AC7
    const form = pages.adminSampleNew;
    await goto("adminSampleNew");
    await form.waitForScreen("sample-new");
    let posts = 0;
    page.on("request", (r) => {
      if (r.method() === "POST" && r.url().endsWith("/api/admin/prospects"))
        posts++;
    });

    await form.familyNameInput().fill("The Riveras");
    await form.generateButton().click();

    await expect(form.formError()).toContainText(
      "Add at least one family member",
    );
    expect(posts).toBe(0);
    expect(form.currentPath()).toBe("/invitations/samples/new");
  });

  test("both screens fit every width and the days stack below 1024px", async ({
    page,
    pages,
    request,
    signInAsAdmin,
  }) => {
    // Traces to: L2-159 AC8
    const admin = await apiLogin(request, SEEDED_ADMIN);
    const prospect = await createProspect(request, admin, "The Widths");
    await signInAsAdmin();

    const form = pages.adminSampleNew;
    await page.goto(pathFor("adminSampleNew"));
    await form.waitForScreen("sample-new");
    for (const width of [390, 820, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      expect(await form.hasHorizontalOverflow(), `form at ${width}px`).toBe(
        false,
      );
    }

    const sample = pages.adminSample;
    await page.goto(pathFor("adminSample").replace("{id}", prospect.id));
    await sample.waitForScreen("sample");
    for (const width of [390, 820, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      expect(await sample.hasHorizontalOverflow(), `sample at ${width}px`).toBe(
        false,
      );
      expect(await sample.dayColumns(), `days at ${width}px`).toBe(
        width >= 1024 ? 2 : 1,
      );
    }
  });

  test("Swap replaces the pick and Lock presses the block", async ({
    page,
    pages,
    request,
    signInAsAdmin,
  }) => {
    // Traces to: L2-160 AC5
    const admin = await apiLogin(request, SEEDED_ADMIN);
    const prospect = await createProspect(request, admin, "The Shapers");
    await signInAsAdmin();
    const sample = pages.adminSample;
    await page.goto(pathFor("adminSample").replace("{id}", prospect.id));
    await sample.waitForScreen("sample");
    const swaps: Request[] = [];
    const locks: Request[] = [];
    page.on("request", (r) => {
      if (r.method() === "POST" && /\/blocks\/[0-9a-f-]+\/swap$/.test(r.url()))
        swaps.push(r);
      if (r.method() === "PUT" && /\/blocks\/[0-9a-f-]+\/lock$/.test(r.url()))
        locks.push(r);
    });

    const first = sample.swappableBlocks("Saturday").first();
    const before = (await sample.blockTitle(first).textContent()) ?? "";
    await sample.swapButton(first).click();
    await expect.poll(() => swaps.length).toBe(1);
    await expect(sample.block(before, "Saturday")).toHaveCount(0);

    // The swapped pick is the first activity now; a locked activity offers no Swap, so anchor on its title.
    const after =
      (await sample
        .blockTitle(sample.swappableBlocks("Saturday").first())
        .textContent()) ?? "";
    expect(after).not.toBe(before);
    const block = sample.block(after, "Saturday");
    const lock = sample.lockButton(block);
    await expect(lock).toHaveAttribute("aria-pressed", "false");
    await lock.click();
    await expect(sample.lockButton(block)).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(
      sample.metaChips().filter({ hasText: "1 locked" }),
    ).toBeVisible();
    expect(locks).toHaveLength(1);
    expect(locks[0].postDataJSON()).toEqual({ locked: true });
  });

  test("Send invite opens AD7 with this sample preselected", async ({
    page,
    pages,
    request,
    signInAsAdmin,
  }) => {
    // Traces to: L2-160 AC6
    const admin = await apiLogin(request, SEEDED_ADMIN);
    const prospect = await createProspect(request, admin, "The Invited");
    await signInAsAdmin();
    const sample = pages.adminSample;
    await page.goto(pathFor("adminSample").replace("{id}", prospect.id));
    await sample.waitForScreen("sample");
    const email = uniqueEmail("sample");

    await sample.sendInviteButton().click();
    await expect(sample.sampleWeekendSelect()).toHaveValue(prospect.id);
    await expect(
      sample.sampleWeekendSelect().locator("option:checked"),
    ).toHaveText(/The Invited · Sat \d+ \w+/);
    await sample.emailsInput().fill(email);
    await sample.emailsInput().press("Enter");
    await sample.sendInvitesButton().click();
    await expect(sample.dialog()).toHaveCount(0);
    await expect(sample.metaChips().first()).toHaveText("Invited · 1");

    const list = pages.adminInvitations;
    await page.goto(pathFor("adminInvitations"));
    await list.waitForScreen("invitations");
    await expect(list.inviteRowSample(list.inviteRow(email))).toHaveText(
      /Sample weekend · The Invited · Sat \d+ \w+/,
    );
    await expect(
      list.sampleRowStatus(list.sampleRow("The Invited").first()),
    ).toHaveText("Invited · 1");
  });
});
