import { test, expect } from "../fixtures/sd-test.js";
import { dateTile, upcomingSaturdayIso } from "../fixtures/dates.js";

/**
 * Ideas · Events — window / category filters, the Saturday / Sunday /
 * Coming soon sections, Details links, and Suggest an event (D10 → D11 →
 * "Your suggestion" pending card).
 */

test.describe("Ideas — Events", () => {
  test.beforeEach(async ({ goto, pages }) => {
    await goto("ideasEvents");
    await pages.ideas.waitForReady();
  });

  test("header with Suggest an event, segments and default filters", async ({ pages }) => {
    const i = pages.ideas;
    await expect(i.pageTitle()).toHaveText("Ideas");
    await expect(i.suggestEventButton()).toBeVisible();
    await expect(i.activeSegment()).toHaveText("Events");
    await expect(i.filterChip("This weekend")).toHaveAttribute("aria-pressed", "true");
    await expect(i.filterChip("Next weekend")).toHaveAttribute("aria-pressed", "false");
    for (const name of ["Outdoor", "Indoor", "Seasonal", "Theatre", "Festivals"]) {
      await expect(i.filterChip(name)).toHaveAttribute("aria-pressed", "false");
    }
  });

  // Traces to: L2-146 AC3
  test("Outdoor and Indoor keep only events in that setting", async ({ pages }) => {
    const i = pages.ideas;
    for (const setting of ["Outdoor", "Indoor"] as const) {
      await i.filterChip(setting).click();
      await expect(i.filterChip(setting)).toHaveAttribute("aria-pressed", "true");
      const cards = i.eventCards();
      await expect(cards.first()).toBeVisible();
      for (const card of await cards.all()) {
        await expect(i.cardChips(card).filter({ hasText: new RegExp(`^\\s*${setting}\\s*$`) })).toHaveCount(1);
      }
    }
  });

  // Traces to: L2-146 AC4
  test("the Festival category reads Festivals on its chip and Festival on its cards", async ({ pages }) => {
    const i = pages.ideas;
    await i.filterChip("Festivals").click();
    const cards = i.eventCards();
    await expect(cards.first()).toBeVisible();
    for (const card of await cards.all()) {
      await expect(i.cardChips(card).filter({ hasText: /^\s*Festival\s*$/ })).toHaveCount(1);
    }
  });

  test("Saturday and Sunday sections are dated to the upcoming weekend", async ({ pages }) => {
    const i = pages.ideas;
    const sat = upcomingSaturdayIso();
    const satTile = dateTile(sat);
    await expect(i.sectionSubtitle(i.section("Saturday"))).toContainText(satTile.day);
    await expect(i.section("Sunday")).toBeVisible();
    await expect(i.section("Coming soon")).toBeVisible();
    const cards = i.cards(i.section("Saturday"));
    if ((await cards.count()) > 0) {
      await expect(i.dateTile(cards.first()).locator(".date-tile__d")).toHaveText(satTile.day);
    }
  });

  test("Details links open externally; cards without a URL have no footer", async ({ pages }) => {
    const i = pages.ideas;
    const withDetails = i.cardsWithDetails();
    const n = await withDetails.count();
    for (let k = 0; k < n; k++) {
      const link = i.detailsLink(withDetails.nth(k));
      await expect(link).toHaveAttribute("target", "_blank");
      await expect(link).toHaveAttribute("href", /^https?:\/\//);
    }
    const without = i.cardsWithoutDetails();
    if ((await without.count()) > 0) {
      await expect(i.cardFooter(without.first())).toHaveCount(0);
    }
  });

  test("a category chip narrows the cards to that category", async ({ pages }) => {
    const i = pages.ideas;
    const all = await i.cards().count();
    await i.filterChip("Theatre").click();
    await expect(i.filterChip("Theatre")).toHaveAttribute("aria-pressed", "true");
    const theatre = i.eventCards();
    expect(await theatre.count()).toBeLessThanOrEqual(all);
    const n = await theatre.count();
    for (let k = 0; k < n; k++) {
      await expect(i.cardChips(theatre.nth(k)).filter({ hasText: "Theatre" })).toHaveCount(1);
    }
    await i.filterChip("Theatre").click();
    await expect(i.filterChip("Theatre")).toHaveAttribute("aria-pressed", "false");
    expect(await i.cards().count()).toBe(all);
  });

  test("'Next weekend' moves the window", async ({ pages }) => {
    const i = pages.ideas;
    await i.filterChip("Next weekend").click();
    await expect(i.filterChip("Next weekend")).toHaveAttribute("aria-pressed", "true");
    await expect(i.filterChip("This weekend")).toHaveAttribute("aria-pressed", "false");
    await expect(i.section("Saturday")).toBeVisible();
  });

  test("Suggest an event: Send suggestion, then D11 and the pending card appear", async ({ page, pages }) => {
    const i = pages.ideas;
    const title = `Buskerfest e2e ${Date.now().toString(36)}`;

    await i.suggestEventButton().click();
    await expect(i.dialogTitle()).toHaveText("Suggest an event");
    await expect(i.dialogField("Title")).toBeFocused();

    await i.dialogField("Title").fill(title);
    await expect(i.dialogField("Starts")).not.toHaveValue("");
    await i.dialogField("Location").fill("Memorial Park, Lakeshore Rd");
    await i.dialogField("Cost").fill("Free");
    await i.dialogField("Ages").fill("All ages");

    const submitted = page.waitForResponse((r) => r.url().endsWith("/api/events/submissions") && r.request().method() === "POST");
    await i.dialogAction("Send suggestion").click();
    expect((await submitted).status()).toBeLessThan(300);

    await expect(i.dialogTitle()).toHaveText("Thanks, it is in the queue");
    await expect(i.dialogBody().locator(".card__title")).toHaveText(title);
    await expect(i.dialogBody().locator(".chip--sun")).toHaveText("Pending review");
    await i.dialogAction("Done").click();
    await expect(i.dialog()).toHaveCount(0);

    const mine = i.yourSuggestionSection();
    await expect(mine).toBeVisible();
    const card = i.card(title, mine);
    await expect(card).toHaveClass(/card--muted/);
    await expect(i.cardChips(card).first()).toHaveText("Pending review");
  });

  // Traces to: L2-140 AC2
  test("a field that swaps its hint for an error describes itself only with elements in the page", async ({ pages }) => {
    const i = pages.ideas;
    await i.suggestEventButton().click();
    await i.dialogField("Starts").fill("");
    await expect(i.dialogField("Starts")).toHaveAttribute("aria-invalid", "true");
    expect(await i.describedByIdsMissing(i.dialogField("Starts"))).toEqual([]);
  });

  // Traces to: L2-134 AC1-AC3
  test("Suggest an event: with no title the action stays enabled and a press shows a focused error summary", async ({ page, pages }) => {
    const i = pages.ideas;
    let sent = false;
    await page.route(/\/api\/events\/submissions$/, (route) => {
      sent = true;
      return route.abort();
    });

    await i.suggestEventButton().click();
    await expect(i.dialogAction("Send suggestion")).toBeEnabled();

    await i.dialogAction("Send suggestion").click();
    await expect(i.dialogTitle()).toHaveText("Suggest an event");
    await expect(i.dialogErrorSummary()).toBeFocused();
    await expect(i.dialogErrorSummary()).toContainText("One thing to fix");
    await expect(i.dialogField("Title")).toHaveAttribute("aria-invalid", "true");
    expect(sent).toBe(false);

    await i.dialogErrorLink("Enter a title for the event").click();
    await expect(i.dialogField("Title")).toBeFocused();

    await i.dialogField("Title").fill("Buskerfest");
    await expect(i.dialogErrorSummary()).toHaveCount(0);
  });

  test("Cancel closes D10 without submitting", async ({ pages }) => {
    const i = pages.ideas;
    await i.suggestEventButton().click();
    await i.dialogField("Title").fill("Never sent");
    await i.dialogAction("Cancel").click();
    await expect(i.dialog()).toHaveCount(0);
    await expect(i.card("Never sent")).toHaveCount(0);
  });
});
