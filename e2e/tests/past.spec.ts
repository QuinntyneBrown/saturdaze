import { test, expect } from "../fixtures/sd-test.js";
import { ensureCurrentWeekend, registerThrowaway } from "../fixtures/auth.js";

/**
 * Past weekends — history cards with favourite / rename (D14) / rate (D13),
 * client-side filters, the "Skipping next time" strip, and Repeat (D15) /
 * Remix (D16) which replace the current draft and land on /weekend.
 */

test.describe("Past weekends", () => {
  test.beforeEach(async ({ goto, pages, request, signIn }) => {
    // history?take=50 needs at least the current weekend to exist
    const session = await signIn();
    if (session) await ensureCurrentWeekend(request, session);
    await goto("past");
    await pages.past.waitForReady();
  });

  test("header, filters and nav state", async ({ pages }) => {
    const p = pages.past;
    await expect(p.pageTitle()).toHaveText("Past weekends");
    await expect(p.pageSubtitle()).not.toBeEmpty();
    await expect(p.filterChip("All")).toHaveAttribute("aria-pressed", "true");
    for (const name of ["Favourites", "This year", "5★"]) {
      await expect(p.filterChip(name)).toHaveAttribute("aria-pressed", "false");
    }
    await expect(p.activeNavLink()).toHaveAttribute("data-nav", "past");
  });

  test("cards carry a date eyebrow, favourite, rename, stars, highlights and Remix / Repeat", async ({ pages }) => {
    const p = pages.past;
    test.skip((await p.cards().count()) === 0, "no history for this family yet");
    const card = p.cards().first();
    await expect(p.cardEyebrow(card)).toContainText(/\d{4}/);
    await expect(p.favouriteButton(card)).toHaveAttribute("aria-pressed", /true|false/);
    await expect(p.renameButton(card)).toHaveAttribute("aria-label", /^Rename: /);
    await expect(p.starsButton(card)).toHaveAttribute("aria-label", /^Rate this weekend, currently [0-5] of 5$/);
    await expect(p.starsLabel(card)).toHaveText(/[0-5] of 5/);
    await expect(p.remixButton(card)).toBeVisible();
    await expect(p.repeatButton(card)).toBeVisible();
  });

  test("favourite toggles, persists, and the Favourites filter honours it", async ({ page, pages }) => {
    const p = pages.past;
    test.skip((await p.cards().count()) === 0, "no history for this family yet");
    const card = p.cards().first();
    const title = (await p.cardTitle(card).textContent())!.trim();
    const fav = p.favouriteButton(card);
    const before = await fav.getAttribute("aria-pressed");

    const saved = page.waitForResponse((r) => /\/api\/weekends\/[^/]+\/favourite/.test(r.url()));
    await fav.click();
    expect((await saved).ok()).toBeTruthy();
    const after = before === "true" ? "false" : "true";
    await expect(fav).toHaveAttribute("aria-pressed", after);

    await p.filterChip("Favourites").click();
    if (after === "true") await expect(p.card(title)).toBeVisible();
    else await expect(p.card(title)).toHaveCount(0);
    await p.filterChip("All").click();

    await page.reload();
    await p.waitForReady();
    await expect(p.favouriteButton(p.card(title))).toHaveAttribute("aria-pressed", after);
    await p.favouriteButton(p.card(title)).click();
    await expect(p.favouriteButton(p.card(title))).toHaveAttribute("aria-pressed", before!);
  });

  test("rename opens D14 and updates the title", async ({ page, pages }) => {
    const p = pages.past;
    test.skip((await p.cards().count()) === 0, "no history for this family yet");
    const card = p.cards().first();
    const original = (await p.cardTitle(card).textContent())!.trim();
    const renamed = `${original} ✎`;

    await p.renameButton(card).click();
    await expect(p.dialogTitle()).toHaveText("Rename this weekend");
    await expect(p.dialogField("Title")).toHaveValue(original);
    await p.dialogField("Title").fill(renamed);
    const saved = page.waitForResponse((r) => /\/api\/weekends\/[^/]+\/title/.test(r.url()));
    await p.dialogAction("Save").click();
    expect((await saved).ok()).toBeTruthy();
    await expect(p.dialog()).toHaveCount(0);
    await expect(p.cardTitle(p.cards().first())).toHaveText(renamed);

    // restore
    await p.renameButton(p.cards().first()).click();
    await p.dialogField("Title").fill(original);
    await p.dialogAction("Save").click();
    await expect(p.cardTitle(p.cards().first())).toHaveText(original);
  });

  test("rating opens D13 with five radio stars and saves the choice", async ({ page, pages }) => {
    const p = pages.past;
    test.skip((await p.cards().count()) === 0, "no history for this family yet");
    const card = p.cards().first();

    await p.starsButton(card).click();
    await expect(p.dialogTitle()).toHaveText("How was it?");
    const stars = p.dialog().getByRole("radiogroup", { name: "Rating" });
    await expect(stars.getByRole("radio")).toHaveCount(5);
    await stars.getByRole("radio", { name: "4 stars" }).click();
    await expect(stars.getByRole("radio", { name: "4 stars" })).toHaveAttribute("aria-checked", "true");

    const saved = page.waitForResponse((r) => /\/api\/weekends\/[^/]+\/rating/.test(r.url()));
    await p.dialogAction("Save").click();
    expect((await saved).ok()).toBeTruthy();
    await expect(p.starsButton(p.cards().first())).toHaveAttribute("aria-label", "Rate this weekend, currently 4 of 5");
    await expect(p.starsLabel(p.cards().first())).toHaveText("4 of 5");
  });

  test("'5★' filter keeps only five-star weekends", async ({ pages }) => {
    const p = pages.past;
    await p.filterChip("5★").click();
    await expect(p.filterChip("5★")).toHaveAttribute("aria-pressed", "true");
    const n = await p.cards().count();
    for (let k = 0; k < n; k++) {
      await expect(p.starsLabel(p.cards().nth(k))).toHaveText("5 of 5");
    }
  });

  test("Repeat confirms in D15 (danger) and lands on the weekend", async ({ page, pages }) => {
    const p = pages.past;
    test.skip((await p.cards().count()) === 0, "no history for this family yet");
    await p.repeatButton(p.cards().first()).click();
    await expect(p.dialogTitle()).toHaveText("Use this weekend again?");
    await expect(p.dialogAction("Replace draft")).toHaveClass(/btn--danger/);
    await p.dialogAction("Cancel").click();
    await expect(p.dialog()).toHaveCount(0);

    await p.repeatButton(p.cards().first()).click();
    const repeated = page.waitForResponse((r) => /\/api\/weekends\/[^/]+\/repeat/.test(r.url()));
    await p.dialogAction("Replace draft").click();
    expect((await repeated).ok()).toBeTruthy();
    await page.waitForURL("**/weekend");
  });

  test("Remix confirms in D16 and lands on the weekend", async ({ page, pages }) => {
    const p = pages.past;
    test.skip((await p.cards().count()) === 0, "no history for this family yet");
    await p.remixButton(p.cards().first()).click();
    await expect(p.dialogTitle()).toHaveText("Remix this weekend?");
    const remixed = page.waitForResponse((r) => /\/api\/weekends\/[^/]+\/remix/.test(r.url()));
    await p.dialogAction("Remix").click();
    expect((await remixed).ok()).toBeTruthy();
    await page.waitForURL("**/weekend");
  });
});

test.describe("Past weekends — filtered empty", () => {
  test("Favourites with nothing favourited shows the filtered empty state", async ({ goto, pages, request, signIn }) => {
    const session = await signIn();
    if (session) await ensureCurrentWeekend(request, session);
    await goto("past");
    const p = pages.past;
    await p.waitForReady();
    // Clear every favourite first so the filter has nothing to show.
    let n = await p.favouriteCards().count();
    while (n > 0) {
      await p.favouriteButton(p.favouriteCards().first()).click();
      await expect(p.favouriteCards()).toHaveCount(n - 1);
      n -= 1;
    }
    await p.filterChip("Favourites").click();
    await expect(p.cards()).toHaveCount(0);
    await expect(p.empty).toBeVisible();
    await p.filterChip("All").click();
    await expect(p.empty).toHaveCount(0);
  });
});

test.describe("Past weekends — empty", () => {
  test("a brand-new family sees 'Nothing here yet'", async ({ page, pages, request, signIn }) => {
    const account = await registerThrowaway(request, "past");
    await signIn(account);
    await page.goto("/past");
    await pages.past.waitForReady();
    await expect(pages.past.emptyTitle()).toHaveText("Nothing here yet");
    await expect(pages.past.cards()).toHaveCount(0);
    await expect(pages.past.strip).toHaveCount(0);
  });

  test("?state=empty renders 'Nothing here yet' with a link to this weekend", async ({ page, goto, pages }) => {
    await goto("pastEmpty");
    await pages.past.waitForReady();
    const p = pages.past;
    await expect(p.pageSubtitle()).toContainText("Your first weekend lands here");
    await expect(p.emptyTitle()).toHaveText("Nothing here yet");
    await expect(p.cards()).toHaveCount(0);
    await p.goToWeekendButton().click();
    await page.waitForURL("**/weekend");
  });
});
