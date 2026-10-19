import { test, expect } from "../fixtures/sd-test.js";
import { apiLogin, lockDinnerPick, SEEDED_USER } from "../fixtures/auth.js";
import { contrast } from "../fixtures/colour.js";

/**
 * Ideas · Food — day / slot / extra filters, the family vote row, See menu,
 * and "Lock it in" (D12) which locks a pick into the weekend and dims its
 * siblings.
 */

test.describe("Ideas — Food", () => {
  test.beforeEach(async ({ goto, pages }) => {
    await goto("ideasFood");
    await pages.ideas.waitForReady();
  });

  test("header, segments and default filters", async ({ pages }) => {
    const i = pages.ideas;
    await expect(i.pageTitle()).toHaveText("Ideas");
    await expect(i.activeSegment()).toHaveText("Food");
    await expect(i.filterChip("Saturday")).toHaveAttribute("aria-pressed", "true");
    await expect(i.filterChip("Sunday")).toHaveAttribute("aria-pressed", "false");
    await expect(i.filterChip("Lunch")).toHaveAttribute("aria-pressed", "true");
    await expect(i.filterChip("Dinner")).toHaveAttribute("aria-pressed", "false");
    await expect(i.filterChip("Wife-approved")).toHaveAttribute("aria-pressed", "false");
    await expect(i.filterChip("Under 15 min")).toHaveAttribute("aria-pressed", "false");
    await expect(i.filters.locator(".filters__divider")).toHaveCount(2);
  });

  test("dropped v1 affordances are gone: no Refresh picks, no Unlock", async ({ pages }) => {
    const i = pages.ideas;
    await expect(i.pageActions().getByRole("button", { name: "Refresh picks" })).toHaveCount(0);
    await expect(i.main.getByRole("button", { name: "Unlock", exact: true })).toHaveCount(0);
  });

  // Traces to: L2-147 AC3
  test("Patio keeps only picks with a patio, and pressing it again shows them all", async ({ pages }) => {
    const i = pages.ideas;
    const all = await i.cards().count();
    await i.filterChip("Patio").click();
    await expect(i.filterChip("Patio")).toHaveAttribute("aria-pressed", "true");
    const patios = i.cards();
    await expect(patios.first()).toBeVisible();
    for (const card of await patios.all()) {
      await expect(i.cardChips(card).filter({ hasText: /^\s*Patio\s*$/ })).toHaveCount(1);
    }
    await i.filterChip("Patio").click();
    await expect(i.filterChip("Patio")).toHaveAttribute("aria-pressed", "false");
    await expect(i.cards()).toHaveCount(all);
  });

  test("day and slot chips are exclusive within their group; extras toggle freely", async ({ pages }) => {
    const i = pages.ideas;
    await i.filterChip("Sunday").click();
    await expect(i.filterChip("Sunday")).toHaveAttribute("aria-pressed", "true");
    await expect(i.filterChip("Saturday")).toHaveAttribute("aria-pressed", "false");

    await i.filterChip("Dinner").click();
    await expect(i.filterChip("Dinner")).toHaveAttribute("aria-pressed", "true");
    await expect(i.filterChip("Lunch")).toHaveAttribute("aria-pressed", "false");

    await i.filterChip("Wife-approved").click();
    await expect(i.filterChip("Wife-approved")).toHaveAttribute("aria-pressed", "true");
    await i.filterChip("Under 15 min").click();
    await expect(i.filterChip("Under 15 min")).toHaveAttribute("aria-pressed", "true");
    await expect(i.filterChip("Wife-approved")).toHaveAttribute("aria-pressed", "true");
  });

  test("Lunch and Dinner sections each carry a meal window and cards", async ({ pages }) => {
    const i = pages.ideas;
    for (const section of [i.lunchSection(), i.dinnerSection()]) {
      await expect(section).toBeVisible();
      await expect(i.sectionSubtitle(section)).toContainText(/\d/);
      expect(await i.cards(section).count()).toBeGreaterThan(0);
    }
  });

  test("the top pick spans the grid and every card has a vote row, See menu and Lock it in", async ({ pages }) => {
    const i = pages.ideas;
    await expect(i.topPickCard(i.lunchSection())).toHaveCount(1);
    await expect(i.topPickCard(i.lunchSection()).locator(".chip--primary")).toHaveText("Top pick");

    const count = await i.cards(i.lunchSection()).count();
    for (let n = 0; n < count; n++) {
      const card = i.cards(i.lunchSection()).nth(n);
      await expect(i.voteRow(card)).toHaveAttribute("aria-label", /^Family vote for /);
      await expect(i.voteRow(card).locator(".vote-row__cell")).toHaveCount(4);
      await expect(i.seeMenuLink(card)).toHaveAttribute("target", "_blank");
      await expect(i.lockItInButton(card)).toBeVisible();
    }
  });

  test("a family member's vote toggles and persists", async ({ page, pages }) => {
    const i = pages.ideas;
    const card = i.regularCards(i.lunchSection()).first();
    const yes = i.voteButton(card, "Eli", "yes");
    const no = i.voteButton(card, "Eli", "no");
    const wasYes = (await yes.getAttribute("aria-pressed")) === "true";

    const saved = page.waitForResponse((r) => /\/api\/restaurants\/[^/]+\/vote/.test(r.url()));
    await (wasYes ? no : yes).click();
    expect((await saved).ok()).toBeTruthy();
    await expect(wasYes ? no : yes).toHaveAttribute("aria-pressed", "true");
    await expect(wasYes ? yes : no).toHaveAttribute("aria-pressed", "false");

    await page.reload();
    await i.waitForReady();
    await expect(wasYes ? no : yes).toHaveAttribute("aria-pressed", "true");

    // restore
    await (wasYes ? yes : no).click();
    await expect(wasYes ? yes : no).toHaveAttribute("aria-pressed", "true");
  });

  test("'Lock it in' confirms in D12, then locks the card and dims its siblings", async ({ page, pages }) => {
    const i = pages.ideas;
    // Sunday dinner: the Food visual spec locks Saturday dinner through the
    // API, and v2 has no unlock, so this test needs a slot of its own.
    await i.filterChip("Sunday").click();
    await expect(i.filterChip("Sunday")).toHaveAttribute("aria-pressed", "true");
    const section = i.dinnerSection();
    const card = i.regularCards(section).first();
    const name = (await i.cardTitle(card).textContent())!.trim();

    await i.lockItInButton(card).click();
    await expect(i.dialogTitle()).toHaveText(new RegExp(`^Lock ${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")} for Sunday dinner\\?$`));
    await expect(i.dialogBody().locator(".card__title")).toHaveText(name);
    await i.dialogAction("Not yet").click();
    await expect(i.dialog()).toHaveCount(0);

    await i.lockItInButton(card).click();
    const locked = page.waitForResponse((r) => /\/api\/restaurants\/[^/]+\/lock/.test(r.url()));
    await i.dialogAction("Lock it in").click();
    expect((await locked).ok()).toBeTruthy();

    await expect(i.lockedCard(section)).toHaveCount(1);
    await expect(i.cardTitle(i.lockedCard(section))).toHaveText(name);
    await expect(i.lockedCard(section).locator(".chip--accent").first()).toContainText(/Locked for dinner/);
    const siblings = await i.dimmedCards(section).count();
    expect(siblings).toBe((await i.cards(section).count()) - 1);
    await expect(i.dimmedCards(section).first().locator(".vote-row__btn").first()).toBeDisabled();
    await expect(i.lockItInButton(i.lockedCard(section))).toHaveCount(0);
  });
  // Traces to: L2-038 (WCAG 1.4.3)
  test("a stepped-back pick keeps its meta text readable: no opacity, 4.5:1 on its surface", async ({ goto, pages, request }) => {
    // Locking a Saturday dinner dims its siblings; v2 has no unlock, so the lock is idempotent here.
    await lockDinnerPick(request, await apiLogin(request, SEEDED_USER), "Saturday");
    await goto("ideasFood");
    const i = pages.ideas;
    await i.waitForReady();
    const dimmed = i.dimmedCards(i.dinnerSection()).first();
    await expect(dimmed).toHaveCSS("opacity", "1");
    const meta = await i.cardMeta(dimmed).evaluate((el) => getComputedStyle(el).color);
    const surface = await dimmed.evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(contrast(meta, surface)).toBeGreaterThanOrEqual(4.5);
  });
});
